import { type Conversation, type ConversationFlavor } from '@grammyjs/conversations';
import { type Context, Keyboard } from 'grammy';
import { apiService } from '../services/apiService';
import { mainMenuKeyboard, backKeyboard } from '../keyboards/mainMenu';
import { logger } from '../utils/logger';
import type { Product } from '../types';

type MyContext = ConversationFlavor<Context>;
type MyConversation = Conversation<MyContext, MyContext>;

function formatArchiveList(items: Product[]): string {
  if (items.length === 0) return '📭 Архив пуст.';

  const lines = items.map((item, idx) => {
    const sizes = Array.isArray(item.sizes)
      ? (item.sizes as string[]).join(', ')
      : String(item.sizes ?? '—');
    const categoryName = item.category?.name ?? '—';
    return `${idx + 1}. ${item.name} | ${sizes} | ${categoryName} | ${item.price} руб. | ID: ${item.id}`;
  });

  return `📁 <b>Архив (${items.length} товаров)</b>\n\n<code>${lines.join('\n')}</code>`;
}

function formatArchiveCard(item: Product): string {
  const sizes = Array.isArray(item.sizes)
    ? (item.sizes as string[]).join(', ')
    : String(item.sizes ?? '—');

  const composition =
    typeof item.composition === 'object' &&
    item.composition !== null &&
    !Array.isArray(item.composition)
      ? Object.entries(item.composition as Record<string, number>)
          .map(([k, v]) => `${k}: ${v}%`)
          .join(', ')
      : String(item.composition ?? '—');

  const categoryName = item.category?.name ?? '—';

  let text = '📁 <b>Архивный товар</b>\n\n';
  text += `🆔 ID: <code>${item.id}</code>\n`;
  text += `📝 Название: <b>${item.name}</b>\n`;
  text += `💰 Цена: <b>${item.price} руб.</b>\n`;
  text += `🖼 Картинка: ${item.image}\n`;
  text += `📂 Категория: ${categoryName}\n`;
  text += `📄 Описание: ${item.description}\n`;
  text += `📏 Размеры: ${sizes}\n`;
  text += `🧵 Состав: ${composition}\n`;
  if (item.discount !== null && item.discount !== undefined) {
    text += `🏷 Скидка: ${item.discount}%\n`;
  }
  return text;
}

const archiveItemKeyboard = new Keyboard()
  .text('⬅️ Назад').text('🏠 Главное меню')
  .row()
  .text('♻️ Разархивировать товар')
  .resized();

export async function showArchiveConversation(
  conversation: MyConversation,
  ctx: MyContext,
): Promise<void> {
  let items: Product[] = [];
  try {
    items = await conversation.external(() => apiService.getArchivedProducts());
  } catch {
    await ctx.reply('⚠️ Не удалось загрузить архив.', { reply_markup: mainMenuKeyboard });
    return;
  }

  await ctx.reply(formatArchiveList(items), { parse_mode: 'HTML' });

  if (items.length === 0) {
    await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
    return;
  }

  await ctx.reply(
    '💡 Введите номер или ID архивного товара для просмотра, или нажмите ⬅️ Назад:',
    { reply_markup: backKeyboard },
  );

  while (true) {
    const inputCtx = await conversation.wait();
    const text = inputCtx.message?.text?.trim();
    if (!text) continue;

    if (text === '⬅️ Назад' || text === '🏠 Главное меню') {
      await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
      return;
    }

    // Определяем товар по номеру или ID
    let selectedItem: Product | null = null;
    const num = parseInt(text, 10);

    if (!isNaN(num) && num >= 1 && num <= items.length) {
      selectedItem = items[num - 1] ?? null;
    } else {
      selectedItem = items.find((i) => i.id === text) ?? null;
      if (!selectedItem) {
        try {
          selectedItem = await conversation.external(() => apiService.getProductById(text));
        } catch {
          selectedItem = null;
        }
      }
    }

    if (!selectedItem) {
      await ctx.reply(
        `❌ Товар не найден. Введите номер от 1 до ${items.length} или ID:`,
        { reply_markup: backKeyboard },
      );
      continue;
    }

    // Показываем карточку архивного товара
    await ctx.reply(formatArchiveCard(selectedItem), {
      parse_mode: 'HTML',
      reply_markup: archiveItemKeyboard,
    });

    let currentItem = selectedItem;

    // Цикл действий с архивным товаром
    while (true) {
      const actionCtx = await conversation.wait();
      const actionText = actionCtx.message?.text?.trim();
      if (!actionText) continue;

      if (actionText === '⬅️ Назад') {
        // Перезагружаем список архива
        try {
          items = await conversation.external(() => apiService.getArchivedProducts());
        } catch {
          items = [];
        }
        await ctx.reply(formatArchiveList(items), { parse_mode: 'HTML' });
        if (items.length === 0) {
          await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
          return;
        }
        await ctx.reply(
          '💡 Введите номер или ID архивного товара для просмотра, или нажмите ⬅️ Назад:',
          { reply_markup: backKeyboard },
        );
        break;
      }

      if (actionText === '🏠 Главное меню') {
        await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
        return;
      }

      // === РАЗАРХИВИРОВАТЬ ТОВАР ===
      if (actionText === '♻️ Разархивировать товар') {
        try {
          const unarchived = await conversation.external(() =>
            apiService.updateProduct(currentItem.id, { archive: false }),
          );
          logger.info('Product unarchived', {
            productId: currentItem.id,
          });

          await ctx.reply(
            `✅ <b>Товар разархивирован!</b>\n\n` +
            `📦 <b>${currentItem.name}</b> вернулся в ассортимент.\n` +
            `🆔 ID товара: <code>${unarchived.id}</code>`,
            { parse_mode: 'HTML', reply_markup: mainMenuKeyboard },
          );
          return;
        } catch (err: any) {
          logger.error('Failed to unarchive product', { err });
          const errorMsg = err?.response?.data?.error ?? err?.message ?? 'неизвестная ошибка';
          await ctx.reply(
            `⚠️ Ошибка при разархивировании товара: ${errorMsg}`,
            { reply_markup: archiveItemKeyboard },
          );
          continue;
        }
      }
    }
  }
}
