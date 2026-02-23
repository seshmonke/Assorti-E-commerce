import { type Conversation, type ConversationFlavor } from '@grammyjs/conversations';
import { type Context } from 'grammy';
import { apiService } from '../services/apiService';
import { mainMenuKeyboard, backKeyboard } from '../keyboards/mainMenu';
import { logger } from '../utils/logger';
import { editProductById } from './editProduct';
import type { Product, Category } from '../types';

type MyContext = ConversationFlavor<Context>;
type MyConversation = Conversation<MyContext, MyContext>;

function buildCategoryList(categories: Category[]): string {
  const lines = ['Выберите категорию (введите номер):\n', '0. Все категории'];
  categories.forEach((cat, idx) => {
    lines.push(`${idx + 1}. ${cat.name}`);
  });
  return lines.join('\n');
}

function formatProductList(products: Product[]): string {
  if (products.length === 0) return '📭 Товаров не найдено.';

  const lines = products.map((p, idx) => {
    const sizes = Array.isArray(p.sizes)
      ? (p.sizes as string[]).join(', ')
      : String(p.sizes ?? '—');
    const categoryName = p.category?.name || '—';
    return `${idx + 1}. ${p.name} | ${sizes} | ${categoryName} | ${p.price} руб. | ID: ${p.id}`;
  });

  return `📋 <b>Список товаров (${products.length})</b>\n\n<code>${lines.join('\n')}</code>`;
}

export async function showProductsConversation(
  conversation: MyConversation,
  ctx: MyContext,
): Promise<void> {
  let categories: Category[] = [];
  try {
    categories = await conversation.external(() => apiService.getAllCategories());
  } catch {
    await ctx.reply('⚠️ Не удалось загрузить категории.', { reply_markup: mainMenuKeyboard });
    return;
  }

  await ctx.reply(buildCategoryList(categories), { reply_markup: backKeyboard });

  // Цикл выбора категории
  while (true) {
    const inputCtx = await conversation.wait();
    const text = inputCtx.message?.text?.trim();
    if (!text) continue;

    if (text === '⬅️ Назад') {
      await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
      return;
    }

    const num = parseInt(text, 10);
    if (isNaN(num) || num < 0 || num > categories.length) {
      await ctx.reply(
        `❌ Введите число от 0 до ${categories.length}:`,
        { reply_markup: backKeyboard },
      );
      continue;
    }

    let products: Product[] = [];
    try {
      if (num === 0) {
        products = await conversation.external(() => apiService.getAllProducts());
      } else {
        const selectedCategory = categories[num - 1];
        products = await conversation.external(() => apiService.getProductsByCategoryId(selectedCategory.id));
      }
    } catch {
      logger.error('Failed to load products in showProductsConversation');
      await ctx.reply('⚠️ Ошибка при загрузке товаров.', { reply_markup: backKeyboard });
      continue;
    }

    await ctx.reply(formatProductList(products), { parse_mode: 'HTML' });
    await ctx.reply(
      '💡 Введите ID товара для просмотра и редактирования, или нажмите ⬅️ Назад:',
      { reply_markup: backKeyboard },
    );

    // Цикл ввода ID товара
    while (true) {
      const idCtx = await conversation.wait();
      const idText = idCtx.message?.text?.trim();
      if (!idText) continue;

      if (idText === '⬅️ Назад') {
        // Возвращаемся к выбору категории
        await ctx.reply(buildCategoryList(categories), { reply_markup: backKeyboard });
        break;
      }

      const result = await editProductById(conversation, ctx, idText);

      if (result === 'done') {
        return;
      }

      // result === 'back' — возвращаемся к промпту ввода ID товара
      await ctx.reply(
        '💡 Введите ID товара для просмотра и редактирования, или нажмите ⬅️ Назад:',
        { reply_markup: backKeyboard },
      );
    }
  }
}
