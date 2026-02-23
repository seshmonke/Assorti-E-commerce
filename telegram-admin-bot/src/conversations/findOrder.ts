import { type Conversation, type ConversationFlavor } from '@grammyjs/conversations';
import { type Context, Keyboard } from 'grammy';
import { apiService } from '../services/apiService';
import { mainMenuKeyboard, backKeyboard } from '../keyboards/mainMenu';
import { logger } from '../utils/logger';
import type { Order } from '../types';
import { formatOrderCard } from './showOrders';

type MyContext = ConversationFlavor<Context>;
type MyConversation = Conversation<MyContext, MyContext>;

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

    if (text === '⬅️ Назад' || text === '🏠 Главное меню') {
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

    await ctx.reply(formatOrderCard(order), {
      parse_mode: 'HTML',
      reply_markup: buildOrderActionKeyboard(order),
    });

    let currentOrder = order;

    while (true) {
      const actionCtx = await conversation.wait();
      const actionText = actionCtx.message?.text?.trim();
      if (!actionText) continue;

      if (actionText === '⬅️ Назад') {
        await ctx.reply('🔎 Введите ID заказа (UUID):', { reply_markup: backKeyboard });
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
