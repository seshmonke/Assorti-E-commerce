import { type Conversation, type ConversationFlavor } from '@grammyjs/conversations';
import { type Context, Keyboard, InlineKeyboard } from 'grammy';
import { apiService } from '../services/apiService';
import { mainMenuKeyboard, backKeyboard } from '../keyboards/mainMenu';
import { logger } from '../utils/logger';
import type { Order, OrderStatus } from '../types';

type MyContext = ConversationFlavor<Context>;
type MyConversation = Conversation<MyContext, MyContext>;

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: '⏳ Ожидает оплаты',
  paid: '✅ Оплачен',
  delivered: '🚚 Доставлен',
};

export function formatOrderCard(order: Order): string {
  const statusLabel = STATUS_LABELS[order.status as OrderStatus] ?? order.status;
  const productName = order.product?.name ?? order.productId;
  const createdAt = new Date(order.createdAt).toLocaleString('ru-RU');

  let text = '🧾 <b>Заказ</b>\n\n';
  text += `🆔 ID: <code>${order.id}</code>\n`;
  text += `📦 Товар: <b>${productName}</b>\n`;
  text += `🔢 Количество: ${order.quantity} шт.\n`;
  text += `💰 Сумма: <b>${order.totalPrice} руб.</b>\n`;
  text += `📊 Статус: ${statusLabel}\n`;
  if (order.paymentId) {
    text += `💳 Платёж: <code>${order.paymentId}</code>\n`;
  }
  if (order.telegramUserId) {
    text += `👤 Telegram ID: ${order.telegramUserId}\n`;
  }
  text += `📅 Создан: ${createdAt}\n`;
  return text;
}

function formatOrderList(orders: Order[]): string {
  if (orders.length === 0) return '📭 Заказов не найдено.';

  const lines = orders.map((o, idx) => {
    const statusLabel = STATUS_LABELS[o.status as OrderStatus] ?? o.status;
    const productName = o.product?.name ?? o.productId;
    const shortId = o.id.slice(0, 8);
    return `${idx + 1}. #${shortId} | ${productName} | ${o.totalPrice} руб. | ${statusLabel}`;
  });

  return `📦 <b>Список заказов (${orders.length})</b>\n\n<code>${lines.join('\n')}</code>`;
}

const filterKeyboard = new Keyboard()
  .text('⬅️ Назад').text('📋 Все заказы')
  .row()
  .text('⏳ Ожидают оплаты').text('✅ Оплаченные')
  .row()
  .text('🚚 Доставленные')
  .resized();

const orderActionKeyboard = new Keyboard()
  .text('⬅️ Назад').text('✅ Отметить оплаченным')
  .row()
  .text('🚚 Отметить доставленным')
  .row()
  .text('🗑 Удалить заказ')
  .resized();

const confirmDeleteKeyboard = new Keyboard()
  .text('✅ Да, удалить').text('❌ Отмена')
  .resized();

