import { type Conversation, type ConversationFlavor } from '@grammyjs/conversations';
import { type Context, Keyboard } from 'grammy';
import { apiService } from '../services/apiService';
import { mainMenuKeyboard, backKeyboard } from '../keyboards/mainMenu';
import { logger } from '../utils/logger';
import type { ProductCategory } from '../types';

type MyContext = ConversationFlavor<Context>;
type MyConversation = Conversation<MyContext, MyContext>;

const categorySelectKeyboard = new Keyboard()
  .text('⬅️ Назад')
  .row()
  .text('all').text('tshirts').text('jeans')
  .row()
  .text('jackets').text('hats').text('belts')
  .row()
  .text('glasses').text('shoes').text('bags')
  .resized();

const VALID_CATEGORIES = ['all', 'tshirts', 'jeans', 'jackets', 'hats', 'belts', 'glasses', 'shoes', 'bags'];

export async function addProductConversation(
  conversation: MyConversation,
  ctx: MyContext,
): Promise<void> {
  // Шаг 1: Название
  await ctx.reply('➕ Добавление товара\n\nШаг 1/8: Введите название товара:', {
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

  // Шаг 2: Цена
  await ctx.reply('Шаг 2/8: Введите цену (число):', { reply_markup: backKeyboard });

  let price = 0;
  while (true) {
    const c = await conversation.wait();
    const t = c.message?.text?.trim();
    if (!t) continue;
    if (t === '⬅️ Назад') {
      await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
      return;
    }
    const parsed = parseInt(t, 10);
    if (isNaN(parsed) || parsed < 0) {
      await ctx.reply('❌ Введите корректную цену (целое число):');
      continue;
    }
    price = parsed;
    break;
  }

  // Шаг 3: Картинка
  await ctx.reply('Шаг 3/8: Введите URL картинки:', { reply_markup: backKeyboard });

  let image = '';
  while (true) {
    const c = await conversation.wait();
    const t = c.message?.text?.trim();
    if (!t) continue;
    if (t === '⬅️ Назад') {
      await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
      return;
    }
    image = t;
    break;
  }

  // Шаг 4: Категория
  await ctx.reply('Шаг 4/8: Выберите категорию:', { reply_markup: categorySelectKeyboard });

  let category: ProductCategory = 'all';
  while (true) {
    const c = await conversation.wait();
    const t = c.message?.text?.trim();
    if (!t) continue;
    if (t === '⬅️ Назад') {
      await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
      return;
    }
    if (!VALID_CATEGORIES.includes(t)) {
      await ctx.reply('❌ Выберите категорию из списка:');
      continue;
    }
    category = t as ProductCategory;
    break;
  }

  // Шаг 5: Описание
  await ctx.reply('Шаг 5/8: Введите описание товара:', { reply_markup: backKeyboard });

  let description = '';
  while (true) {
    const c = await conversation.wait();
    const t = c.message?.text?.trim();
    if (!t) continue;
    if (t === '⬅️ Назад') {
      await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
      return;
    }
    description = t;
    break;
  }

  // Шаг 6: Размеры
  await ctx.reply('Шаг 6/8: Введите размеры через запятую (например: S,M,L,XL):', {
    reply_markup: backKeyboard,
  });

  let sizes: string[] = [];
  while (true) {
    const c = await conversation.wait();
    const t = c.message?.text?.trim();
    if (!t) continue;
    if (t === '⬅️ Назад') {
      await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
      return;
    }
    sizes = t.split(',').map((s) => s.trim()).filter(Boolean);
    break;
  }

  // Шаг 7: Состав
  await ctx.reply('Шаг 7/8: Введите состав через запятую (например: Хлопок 80%,Полиэстер 20%):', {
    reply_markup: backKeyboard,
  });

  let composition: string[] = [];
  while (true) {
    const c = await conversation.wait();
    const t = c.message?.text?.trim();
    if (!t) continue;
    if (t === '⬅️ Назад') {
      await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
      return;
    }
    composition = t.split(',').map((s) => s.trim()).filter(Boolean);
    break;
  }

  // Шаг 8: Скидка
  await ctx.reply('Шаг 8/8: Введите скидку в % (0 — без скидки):', { reply_markup: backKeyboard });

  let discount: number | undefined;
  while (true) {
    const c = await conversation.wait();
    const t = c.message?.text?.trim();
    if (!t) continue;
    if (t === '⬅️ Назад') {
      await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
      return;
    }
    const parsed = parseInt(t, 10);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      await ctx.reply('❌ Введите число от 0 до 100:');
      continue;
    }
    discount = parsed === 0 ? undefined : parsed;
    break;
  }

  // Создаём товар
  try {
    const product = await conversation.external(() =>
      apiService.createProduct({ name, price, image, category, description, sizes, composition, discount }),
    );
    await ctx.reply(
      `✅ Товар успешно добавлен!\n\n📦 <b>${product.name}</b>\n🆔 ID: <code>${product.id}</code>`,
      { parse_mode: 'HTML', reply_markup: mainMenuKeyboard },
    );
    logger.info('Product created via bot', { productId: product.id });
  } catch (err) {
    logger.error('Failed to create product via bot', { err });
    await ctx.reply('⚠️ Ошибка при создании товара.', { reply_markup: mainMenuKeyboard });
  }
}
