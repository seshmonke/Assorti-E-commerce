import { type Conversation, type ConversationFlavor } from '@grammyjs/conversations';
import { type Context, Keyboard } from 'grammy';
import { apiService } from '../services/apiService';
import { mainMenuKeyboard, backKeyboard } from '../keyboards/mainMenu';
import { logger } from '../utils/logger';
import type { Product } from '../types';

export type MyContext = ConversationFlavor<Context>;
type MyConversation = Conversation<MyContext, MyContext>;

const CATEGORY_LABELS: Record<string, string> = {
  all: 'Все',
  tshirts: 'Футболки',
  jeans: 'Джинсы',
  jackets: 'Куртки',
  hats: 'Шапки',
  belts: 'Ремни',
  glasses: 'Очки',
  shoes: 'Обувь',
  bags: 'Сумки',
};

function formatProductCard(product: Product): string {
  const sizes = Array.isArray(product.sizes)
    ? (product.sizes as string[]).join(', ')
    : String(product.sizes);
  const composition = Array.isArray(product.composition)
    ? (product.composition as string[]).join(', ')
    : String(product.composition);

  let text = '📦 <b>Карточка товара</b>\n\n';
  text += `🆔 ID: <code>${product.id}</code>\n`;
  text += `📝 Название: <b>${product.name}</b>\n`;
  text += `💰 Цена: <b>${product.price} руб.</b>\n`;
  text += `🖼 Картинка: ${product.image}\n`;
  text += `📂 Категория: ${CATEGORY_LABELS[product.category] || product.category}\n`;
  text += `📄 Описание: ${product.description}\n`;
  text += `📏 Размеры: ${sizes}\n`;
  text += `🧵 Состав: ${composition}\n`;
  if (product.discount !== null && product.discount !== undefined) {
    text += `🏷 Скидка: ${product.discount}%\n`;
  }
  return text;
}

const editProductKeyboard = new Keyboard()
  .text('⬅️ Назад').text('✏️ Изменить название')
  .row()
  .text('✏️ Изменить цену').text('✏️ Изменить картинку')
  .row()
  .text('✏️ Изменить категорию').text('✏️ Изменить размер')
  .row()
  .text('✏️ Изменить состав').text('✏️ Изменить скидку')
  .resized();

const categorySelectKeyboard = new Keyboard()
  .text('⬅️ Назад')
  .row()
  .text('all').text('tshirts').text('jeans')
  .row()
  .text('jackets').text('hats').text('belts')
  .row()
  .text('glasses').text('shoes').text('bags')
  .resized();

export async function findProductConversation(
  conversation: MyConversation,
  ctx: MyContext,
): Promise<void> {
  await ctx.reply('Введите ID товара:', { reply_markup: backKeyboard });

  while (true) {
    const idCtx = await conversation.wait();
    const text = idCtx.message?.text?.trim();
    if (!text) continue;

    if (text === '⬅️ Назад') {
      await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
      return;
    }

    const id = parseInt(text, 10);
    if (isNaN(id)) {
      await ctx.reply('❌ Введите числовой ID товара:');
      continue;
    }

    let product: Product | null = null;
    try {
      product = await conversation.external(() => apiService.getProductById(id));
    } catch {
      await ctx.reply('⚠️ Ошибка при получении товара. Попробуйте снова:');
      continue;
    }

    if (!product) {
      await ctx.reply('❌ Товар не найден. Введите другой ID:');
      continue;
    }

    await ctx.reply(formatProductCard(product), {
      parse_mode: 'HTML',
      reply_markup: editProductKeyboard,
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

      let fieldPrompt = '';
      let fieldKey = '';

      if (editText === '✏️ Изменить название') { fieldPrompt = 'Введите новое название:'; fieldKey = 'name'; }
      else if (editText === '✏️ Изменить цену') { fieldPrompt = 'Введите новую цену (число):'; fieldKey = 'price'; }
      else if (editText === '✏️ Изменить картинку') { fieldPrompt = 'Введите новый URL картинки:'; fieldKey = 'image'; }
      else if (editText === '✏️ Изменить категорию') { fieldPrompt = 'Выберите новую категорию:'; fieldKey = 'category'; }
      else if (editText === '✏️ Изменить размер') { fieldPrompt = 'Введите размеры через запятую (S,M,L,XL):'; fieldKey = 'sizes'; }
      else if (editText === '✏️ Изменить состав') { fieldPrompt = 'Введите состав через запятую:'; fieldKey = 'composition'; }
      else if (editText === '✏️ Изменить скидку') { fieldPrompt = 'Введите скидку в % (0 — без скидки):'; fieldKey = 'discount'; }
      else continue;

      if (fieldKey === 'category') {
        await ctx.reply(fieldPrompt, { reply_markup: categorySelectKeyboard });
      } else {
        await ctx.reply(fieldPrompt, { reply_markup: backKeyboard });
      }

      const valueCtx = await conversation.wait();
      const newValue = valueCtx.message?.text?.trim();

      if (!newValue || newValue === '⬅️ Назад') {
        await ctx.reply('Редактирование отменено.', { reply_markup: editProductKeyboard });
        continue;
      }

      const updateData: Record<string, unknown> = {};

      if (fieldKey === 'price') {
        const price = parseInt(newValue, 10);
        if (isNaN(price) || price < 0) {
          await ctx.reply('❌ Некорректная цена.', { reply_markup: editProductKeyboard });
          continue;
        }
        updateData.price = price;
      } else if (fieldKey === 'discount') {
        const discount = parseInt(newValue, 10);
        if (isNaN(discount) || discount < 0 || discount > 100) {
          await ctx.reply('❌ Скидка должна быть от 0 до 100.', { reply_markup: editProductKeyboard });
          continue;
        }
        updateData.discount = discount === 0 ? null : discount;
      } else if (fieldKey === 'sizes') {
        updateData.sizes = newValue.split(',').map((s) => s.trim());
      } else if (fieldKey === 'composition') {
        updateData.composition = newValue.split(',').map((s) => s.trim());
      } else {
        updateData[fieldKey] = newValue;
      }

      try {
        await conversation.external(() => apiService.updateProduct(product!.id, updateData as any));
        logger.info('Product updated via bot', { productId: product!.id, field: fieldKey });
        const updatedProduct = await conversation.external(() => apiService.getProductById(product!.id));
        if (updatedProduct) {
          product = updatedProduct;
        }
        await ctx.reply('✅ Товар успешно обновлён!\n\n' + formatProductCard(product!), {
          parse_mode: 'HTML',
          reply_markup: editProductKeyboard,
        });
      } catch (err) {
        logger.error('Failed to update product via bot', { err });
        await ctx.reply('⚠️ Ошибка при обновлении товара.', { reply_markup: editProductKeyboard });
      }
    }
  }
}
