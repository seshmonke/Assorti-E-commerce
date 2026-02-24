import { type Conversation, type ConversationFlavor } from '@grammyjs/conversations';
import { type Context, Keyboard } from 'grammy';
import { apiService } from '../services/apiService';
import { cartService } from '../services/cartService';
import { mainMenuKeyboard, backKeyboard } from '../keyboards/mainMenu';
import { logger } from '../utils/logger';
import type { Product } from '../types';

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
  .text('🗑 Удалить товар')
  .row()
  .text('📦 Оформить заказ')
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

    // === УДАЛИТЬ ТОВАР ===
    if (text === '🗑 Удалить товар') {
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

    // === ОФОРМИТЬ ЗАКАЗ ===
    if (text === '📦 Оформить заказ') {
      const currentCart = await conversation.external(() => cartService.getCart(userId));

      if (currentCart.length === 0) {
        await ctx.reply('🛒 Корзина пуста! Нечего оформлять.', { reply_markup: mainMenuKeyboard });
        return;
      }

      // Проверяем, нет ли забронированных товаров
      const reservedItems = currentCart.filter((p) => p.reserved);
      if (reservedItems.length > 0) {
        const names = reservedItems.map((p) => `<b>${p.name}</b>`).join(', ');
        await ctx.reply(
          `⚠️ Следующие товары уже забронированы и не могут быть включены в заказ:\n${names}\n\nУдалите их из корзины и попробуйте снова.`,
          { parse_mode: 'HTML', reply_markup: cartMenuKeyboard },
        );
        continue;
      }

      const totalPrice = currentCart.reduce((sum, p) => sum + p.price, 0);

      try {
        const order = await conversation.external(() =>
          apiService.createOrder({
            items: currentCart.map((p) => ({
              productId: p.id,
              quantity: 1,
              price: p.price,
            })),
            totalPrice,
            telegramUserId: userId,
            paymentMethod: 'cash',
          }),
        );

        logger.info('Cart order created', { orderId: order.id, itemCount: currentCart.length, userId });

        // Очищаем корзину
        conversation.external(() => cartService.clearCart(userId));

        const itemLines = currentCart.map((p, idx) => `${idx + 1}. ${p.name} — ${p.price} руб.`).join('\n');

        await ctx.reply(
          `✅ <b>Заказ оформлен!</b>\n\n` +
          `🆔 ID заказа: <code>${order.id}</code>\n` +
          `📦 Товаров: ${currentCart.length} шт.\n\n` +
          `<code>${itemLines}</code>\n\n` +
          `💰 Итого: <b>${totalPrice} руб.</b>\n` +
          `💵 Оплата: Наличными\n` +
          `📊 Статус: ⏳ Ожидает оплаты\n\n` +
          `Корзина очищена. Когда клиент оплатит — найдите заказ и отметьте его оплаченным.`,
          { parse_mode: 'HTML', reply_markup: mainMenuKeyboard },
        );
        return;
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
