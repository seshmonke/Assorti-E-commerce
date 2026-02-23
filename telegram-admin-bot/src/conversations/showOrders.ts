import { type Conversation, type ConversationFlavor } from '@grammyjs/conversations';
import { type Context, Keyboard } from 'grammy';
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
  cancelled: '❌ Отменён',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: '💳 Картой',
  cash: '💵 Наличными',
};

export function formatOrderCard(order: Order): string {
  const statusLabel = STATUS_LABELS[order.status as OrderStatus] ?? order.status;
  const paymentLabel = PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod;
  const productName = order.product?.name ?? order.productId;
  const createdAt = new Date(order.createdAt).toLocaleString('ru-RU');
  const reservedLabel =
    order.product !== undefined
      ? order.product.reserved
        ? '🔒 Забронирован'
        : '🟢 Свободен'
      : '—';

  let text = '🧾 <b>Заказ</b>\n\n';
  text += `🆔 ID: <code>${order.id}</code>\n`;
  text += `📦 Товар: <b>${productName}</b>\n`;
  text += `🏷 Бронь товара: ${reservedLabel}\n`;
  text += `🔢 Количество: ${order.quantity} шт.\n`;
  text += `💰 Сумма: <b>${order.totalPrice} руб.</b>\n`;
  text += `💳 Оплата: ${paymentLabel}\n`;
  text += `📊 Статус: ${statusLabel}\n`;
  if (order.paymentId) {
    text += `🔖 Платёж: <code>${order.paymentId}</code>\n`;
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

function buildOrderActionKeyboard(order: Order): Keyboard {
  const kb = new Keyboard().text('⬅️ Назад').text('🏠 Главное меню');

  if (order.status === 'pending_payment') {
    kb.row().text('✅ Отметить оплаченным');
    kb.row().text('❌ Отменить заказ');
  } else if (order.status === 'paid') {
    kb.row().text('🚚 Отметить доставленным');
  }

  kb.row().text('🗑 Удалить заказ');
  return kb.resized();
}

const filterKeyboard = new Keyboard()
  .text('⬅️ Назад').text('🏠 Главное меню')
  .row()
  .text('📋 Все заказы')
  .row()
  .text('⏳ Ожидают оплаты').text('✅ Оплаченные')
  .row()
  .text('🚚 Доставленные').text('❌ Отменённые')
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

    if (filterText === '⬅️ Назад' || filterText === '🏠 Главное меню') {
      await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
      return;
    }

    let statusFilter: OrderStatus | undefined;
    if (filterText === '⏳ Ожидают оплаты') statusFilter = 'pending_payment';
    else if (filterText === '✅ Оплаченные') statusFilter = 'paid';
    else if (filterText === '🚚 Доставленные') statusFilter = 'delivered';
    else if (filterText === '❌ Отменённые') statusFilter = 'cancelled';
    else if (filterText !== '📋 Все заказы') continue;

    let orders: Order[] = [];
    try {
      orders = await conversation.external(() => apiService.getAllOrders(statusFilter));
    } catch {
      await ctx.reply('⚠️ Ошибка при получении заказов.', { reply_markup: filterKeyboard });
      continue;
    }

    if (orders.length === 0) {
      await ctx.reply('📭 Заказов не найдено.', { reply_markup: filterKeyboard });
      continue;
    }

    await ctx.reply(formatOrderList(orders), { parse_mode: 'HTML' });
    await ctx.reply(
      '💡 Введите номер или ID заказа для просмотра, или нажмите ⬅️ Назад:',
      { reply_markup: backKeyboard },
    );

    while (true) {
      const idCtx = await conversation.wait();
      const idText = idCtx.message?.text?.trim();
      if (!idText) continue;

      if (idText === '⬅️ Назад') {
        await ctx.reply('📦 <b>Заказы</b>\n\nВыберите фильтр:', {
          parse_mode: 'HTML',
          reply_markup: filterKeyboard,
        });
        break;
      }

      if (idText === '🏠 Главное меню') {
        await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
        return;
      }

      let selectedOrder: Order | null = null;
      const num = parseInt(idText, 10);

      if (!isNaN(num) && num >= 1 && num <= orders.length) {
        selectedOrder = orders[num - 1];
      } else {
        selectedOrder =
          orders.find((o) => o.id === idText) ??
          orders.find((o) => o.id.startsWith(idText)) ??
          null;

        if (!selectedOrder) {
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

      await ctx.reply(formatOrderCard(selectedOrder), {
        parse_mode: 'HTML',
        reply_markup: buildOrderActionKeyboard(selectedOrder),
      });

      let currentOrder = selectedOrder;

      while (true) {
        const actionCtx = await conversation.wait();
        const actionText = actionCtx.message?.text?.trim();
        if (!actionText) continue;

        if (actionText === '⬅️ Назад') {
          await ctx.reply(
            '💡 Введите номер или ID заказа для просмотра, или нажмите ⬅️ Назад:',
            { reply_markup: backKeyboard },
          );
          break;
        }

        if (actionText === '🏠 Главное меню') {
          await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
          return;
        }

        // ── Отметить оплаченным ────────────────────────────────────────
        if (actionText === '✅ Отметить оплаченным') {
          try {
            const updated = await conversation.external(() =>
              apiService.updateOrderStatus(currentOrder.id, { status: 'paid' }),
            );
            currentOrder = updated;
            const idx = orders.findIndex((o) => o.id === currentOrder.id);
            if (idx !== -1) orders[idx] = currentOrder;
            logger.info('Order marked as paid (cash)', { orderId: currentOrder.id });
            await ctx.reply(
              '✅ Статус обновлён: <b>Оплачен</b>\n\n' + formatOrderCard(currentOrder),
              {
                parse_mode: 'HTML',
                reply_markup: buildOrderActionKeyboard(currentOrder),
              },
            );
          } catch (err) {
            logger.error('Failed to update order status', { err });
            await ctx.reply('⚠️ Ошибка при обновлении статуса.', {
              reply_markup: buildOrderActionKeyboard(currentOrder),
            });
          }
          continue;
        }

        // ── Отметить доставленным ──────────────────────────────────────
        if (actionText === '🚚 Отметить доставленным') {
          try {
            const updated = await conversation.external(() =>
              apiService.updateOrderStatus(currentOrder.id, { status: 'delivered' }),
            );
            currentOrder = updated;
            const idx = orders.findIndex((o) => o.id === currentOrder.id);
            if (idx !== -1) orders[idx] = currentOrder;
            logger.info('Order marked as delivered', { orderId: currentOrder.id });
            await ctx.reply(
              '🚚 Статус обновлён: <b>Доставлен</b>\n\n' + formatOrderCard(currentOrder),
              {
                parse_mode: 'HTML',
                reply_markup: buildOrderActionKeyboard(currentOrder),
              },
            );
          } catch (err) {
            logger.error('Failed to update order status', { err });
            await ctx.reply('⚠️ Ошибка при обновлении статуса.', {
              reply_markup: buildOrderActionKeyboard(currentOrder),
            });
          }
          continue;
        }

        // ── Отменить заказ ─────────────────────────────────────────────
        if (actionText === '❌ Отменить заказ') {
          try {
            const updated = await conversation.external(() =>
              apiService.cancelOrder(currentOrder.id),
            );
            currentOrder = updated;
            const idx = orders.findIndex((o) => o.id === currentOrder.id);
            if (idx !== -1) orders[idx] = currentOrder;
            logger.info('Order cancelled', { orderId: currentOrder.id });
            await ctx.reply(
              '❌ Заказ отменён. Бронь с товара снята.\n\n' + formatOrderCard(currentOrder),
              {
                parse_mode: 'HTML',
                reply_markup: buildOrderActionKeyboard(currentOrder),
              },
            );
          } catch (err) {
            logger.error('Failed to cancel order', { err });
            await ctx.reply('⚠️ Ошибка при отмене заказа.', {
              reply_markup: buildOrderActionKeyboard(currentOrder),
            });
          }
          continue;
        }

        // ── Удалить заказ ──────────────────────────────────────────────
        if (actionText === '🗑 Удалить заказ') {
          await ctx.reply(
            `⚠️ Вы уверены, что хотите удалить заказ <code>${currentOrder.id}</code>?`,
            { parse_mode: 'HTML', reply_markup: confirmDeleteKeyboard },
          );

          const confirmCtx = await conversation.wait();
          const confirmText = confirmCtx.message?.text?.trim();

          if (confirmText === '✅ Да, удалить') {
            try {
              await conversation.external(() => apiService.deleteOrder(currentOrder.id));
              const idx = orders.findIndex((o) => o.id === currentOrder.id);
              if (idx !== -1) orders.splice(idx, 1);
              logger.info('Order deleted', { orderId: currentOrder.id });
              await ctx.reply('🗑 Заказ успешно удалён.', { reply_markup: backKeyboard });
              break;
            } catch (err) {
              logger.error('Failed to delete order', { err });
              await ctx.reply('⚠️ Ошибка при удалении заказа.', {
                reply_markup: buildOrderActionKeyboard(currentOrder),
              });
            }
          } else {
            await ctx.reply('❌ Удаление отменено.', {
              reply_markup: buildOrderActionKeyboard(currentOrder),
            });
          }
          continue;
        }
      }
    }
  }
}
