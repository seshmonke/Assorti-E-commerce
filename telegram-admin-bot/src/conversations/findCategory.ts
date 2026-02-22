import { type Conversation, type ConversationFlavor } from '@grammyjs/conversations';
import { type Context, Keyboard } from 'grammy';
import { apiService } from '../services/apiService';
import { mainMenuKeyboard, backKeyboard } from '../keyboards/mainMenu';
import { logger } from '../utils/logger';
import type { Category } from '../types';

type MyContext = ConversationFlavor<Context>;
type MyConversation = Conversation<MyContext, MyContext>;

const SECTION_LABELS: Record<string, string> = {
  clothing: 'Одежда',
  accessories: 'Аксессуары',
};

function formatCategoryCard(category: Category): string {
  let text = '📂 <b>Карточка категории</b>\n\n';
  text += `🆔 ID: <code>${category.id}</code>\n`;
  text += `📝 Название: <b>${category.name}</b>\n`;
  text += `🏷 Раздел: ${SECTION_LABELS[category.section] || category.section}\n`;
  text += `🔢 Порядковый номер: ${category.order}\n`;
  return text;
}

const editCategoryKeyboard = new Keyboard()
  .text('⬅️ Назад').text('✏️ Изменить название')
  .row()
  .text('✏️ Изменить раздел')
  .row()
  .text('✏️ Изменить порядковый номер')
  .resized();

const sectionKeyboard = new Keyboard()
  .text('⬅️ Назад')
  .row()
  .text('Одежда').text('Аксессуары')
  .resized();

export async function findCategoryConversation(
  conversation: MyConversation,
  ctx: MyContext,
): Promise<void> {
  await ctx.reply('Введите ID категории (UUID):', { reply_markup: backKeyboard });

  while (true) {
    const idCtx = await conversation.wait();
    const text = idCtx.message?.text?.trim();
    if (!text) continue;

    if (text === '⬅️ Назад') {
      await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
      return;
    }

    const id = text;

    let category: Category | null = null;
    try {
      category = await conversation.external(() => apiService.getCategoryById(id));
    } catch {
      await ctx.reply('⚠️ Ошибка при получении категории. Попробуйте снова:');
      continue;
    }

    if (!category) {
      await ctx.reply('❌ Категория не найдена. Введите другой ID:');
      continue;
    }

    await ctx.reply(formatCategoryCard(category), {
      parse_mode: 'HTML',
      reply_markup: editCategoryKeyboard,
    });

    // Цикл редактирования
    while (true) {
      const editCtx = await conversation.wait();
      const editText = editCtx.message?.text?.trim();
      if (!editText) continue;

      if (editText === '⬅️ Назад') {
        await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
        return;
      }

      if (editText === '✏️ Изменить название') {
        await ctx.reply('Введите новое название категории:', { reply_markup: backKeyboard });
        const valCtx = await conversation.wait();
        const val = valCtx.message?.text?.trim();
        if (!val || val === '⬅️ Назад') {
          await ctx.reply('Редактирование отменено.', { reply_markup: editCategoryKeyboard });
          continue;
        }
        try {
          await conversation.external(() => apiService.updateCategory(category!.id, { name: val }));
          await ctx.reply('✅ Название обновлено!', { reply_markup: mainMenuKeyboard });
          logger.info('Category name updated', { categoryId: category!.id });
        } catch (err) {
          logger.error('Failed to update category name', { err });
          await ctx.reply('⚠️ Ошибка при обновлении.', { reply_markup: mainMenuKeyboard });
        }
        return;

      } else if (editText === '✏️ Изменить раздел') {
        await ctx.reply('Выберите новый раздел:', { reply_markup: sectionKeyboard });
        const valCtx = await conversation.wait();
        const val = valCtx.message?.text?.trim();
        if (!val || val === '⬅️ Назад') {
          await ctx.reply('Редактирование отменено.', { reply_markup: editCategoryKeyboard });
          continue;
        }
        const section = val === 'Одежда' ? 'clothing' : val === 'Аксессуары' ? 'accessories' : null;
        if (!section) {
          await ctx.reply('❌ Выберите раздел из списка.', { reply_markup: editCategoryKeyboard });
          continue;
        }
        try {
          await conversation.external(() => apiService.updateCategory(category!.id, { section: section as any }));
          await ctx.reply('✅ Раздел обновлён!', { reply_markup: mainMenuKeyboard });
          logger.info('Category section updated', { categoryId: category!.id });
        } catch (err) {
          logger.error('Failed to update category section', { err });
          await ctx.reply('⚠️ Ошибка при обновлении.', { reply_markup: mainMenuKeyboard });
        }
        return;

      } else if (editText === '✏️ Изменить порядковый номер') {
        await ctx.reply('Введите новый порядковый номер (число):', { reply_markup: backKeyboard });
        const valCtx = await conversation.wait();
        const val = valCtx.message?.text?.trim();
        if (!val || val === '⬅️ Назад') {
          await ctx.reply('Редактирование отменено.', { reply_markup: editCategoryKeyboard });
          continue;
        }
        const order = parseInt(val, 10);
        if (isNaN(order)) {
          await ctx.reply('❌ Введите числовое значение.', { reply_markup: editCategoryKeyboard });
          continue;
        }
        try {
          await conversation.external(() => apiService.updateCategory(category!.id, { order }));
          await ctx.reply('✅ Порядковый номер обновлён!', { reply_markup: mainMenuKeyboard });
          logger.info('Category order updated', { categoryId: category!.id });
        } catch (err) {
          logger.error('Failed to update category order', { err });
          await ctx.reply('⚠️ Ошибка при обновлении.', { reply_markup: mainMenuKeyboard });
        }
        return;
      }
    }
  }
}
