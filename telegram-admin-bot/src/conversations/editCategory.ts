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

export function formatCategoryCard(category: Category): string {
  let text = '📂 <b>Карточка категории</b>\n\n';
  text += `🆔 ID: <code>${category.id}</code>\n`;
  text += `📝 Название: <b>${category.name}</b>\n`;
  text += `🏷 Раздел: ${SECTION_LABELS[category.section] || category.section}\n`;
  text += `🔢 Порядковый номер: ${category.order}\n`;
  return text;
}

export const editCategoryKeyboard = new Keyboard()
  .text('⬅️ Назад').text('🏠 Главное меню')
  .row()
  .text('🗑 Удалить категорию')
  .row()
  .text('✏️ Изменить название').text('✏️ Изменить раздел')
  .row()
  .text('⬆️ Поднять категорию').text('⬇️ Опустить категорию')
  .resized();

const confirmDeleteKeyboard = new Keyboard()
  .text('✅ Да, удалить').text('❌ Отмена')
  .resized();

const sectionKeyboard = new Keyboard()
  .text('⬅️ Назад')
  .row()
  .text('Одежда').text('Аксессуары')
  .resized();

/**
 * Загружает категорию по ID и запускает цикл редактирования.
 * Возвращает 'back' если нужно вернуться к предыдущему меню,
 * 'done' если редактирование завершено и нужно вернуться в главное меню.
 */
export async function editCategoryById(
  conversation: MyConversation,
  ctx: MyContext,
  id: string,
): Promise<'back' | 'done'> {
  let category: Category | null = null;
  try {
    category = await conversation.external(() => apiService.getCategoryById(id));
  } catch {
    await ctx.reply('⚠️ Ошибка при получении категории. Попробуйте снова.');
    return 'back';
  }

  if (!category) {
    await ctx.reply('❌ Категория не найдена. Введите другой ID.');
    return 'back';
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
      return 'back';
    }

    if (editText === '🏠 Главное меню') {
      await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
      return 'done';
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
      return 'done';

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
      return 'done';

    } else if (editText === '⬆️ Поднять категорию' || editText === '⬇️ Опустить категорию') {
      const moveUp = editText === '⬆️ Поднять категорию';

      let allCategories: Category[] = [];
      try {
        allCategories = await conversation.external(() => apiService.getAllCategories());
      } catch (err) {
        logger.error('Failed to load categories for reorder', { err });
        await ctx.reply('⚠️ Ошибка при загрузке категорий.', { reply_markup: editCategoryKeyboard });
        continue;
      }

      // Фильтруем по тому же разделу и сортируем по order
      const sameSection = allCategories
        .filter((c) => c.section === category!.section)
        .sort((a, b) => a.order - b.order);

      const currentIdx = sameSection.findIndex((c) => c.id === category!.id);

      if (currentIdx === -1) {
        await ctx.reply('⚠️ Категория не найдена в списке.', { reply_markup: editCategoryKeyboard });
        continue;
      }

      const neighborIdx = moveUp ? currentIdx - 1 : currentIdx + 1;

      if (neighborIdx < 0) {
        await ctx.reply('⚠️ Категория уже находится на первом месте в разделе.', { reply_markup: editCategoryKeyboard });
        continue;
      }

      if (neighborIdx >= sameSection.length) {
        await ctx.reply('⚠️ Категория уже находится на последнем месте в разделе.', { reply_markup: editCategoryKeyboard });
        continue;
      }

      const neighbor = sameSection[neighborIdx]!;
      const currentOrder = category!.order;
      const neighborOrder = neighbor.order;

      try {
        await conversation.external(async () => {
          await apiService.updateCategory(category!.id, { order: neighborOrder });
          await apiService.updateCategory(neighbor.id, { order: currentOrder });
        });

        // Обновляем локальный объект категории
        category = { ...category!, order: neighborOrder };

        logger.info('Category order swapped', {
          categoryId: category.id,
          newOrder: neighborOrder,
          neighborId: neighbor.id,
          neighborNewOrder: currentOrder,
        });

        await ctx.reply(
          `✅ Категория ${moveUp ? 'поднята' : 'опущена'}!\n\n` + formatCategoryCard(category),
          { parse_mode: 'HTML', reply_markup: editCategoryKeyboard },
        );
      } catch (err) {
        logger.error('Failed to swap category order', { err });
        await ctx.reply('⚠️ Ошибка при изменении порядка.', { reply_markup: editCategoryKeyboard });
      }
      continue;

    } else if (editText === '🗑 Удалить категорию') {
      // Проверяем наличие товаров в категории
      let productsCount = 0;
      try {
        const products = await conversation.external(() =>
          apiService.getProductsByCategoryId(category!.id),
        );
        productsCount = products.length;
      } catch (err) {
        logger.error('Failed to check products in category', { err });
        await ctx.reply('⚠️ Ошибка при проверке товаров в категории.', {
          reply_markup: editCategoryKeyboard,
        });
        continue;
      }

      if (productsCount > 0) {
        await ctx.reply(
          `❌ Нельзя удалить категорию <b>${category!.name}</b>.\n\nВ ней есть товары: <b>${productsCount} шт.</b>\nСначала удалите или переместите их в другую категорию.`,
          { parse_mode: 'HTML', reply_markup: editCategoryKeyboard },
        );
        continue;
      }

      await ctx.reply(
        `⚠️ Вы уверены, что хотите удалить категорию <b>${category!.name}</b>?\nЭто действие необратимо!`,
        { parse_mode: 'HTML', reply_markup: confirmDeleteKeyboard },
      );

      const confirmCtx = await conversation.wait();
      const confirmText = confirmCtx.message?.text?.trim();

      if (confirmText === '✅ Да, удалить') {
        try {
          await conversation.external(() => apiService.deleteCategory(category!.id));
          logger.info('Category deleted via bot', { categoryId: category!.id });
          await ctx.reply(`✅ Категория <b>${category!.name}</b> успешно удалена!`, {
            parse_mode: 'HTML',
            reply_markup: mainMenuKeyboard,
          });
          return 'done';
        } catch (err) {
          logger.error('Failed to delete category via bot', { err });
          await ctx.reply('⚠️ Ошибка при удалении категории.', {
            reply_markup: editCategoryKeyboard,
          });
        }
      } else {
        await ctx.reply('Удаление отменено.', { reply_markup: editCategoryKeyboard });
      }
      continue;
    }
  }
}