export async function showOrdersConversation(
  conversation: MyConversation,
  ctx: MyContext,
): Promise<void> {
  await ctx.reply('📦 <b>Заказы</b>\n\nВыберите фильтр:', {
    parse_mode: 'HTML',
    reply_markup: filterKeyboard,
  });

  while (true) {
    const filterCtx = await conversation.wait();
    const filterText = filterCtx.message?.text?.trim();
    if (!filterText) continue;

    if (filterText === '⬅️ Назад') {
      await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
      return;
    }

    let statusFilter: OrderStatus | undefined;
    if (filterText === '⏳ Ожидают оплаты') statusFilter = 'pending_payment';
    else if (filterText === '✅ Оплаченные') statusFilter = 'paid';
    else if (filterText === '🚚 Доставленные') statusFilter = 'delivered';
    else if (filterText !== '📋 Все заказы') continue;

    let orders: Order[] = [];
    try {
      orders = await conversation.external(() => apiService.getAllOrders(statusFilter));
    } catch {
      await ctx.reply('⚠️ Ошибка при получении заказов.', { reply_markup: filterKeyboard });
      continue;
    }

    if (orders.length === 0) {
      await ctx.reply('📭 Заказов не ��айдено.', { reply_markup: filterKeyboard });
      continue;
    }

    await ctx.reply(formatOrderList(orders), { parse_mode: 'HTML' });
    await ctx.reply(
      '💡 Введите номер или ID (UUID) заказа для просмотра деталей, или нажмите ⬅️ Назад:',
      { reply_markup: backKeyboard },
    );

    // Цикл выбора ��аказа из списка
    while (true) {
      const idCtx = await conversation.wait();
      const idText = idCtx.message?.text?.trim();
      if (!idText) continue;

      if (idText === '⬅️ Назад') {
        // Возвращаемся к выбору фильтра
        await ctx.reply('📦 <b>Заказы</b>\n\nВыберите фильтр:', {
          parse_mode: 'HTML',
          reply_markup: filterKeyboard,
        });
        break;
      }

      // Определяем заказ: по номеру в списке или по UUID
      let selectedOrder: Order | null = null;
      const num = parseInt(idText, 10);

      if (!isNaN(num) && num >= 1 && num <= orders.length) {
        selectedOrder = orders[num - 1];
      } else {
        // Пробуем найти по UUID (полному или сокращённому)
        selectedOrder =
          orders.find((o) => o.id === idText) ??
          orders.find((o) => o.id.startsWith(idText)) ??
          null;

        if (!selectedOrder) {
          // Попытка загрузить с бэкенда по полному UUID
          try {
            selectedOrder = await conversation.external(() => apiService.getOrderById(idText));
          } catch {
            selectedOrder = null;
          }
        }
      }

      if (!selectedOrder) {
        await ctx.reply(
          `❌ Заказ не найден. Введите номер от 1 до ${orders.length} или полный UUID:`,
          { reply_markup: backKeyboard },
        );
        continue;
      }

      // Показываем карточку заказа
      await ctx.reply(formatOrderCard(selectedOrder), {
        parse_mode: 'HTML',
        reply_markup: orderActionKeyboard,
      });

      // Если есть ссылка на оплату — показываем inline-кнопку
      if (selectedOrder.confirmationUrl && selectedOrder.status === 'pending_payment') {
        await ctx.reply('💳 Ссылка для оплаты:', {
          reply_markup: new InlineKeyboard().url('💳 Оплатить', selectedOrder.confirmationUrl),
        });
      }

      // Цикл действий с заказом
      let currentOrder = selectedOrder;
      while (true) {
        const actionCtx = await conversation.wait();
        const actionText = actionCtx.message?.text?.trim();
        if (!actionText) continue;

        if (actionText === '⬅️ Назад') {
          // Возвращаемся к промпту ввода номера
          await ctx.reply(
            '💡 Введите номер или ID (UUID) заказа для просмотра деталей, или нажмите ⬅️ Назад:',
            { reply_markup: backKeyboard },
          );
          break;
        }

        if (actionText === '✅ Отметить оплаченным') {
          if (currentOrder.status === 'paid') {
            await ctx.reply('ℹ️ Заказ уже оплачен.', { reply_markup: orderActionKeyboard });
            continue;
          }
          try {
            const updated = await conversation.external(() =>
              apiService.updateOrderStatus(currentOrder.id, { status: 'paid' }),
            );
            currentOrder = updated;
            // Обновляем заказ в списке
            const idx = orders.findIndex((o) => o.id === currentOrder.id);
            if (idx !== -1) orders[idx] = currentOrder;
            logger.info('Order marked as paid via bot', { orderId: currentOrder.id });
            await ctx.reply('✅ Статус обновлён: <b>Оплачен</b>\n\n' + formatOrderCard(currentOrder), {
              parse_mode: 'HTML',
              reply_markup: orderActionKeyboard,
            });
          } catch (err) {
            logger.error('Failed to update order status', { err });
            await ctx.reply('⚠️ Ошибка при обновлении статуса.', { reply_markup: orderActionKeyboard });
          }
          continue;
        }

        if (actionText === '🚚 Отметить доставленным') {
          if (currentOrder.status === 'delivered') {
            await ctx.reply('ℹ️ Заказ уже доставлен.', { reply_markup: orderActionKeyboard });
            continue;
          }
          try {
            const updated = await conversation.external(() =>
              apiService.updateOrderStatus(currentOrder.id, { status: 'delivered' }),
            );
            currentOrder = updated;
            // Обновляем заказ в списке
            const idx = orders.findIndex((o) => o.id === currentOrder.id);
            if (idx !== -1) orders[idx] = currentOrder;
            logger.info('Order marked as delivered via bot', { orderId: currentOrder.id });
            await ctx.reply('🚚 Статус обновлён: <b>Доставлен</b>\n\n' + formatOrderCard(currentOrder), {
              parse_mode: 'HTML',
              reply_markup: orderActionKeyboard,
            });
          } catch (err) {
            logger.error('Failed to update order status', { err });
            await ctx.reply('⚠️ Ошибка при обновлении статуса.', { reply_markup: orderActionKeyboard });
          }
          continue;
        }

        if (actionText === '🗑 Удалить заказ') {
          await ctx.reply(
            `⚠️ Вы уверены, что хотите удалить заказ <code>${currentOrder.id}</code>?\n\nЭто действие необратимо!`,
            { parse_mode: 'HTML', reply_markup: confirmDeleteKeyboard },
          );

          const confirmCtx = await conversation.wait();
          const confirmText = confirmCtx.message?.text?.trim();

          if (confirmText === '✅ Да, удалить') {
            try {
              await conversation.external(() => apiService.deleteOrder(currentOrder.id));
              // Удаляем заказ из локального списка
              const idx = orders.findIndex((o) => o.id === currentOrder.id);
              if (idx !== -1) orders.splice(idx, 1);
              logger.info('Order deleted via bot', { orderId: currentOrder.id });
              await ctx.reply('🗑 Заказ успешно удалён.', { reply_markup: backKeyboard });
              break; // выходим к вводу номера следующего заказа
            } catch (err) {
              logger.error('Failed to delete order', { err });
              await ctx.reply('⚠️ Ошибка при удалении заказа.', { reply_markup: orderActionKeyboard });
            }
          } else {
            await ctx.reply('❌ Удаление отменено.', { reply_markup: orderActionKeyboard });
          }
          continue;
        }
      }
    }
  }
}
