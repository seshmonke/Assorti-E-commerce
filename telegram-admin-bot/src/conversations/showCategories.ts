import { type Conversation, type ConversationFlavor } from '@grammyjs/conversations';
import { type Context } from 'grammy';
import { apiService } from '../services/apiService';
import { mainMenuKeyboard, backKeyboard } from '../keyboards/mainMenu';
import { logger } from '../utils/logger';
import { editCategoryById } from './editCategory';
import type { Category } from '../types';

type MyContext = ConversationFlavor<Context>;
type MyConversation = Conversation<MyContext, MyContext>;

const SECTION_LABELS: Record<string, string> = {
  clothing: 'Одежда',
  accessories: 'Аксессуары',
};

function formatCategoryList(categories: Category[]): string {
  if (categories.length === 0) return '📭 Категорий не найдено.';

  const sections: Array<{ key: string; emoji: string }> = [
    { key: 'clothing', emoji: '👕' },
    { key: 'accessories', emoji: '👜' },
  ];

  let text = `📋 <b>Список категорий (${categories.length})</b>\n`;

  for (const { key, emoji } of sections) {
    const group = categories
      .filter((cat) => cat.section === key)
      .sort((a, b) => a.order - b.order);

    if (group.length === 0) continue;

    text += `\n${emoji} <b>${SECTION_LABELS[key] ?? key}:</b>\n`;
    const lines = group.map((cat, idx) => `${idx + 1}. ${cat.name} | Порядок: ${cat.order} | ID: ${cat.id}`);
    text += `<code>${lines.join('\n')}</code>\n`;
  }

  return text.trimEnd();
}

export async function showCategoriesConversation(
  conversation: MyConversation,
  ctx: MyContext,
): Promise<void> {
  let categories: Category[] = [];
  try {
    categories = await conversation.external(() => apiService.getAllCategories());
  } catch {
    logger.error('Failed to load categories in showCategoriesConversation');
    await ctx.reply('⚠️ Не удалось загрузить категории.', { reply_markup: mainMenuKeyboard });
    return;
  }

  await ctx.reply(formatCategoryList(categories), { parse_mode: 'HTML' });
  await ctx.reply(
    '💡 Введите ID категории для просмотра и редактирования, или нажмите ⬅️ Назад:',
    { reply_markup: backKeyboard },
  );

  while (true) {
    const inputCtx = await conversation.wait();
    const text = inputCtx.message?.text?.trim();
    if (!text) continue;

    if (text === '⬅️ Назад') {
      await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
      return;
    }

    const result = await editCategoryById(conversation, ctx, text);

    if (result === 'done') {
      return;
    }

    // result === 'back' — возвращаемся к промпту ввода ID
    await ctx.reply(
      '💡 Введите ID категории для просмотра и редактирования, или нажмите ⬅️ Назад:',
      { reply_markup: backKeyboard },
    );
  }
}
