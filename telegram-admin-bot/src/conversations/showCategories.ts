import { type Conversation, type ConversationFlavor } from '@grammyjs/conversations';
import { type Context } from 'grammy';
import { apiService } from '../services/apiService';
import { mainMenuKeyboard } from '../keyboards/mainMenu';
import { logger } from '../utils/logger';
import type { Category } from '../types';

type MyContext = ConversationFlavor<Context>;
type MyConversation = Conversation<MyContext, MyContext>;

const SECTION_LABELS: Record<string, string> = {
  clothing: 'Одежда',
  accessories: 'Аксессуары',
};

function formatCategoryList(categories: Category[]): string {
  if (categories.length === 0) return '📭 Категорий не найдено.';

  const lines = categories.map((cat, idx) => {
    const section = SECTION_LABELS[cat.section] ?? cat.section;
    return `${idx + 1}. ${cat.name} | ${section} | Порядок: ${cat.order} | ID: ${cat.id}`;
  });

  return `📋 <b>Список категорий (${categories.length})</b>\n\n<code>${lines.join('\n')}</code>`;
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

  await ctx.reply(formatCategoryList(categories), {
    parse_mode: 'HTML',
    reply_markup: mainMenuKeyboard,
  });
}
