import { type Conversation, type ConversationFlavor } from '@grammyjs/conversations';
import { type Context, Keyboard } from 'grammy';
import { apiService } from '../services/apiService';
import { cartService } from '../services/cartService';
import { mainMenuKeyboard, backKeyboard } from '../keyboards/mainMenu';
import { formatOrderCard, buildOrderActionKeyboard } from './showOrders';
import { logger } from '../utils/logger';
import type { Product, Order } from '../types';

type MyContext = ConversationFlavor<Context>;
type MyConversation = Conversation<MyContext, MyContext>;

function formatCartList(products: Product[]): string {
  if (products.length === 0) return '🛒 Корзина пуста.';

  const lines = products.map((p, idx) => {
    const sizes = Array.isArray(p.sizes)
      ? (p.sizes as string[]).join(', ')
      : String(p.sizes ?? '—');
    const categoryName = p.category?.name || '—';
    return `${idx + 1}. ${p.name} | ${sizes} | ${categoryName} | ${p.price} руб. | ID: ${p.id}`;
  });

  const total = products.reduce((sum, p) => sum + p.price, 0);

  return (
    `🛒 <b>Корзина (${products.length} товаров)</b>\n\n` +
    `<code>${lines.join('\n')}</code>\n\n` +
    `💰 <b>Итого: ${total} руб.</b>`
  );
}

const cartMenuKeyboard = new Keyboard()
  .text('⬅️ Назад').text('🏠 Главное меню')
  .row()
  .text('🗑 Выкинуть из корзины')
  .row()
  .text('📦 Оформить заказ').text('🧹 Очистить корзину')
  .resized();

