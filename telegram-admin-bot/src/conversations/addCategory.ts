import { type Conversation, type ConversationFlavor } from '@grammyjs/conversations';
import { type Context, Keyboard } from 'grammy';
import { apiService } from '../services/apiService';
import { mainMenuKeyboard, backKeyboard } from '../keyboards/mainMenu';
import { logger } from '../utils/logger';
import type { CategorySection } from '../types';

type MyContext = ConversationFlavor<Context>;
type MyConversation = Conversation<MyContext, MyContext>;

const sectionKeyboard = new Keyboard()
  .text('⬅️ Назад')
  .row()
  .text('Одежда').text('Аксессуары')
  .resized();

export async function addCategoryConversation(
  conversation: MyConversation,
  ctx: MyContext,
): Promise<void> {
  // Шаг 1: Название
  await ctx.reply('➕ Добавление категории\n\nШаг 1/3: Введите название категории:', {
    reply_markup: backKeyboard,
  });

  let name = '';
  while (true) {
    const c = await conversation.wait();
    const t = c.message?.text?.trim();
    if (!t) continue;
    if (t === '⬅️ Назад') {
      await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
      return;
    }
    name = t;
    break;
  }

  // Шаг 2: Раздел
  await ctx.reply('Шаг 2/3: Выберите раздел:', { reply_markup: sectionKeyboard });

  let section: CategorySection = 'clothing';
  while (true) {
    const c = await conversation.wait();
    const t = c.message?.text?.trim();
    if (!t) continue;
    if (t === '⬅️ Назад') {
      await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
      return;
    }
    if (t === 'Одежда') { section = 'clothing'; break; }
    if (t === 'Аксессуары') { section = 'accessories'; break; }
    await ctx.reply('❌ Выберите раздел из кнопок:');
  }

  // Шаг 3: Порядковый номер
  await ctx.reply('Шаг 3/3: Введите порядковый номер (число):', { reply_markup: backKeyboard });

  let order = 0;
  while (true) {
    const c = await conversation.wait();
    const t = c.message?.text?.trim();
    if (!t) continue;
    if (t === '⬅️ Назад') {
      await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
      return;
    }
    const parsed = parseInt(t, 10);
    if (isNaN(parsed)) {
      await ctx.reply('❌ Введите числовое значение:');
      continue;
    }
    order = parsed;
    break;
  }

  // Создаём категорию
  try {
    const category = await conversation.external(() =>
      apiService.createCategory({ name, section, order }),
    );
    const sectionLabel = section === 'clothing' ? 'Одежда' : 'Аксессуары';
    await ctx.reply(
      `✅ Категория успешно добавлена!\n\n📂 <b>${category.name}</b>\n🆔 ID: <code>${category.id}</code>\n🏷 Раздел: ${sectionLabel}\n🔢 Порядок: ${category.order}`,
      { parse_mode: 'HTML', reply_markup: mainMenuKeyboard },
    );
    logger.info('Category created via bot', { categoryId: category.id });
  } catch (err) {
    logger.error('Failed to create category via bot', { err });
    await ctx.reply('⚠️ Ошибка при создании категории.', { reply_markup: mainMenuKeyboard });
  }
}
