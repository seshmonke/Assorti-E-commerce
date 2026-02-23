import { type Conversation, type ConversationFlavor } from '@grammyjs/conversations';
import { type Context, Keyboard, InlineKeyboard } from 'grammy';
import { apiService } from '../services/apiService';
import { mainMenuKeyboard, backKeyboard } from '../keyboards/mainMenu';
import { logger } from '../utils/logger';
import type { Order, OrderStatus } from '../types';
import { formatOrderCard } from './showOrders';

type MyContext = ConversationFlavor<Context>;
type MyConversation = Conversation<MyContext, MyContext>;

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: '⏳ Ожидает оплаты',
  paid: '✅ Оплачен',
  delivered: '🚚 Доставлен',
};

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

export async function findOrderConversation(
  conversation: MyConversation,
  ctx: MyContext,
): Promise<void> {
  await ctx.reply('🔎 Введите ID заказа (UUID):', { reply_markup: backKeyboard });

  while (true) {
    const idCtx = await conversation.wait();
    const text = idCtx.message?.text?.trim();
    if (!text) continue;

    if (text === '⬅️ Назад') {
      await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
      return;
    }

    let order: Order | null = null;
    try {
      order = await conversation.external(() => apiService.getOrderById(text));
    } catch {
      await ctx.reply('⚠️ Ошибка при поиске заказа.', { reply_markup: backKeyboard });
      continue;
    }

    if (!order) {
      await ctx.reply('❌ Заказ не найден. Введите другой ID.', { reply_markup: backKeyboard });
      continue;
    }

    // Показываем карточку заказа
    await ctx.reply(formatOrderCard(order), {
      parse_mode: 'HTML',
      reply_markup: orderActionKeyboard,
    });

    // Если есть ссылка на оплату — показываем inline-кнопку
    if (order.confirmationUrl && order.status === 'pending_payment') {
      await ctx.reply('💳 Ссылка для оплаты:', {
        reply_markup: new InlineKeyboard().url('💳 Оплатить', order.confirmationUrl),
      });
    }

    // Цикл действий с заказом
    while (true) {
      const actionCtx = await conversation.wait();
      const actionText = actionCtx.message?.text?.trim();
      if (!actionText) continue;

      if (actionText === '⬅️ Назад') {
        await ctx.reply('🔎 Введите ID заказа (UUID):', { reply_markup: backKeyboard });
        break; // выходим из внутреннего цикла, продолжаем поиск
      }

      if (actionText === '✅ Отметить оплаченным') {
        if (order!.status === 'paid') {
          await ctx.reply('ℹ️ Заказ уже оплачен.', { reply_markup: orderActionKeyboard });
          continue;
        }
        try {
          const updated = await conversation.external(() =>
            apiService.updateOrderStatus(order!.id, { status: 'paid' }),
          );
          order = updated;
          logger.info('Order marked as paid via bot', { orderId: order.id });
          await ctx.reply('✅ Статус обновлён: <b>Оплачен</b>\n\n' + formatOrderCard(order), {
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
        if (order!.status === 'delivered') {
          await ctx.reply('ℹ️ Заказ уже доставлен.', { reply_markup: orderActionKeyboard });
          continue;
        }
        try {
          const updated = await conversation.external(() =>
            apiService.updateOrderStatus(order!.id, { status: 'delivered' }),
          );
          order = updated;
          logger.info('Order marked as delivered via bot', { orderId: order.id });
          await ctx.reply('🚚 Статус обновлён: <b>Доставлен</b>\n\n' + formatOrderCard(order), {
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
          `⚠️ Вы уверены, что хотите удалить заказ <code>${order!.id}</code>?\n\nЭто действие необратимо!`,
          { parse_mode: 'HTML', reply_markup: confirmDeleteKeyboard },
        );

        const confirmCtx = await conversation.wait();
        const confirmText = confirmCtx.message?.text?.trim();

        if (confirmText === '✅ Да, удалить') {
          try {
            await conversation.external(() => apiService.deleteOrder(order!.id));
            logger.info('Order deleted via bot', { orderId: order!.id });
            await ctx.reply('🗑 Заказ успешно удалён.', { reply_markup: backKeyboard });
            break; // выходим к поиску следующего заказа
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