export async function showCartConversation(
  conversation: MyConversation,
  ctx: MyContext,
): Promise<void> {
  const userId = String(ctx.from?.id ?? '');

  while (true) {
    const cart = conversation.external(() => cartService.getCart(userId));
    const products = await cart;

    if (products.length === 0) {
      await ctx.reply('🛒 Корзина пуста.\n\nДобавляйте товары через карточку товара.', {
        reply_markup: backKeyboard,
      });

      while (true) {
        const inputCtx = await conversation.wait();
        const text = inputCtx.message?.text?.trim();
        if (!text) continue;
        if (text === '⬅️ Назад' || text === '🏠 Главное меню') {
          await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
          return;
        }
      }
    }

    await ctx.reply(formatCartList(products), {
      parse_mode: 'HTML',
      reply_markup: cartMenuKeyboard,
    });

    const inputCtx = await conversation.wait();
    const text = inputCtx.message?.text?.trim();
    if (!text) continue;

    if (text === '⬅️ Назад' || text === '🏠 Главное меню') {
      await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
      return;
    }

    // === ВЫКИНУТЬ ИЗ КОРЗИНЫ ===
    if (text === '🗑 Выкинуть из корзины') {
      await ctx.reply(
        `🗑 Введите номер товара (1–${products.length}) или его ID для удаления из корзины:`,
        { reply_markup: backKeyboard },
      );

      while (true) {
        const delCtx = await conversation.wait();
        const delText = delCtx.message?.text?.trim();
        if (!delText) continue;

        if (delText === '⬅️ Назад' || delText === '🏠 Главное меню') {
          break;
        }

        const currentCart = conversation.external(() => cartService.getCart(userId));
        const currentProducts = await currentCart;

        const num = parseInt(delText, 10);
        let removed: Product | null = null;

        if (!isNaN(num) && num >= 1 && num <= currentProducts.length) {
          removed = conversation.external(() => cartService.removeFromCartByIndex(userId, num - 1)) as any;
          removed = await (removed as any);
        } else {
          removed = conversation.external(() => cartService.removeFromCartById(userId, delText)) as any;
          removed = await (removed as any);
        }

        if (removed) {
          await ctx.reply(
            `✅ Товар <b>${(removed as Product).name}</b> удалён из корзины.`,
            { parse_mode: 'HTML', reply_markup: cartMenuKeyboard },
          );
          logger.info('Product removed from cart', { productId: (removed as Product).id, userId });
        } else {
          await ctx.reply(
            `❌ Товар не найден. Введите номер от 1 до ${currentProducts.length} или ID:`,
            { reply_markup: backKeyboard },
          );
          continue;
        }
        break;
      }
      continue; // Обновляем отображение корзины
    }

    // === ОЧИСТИТЬ КОРЗИНУ ===
    if (text === '🧹 Очистить корзину') {
      conversation.external(() => cartService.clearCart(userId));
      logger.info('Cart cleared', { userId });
      await ctx.reply('🧹 Корзина очищена.', { reply_markup: mainMenuKeyboard });
      return;
    }

    // === ОФОРМИТЬ ЗАКАЗ ===
    if (text === '📦 Оформить заказ') {
      const currentCart = await conversation.external(() => cartService.getCart(userId));

      if (currentCart.length === 0) {
        await ctx.reply('🛒 Корзина пуста! Нечего оформлять.', { reply_markup: mainMenuKeyboard });
        return;
      }

      const totalPrice = currentCart.reduce((sum, p) => sum + p.price, 0);

      try {
        const order = await conversation.external(() =>
          apiService.createOrder({
            items: currentCart.map((p) => ({
              productId: p.id,
              quantity: 1,
              price: p.price,
              name: p.name,
            })),
            totalPrice,
            telegramUserId: userId,
            paymentMethod: 'cash',
          }),
        );

        logger.info('Cart order created', { orderId: order.id, itemCount: currentCart.length, userId });

        // Очищаем корзину
        conversation.external(() => cartService.clearCart(userId));

        // Показываем карточку заказа с меню управления
        await ctx.reply(
          `✅ <b>Заказ оформлен!</b>\n\n` + formatOrderCard(order),
          { parse_mode: 'HTML', reply_markup: buildOrderActionKeyboard(order) },
        );

        let currentOrder: Order = order;
        const confirmDeleteKeyboard = new Keyboard()
          .text('✅ Да, удалить').text('❌ Отмена')
          .resized();

        // Цикл управления заказом
        while (true) {
          const actionCtx = await conversation.wait();
          const actionText = actionCtx.message?.text?.trim();
          if (!actionText) continue;

          if (actionText === '⬅️ Назад' || actionText === '🏠 Главное меню') {
            await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
            return;
          }

          // ── Отметить оплаченным ──────────────────────────────────────
          if (actionText === '✅ Отметить оплаченным') {
            try {
              const updated = await conversation.external(() =>
                apiService.updateOrderStatus(currentOrder.id, { status: 'paid' }),
              );
              currentOrder = updated;
              logger.info('Order marked as paid (cash)', { orderId: currentOrder.id });
              await ctx.reply(
                '✅ Статус обновлён: <b>Оплачен</b>\n\n' + formatOrderCard(currentOrder),
                { parse_mode: 'HTML', reply_markup: buildOrderActionKeyboard(currentOrder) },
              );
            } catch (err) {
              logger.error('Failed to update order status', { err });
              await ctx.reply('⚠️ Ошибка при обновлении статуса.', {
                reply_markup: buildOrderActionKeyboard(currentOrder),
              });
            }
            continue;
          }

          // ── Отметить доставленным ────────────────────────────────────
          if (actionText === '🚚 Отметить доставленным') {
            try {
              const updated = await conversation.external(() =>
                apiService.updateOrderStatus(currentOrder.id, { status: 'delivered' }),
              );
              currentOrder = updated;
              logger.info('Order marked as delivered', { orderId: currentOrder.id });
              await ctx.reply(
                '🚚 Статус обновлён: <b>Доставлен</b>\n\n' + formatOrderCard(currentOrder),
                { parse_mode: 'HTML', reply_markup: buildOrderActionKeyboard(currentOrder) },
              );
            } catch (err) {
              logger.error('Failed to update order status', { err });
              await ctx.reply('⚠️ Ошибка при обновлении статуса.', {
                reply_markup: buildOrderActionKeyboard(currentOrder),
              });
            }
            continue;
          }

          // ── Отменить заказ ───────────────────────────────────────────
          if (actionText === '❌ Отменить заказ') {
            try {
              const updated = await conversation.external(() =>
                apiService.cancelOrder(currentOrder.id),
              );
              currentOrder = updated;
              logger.info('Order cancelled', { orderId: currentOrder.id });
              await ctx.reply(
                '❌ Заказ отменён.\n\n' + formatOrderCard(currentOrder),
                { parse_mode: 'HTML', reply_markup: buildOrderActionKeyboard(currentOrder) },
              );
            } catch (err) {
              logger.error('Failed to cancel order', { err });
              await ctx.reply('⚠️ Ошибка при отмене заказа.', {
                reply_markup: buildOrderActionKeyboard(currentOrder),
              });
            }
            continue;
          }

          // ── Удалить заказ ────────────────────────────────────────────
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
                await ctx.reply('🗑 Заказ успешно удалён.', { reply_markup: mainMenuKeyboard });
                return;
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
      } catch (err: any) {
        logger.error('Failed to create cart order', { err });
        const errorMsg = err?.response?.data?.error ?? err?.message ?? 'неизвестная ошибка';
        await ctx.reply(
          `⚠️ Ошибка при оформлении заказа: ${errorMsg}`,
          { reply_markup: cartMenuKeyboard },
        );
        continue;
      }
    }
  }
}
