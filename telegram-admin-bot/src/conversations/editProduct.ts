import { type Conversation, type ConversationFlavor } from '@grammyjs/conversations';
import { type Context, Keyboard, InputFile } from 'grammy';
import { apiService } from '../services/apiService';
import { cartService } from '../services/cartService';
import { mainMenuKeyboard, backKeyboard } from '../keyboards/mainMenu';
import { logger } from '../utils/logger';
import type { Product, Category } from '../types';
import { showOrdersConversation } from './showOrders';
import { showCartConversation } from './showCart';
import { generateLabelImage } from '../services/labelService';

type MyContext = ConversationFlavor<Context>;
type MyConversation = Conversation<MyContext, MyContext>;

export function formatProductCard(product: Product): string {
  const sizes = product.sizes || '—';

  const composition =
    typeof product.composition === 'object' &&
    product.composition !== null &&
    !Array.isArray(product.composition)
      ? Object.entries(product.composition as Record<string, number>)
          .map(([k, v]) => `${k}: ${v}%`)
          .join(', ')
      : String(product.composition ?? '—');

  const categoryDisplay = product.category?.name ?? product.categoryId;
  
  // Префикс для архивированного товара
  const namePrefix = product.archive ? '[АРХИВ] ' : '';
  
  // Статус архива
  const archiveStatus = product.archive ? '✅ В архиве' : '❌ Активен';

  let text = '📦 <b>Карточка товара</b>\n\n';
  text += `🆔 ID: <code>${product.id}</code>\n`;
  text += `📝 Название: <b>${namePrefix}${product.name}</b>\n`;
  text += `💰 Цена: <b>${product.price} руб.</b>\n`;
  text += `🖼 Картинки: ${Array.isArray(product.images) ? product.images.join(', ') : '—'}\n`;
  text += `📂 Категория: ${categoryDisplay}\n`;
  text += `📄 Описание: ${product.description}\n`;
  text += `📏 Размеры: ${sizes}\n`;
  text += `🧵 Состав: ${composition}\n`;
  if (product.discount !== null && product.discount !== undefined) {
    text += `🏷 Скидка: ${product.discount}%\n`;
  }
  text += `🗂 Архив: ${archiveStatus}\n`;
  return text;
}

export const productActionKeyboard = new Keyboard()
  .text('⬅️ Назад').text('🏠 Главное меню')
  .row()
  .text('✏️ Редактировать товар')
  .row()
  .text('🛒 В корзину').text('🛒 Корзина')
  .row()
  .text('📦 Посмотреть заказы').text('🖨️ Печать этикетки')
  .resized();

export const editProductKeyboard = new Keyboard()
  .text('⬅️ Назад').text('🏠 Главное меню')
  .row()
  .text('✏️ Изменить название').text('✏️ Изменить цену')
  .row()
  .text('✏️ Изменить картинку').text('✏️ Изменить категорию')
  .row()
  .text('✏️ Изменить размер').text('✏️ Изменить состав')
  .row()
  .text('✏️ Изменить скидку').text('✏️ Изменить описание')
  .row()
  .text('🗑 Удалить товар')
  .resized();

const confirmDeleteKeyboard = new Keyboard()
  .text('✅ Да, удалить').text('❌ Отмена')
  .resized();

function buildCategoryKeyboard(categories: Category[]): Keyboard {
  const kb = new Keyboard().text('⬅️ Назад');
  categories.forEach((cat) => {
    kb.row().text(cat.name);
  });
  return kb.resized();
}

/**
 * Загружает товар по ID, показывает карточку и меню действий.
 * Возвращает 'back' если нужно вернуться к предыдущему меню (⬅️ Назад),
 * 'done' если действие завершено.
 */
export async function editProductById(
  conversation: MyConversation,
  ctx: MyContext,
  id: string,
): Promise<'back' | 'done'> {
  let product: Product | null = null;
  try {
    product = await conversation.external(() => apiService.getProductById(id));
  } catch {
    await ctx.reply('⚠️ Ошибка при получении товара. Попробуйте снова.');
    return 'back';
  }

  if (!product) {
    await ctx.reply('❌ Товар не найден. Введите другой ID.');
    return 'back';
  }

  // Показываем карточку товара и меню действий
  await ctx.reply(formatProductCard(product), {
    parse_mode: 'HTML',
    reply_markup: productActionKeyboard,
  });

  // Цикл выбора действия
  while (true) {
    const actionCtx = await conversation.wait();
    const actionText = actionCtx.message?.text?.trim();
    if (!actionText) continue;

    if (actionText === '⬅️ Назад') {
      return 'back';
    }

    if (actionText === '🏠 Главное меню') {
      await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
      return 'done';
    }

    // === РЕДАКТИРОВАТЬ ===
    if (actionText === '✏️ Редактировать товар') {
      await ctx.reply('Выберите что редактировать:', { reply_markup: editProductKeyboard });
      const editResult = await runEditLoop(conversation, ctx, product!);
      if (editResult.action === 'done') return 'done';
      if (editResult.updatedProduct) product = editResult.updatedProduct;
      // Возвращаемся к меню товара
      await ctx.reply(formatProductCard(product!), {
        parse_mode: 'HTML',
        reply_markup: productActionKeyboard,
      });
      continue;
    }

    // === В КОРЗИНУ ===
    if (actionText === '🛒 В корзину') {
      const userId = String(ctx.from?.id ?? '');
      const alreadyInCart = conversation.external(() => cartService.isInCart(userId, product!.id));
      if (await alreadyInCart) {
        await ctx.reply(
          `⚠️ Товар <b>${product!.name}</b> уже в корзине!`,
          { parse_mode: 'HTML', reply_markup: productActionKeyboard },
        );
      } else {
        conversation.external(() => cartService.addToCart(userId, product!));
        logger.info('Product added to cart via product card', { productId: product!.id, userId });
        await ctx.reply(
          `✅ Товар <b>${product!.name}</b> добавлен в корзину!\n\nПерейдите в корзину для оформления заказа.`,
          { parse_mode: 'HTML', reply_markup: productActionKeyboard },
        );
      }
      continue;
    }

    // === КОРЗИНА (перейти в меню корзины) ===
    if (actionText === '🛒 Корзина') {
      await showCartConversation(conversation, ctx);
      // После возврата из корзины показываем карточку товара снова
      await ctx.reply(formatProductCard(product!), {
        parse_mode: 'HTML',
        reply_markup: productActionKeyboard,
      });
      continue;
    }

    // === ПОСМОТРЕТЬ ЗАКАЗЫ ===
    if (actionText === '📦 Посмотреть заказы') {
      const result = await showOrdersConversation(conversation, ctx);
      // После возврата из меню заказов показываем карточку товара снова
      await ctx.reply(formatProductCard(product!), {
        parse_mode: 'HTML',
        reply_markup: productActionKeyboard,
      });
      continue;
    }

    // === ПЕЧАТЬ ЭТИКЕТКИ ===
    // *Визуальное Чутьё: "Sofia Sans — это поэзия на этикетке. Печать или сдохни!"*
    if (actionText === '🖨️ Печать этикетки') {
      try {
        await ctx.reply('⏳ Генерирую этикетку...', { reply_markup: productActionKeyboard });
        const labelBuffer = await conversation.external(() => generateLabelImage(product!));
        await ctx.replyWithPhoto(new InputFile(labelBuffer, `label_${product!.id}.png`), {
          caption:
            `🖨️ <b>Этикетка для HPRT HM-T260LR</b>\n` +
            `📦 ${product!.name}\n` +
            `🆔 <code>${product!.id}</code>\n\n` +
            `QR ведёт на: assortishop.online/product/${product!.id}`,
          parse_mode: 'HTML',
          reply_markup: productActionKeyboard,
        });
        logger.info('Label printed via bot', { productId: product!.id });
      } catch (err) {
        logger.error('Failed to generate label', { err });
        await ctx.reply('⚠️ Ошибка при генерации этикетки. Попробуйте снова.', {
          reply_markup: productActionKeyboard,
        });
      }
      continue;
    }
  }
}

/**
 * Цикл редактирования полей товара
 */
async function runEditLoop(
  conversation: MyConversation,
  ctx: MyContext,
  product: Product,
): Promise<{ action: 'back' | 'done'; updatedProduct: Product | null }> {
  let currentProduct = product;

  while (true) {
    const editCtx = await conversation.wait();
    const editText = editCtx.message?.text?.trim();
    if (!editText) continue;

    if (editText === '⬅️ Назад') {
      return { action: 'back', updatedProduct: currentProduct };
    }

    if (editText === '🏠 Главное меню') {
      await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
      return { action: 'done', updatedProduct: null };
    }

    let fieldPrompt = '';
    let fieldKey = '';

    if (editText === '🗑 Удалить товар') {
      await ctx.reply(
        `⚠️ Вы уверены, что хотите удалить товар <b>${product!.name}</b>?\nЭто действие необратимо!`,
        { parse_mode: 'HTML', reply_markup: confirmDeleteKeyboard },
      );

      const confirmCtx = await conversation.wait();
      const confirmText = confirmCtx.message?.text?.trim();

      if (confirmText === '✅ Да, удалить') {
        try {
          await conversation.external(() => apiService.deleteProduct(currentProduct.id));
          logger.info('Product deleted via bot', { productId: currentProduct.id });
          await ctx.reply(`✅ Товар <b>${currentProduct.name}</b> успешно удалён!`, {
            parse_mode: 'HTML',
            reply_markup: mainMenuKeyboard,
          });
          return { action: 'done', updatedProduct: null };
        } catch (err) {
          logger.error('Failed to delete product via bot', { err });
          await ctx.reply('⚠️ Ошибка при удалении товара.', { reply_markup: editProductKeyboard });
        }
      } else {
        await ctx.reply('Удаление отменено.', { reply_markup: editProductKeyboard });
      }
      continue;
    }

    if (editText === '✏️ Изменить название') { fieldPrompt = 'Введите новое название:'; fieldKey = 'name'; }
    else if (editText === '✏️ Изменить цену') { fieldPrompt = 'Введите новую цену (число):'; fieldKey = 'price'; }
    else if (editText === '✏️ Изменить картинку') { fieldPrompt = 'Введите URL картинок через запятую (можно одну):'; fieldKey = 'images'; }
    else if (editText === '✏️ Изменить категорию') { fieldPrompt = 'Выберите новую категорию:'; fieldKey = 'category'; }
    else if (editText === '✏️ Изменить размер') { fieldPrompt = 'Введите размер товара (например: M или 42-44):'; fieldKey = 'sizes'; }
    else if (editText === '✏️ Изменить состав') { fieldPrompt = 'Введите состав через запятую:'; fieldKey = 'composition'; }
    else if (editText === '✏️ Изменить скидку') { fieldPrompt = 'Введите скидку в % (0 — без скидки):'; fieldKey = 'discount'; }
    else if (editText === '✏️ Изменить описание') { fieldPrompt = 'Введите новое описание:'; fieldKey = 'description'; }
    else continue;

    let categories: Category[] = [];
    if (fieldKey === 'category') {
      try {
        categories = await conversation.external(() => apiService.getAllCategories());
      } catch {
        await ctx.reply('⚠️ Не удалось загрузить категории.', { reply_markup: editProductKeyboard });
        continue;
      }
      const catLines = categories.map((c, i) => `${i + 1}. ${c.name}`).join('\n');
      await ctx.reply(`${fieldPrompt}\n\n${catLines}`, { reply_markup: buildCategoryKeyboard(categories) });
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
    } else if (fieldKey === 'category') {
      const selectedCat = categories.find((c) => c.name === newValue);
      if (!selectedCat) {
        await ctx.reply('❌ Категория не найдена. Выберите из списка.', { reply_markup: editProductKeyboard });
        continue;
      }
      updateData.categoryId = selectedCat.id;
    } else if (fieldKey === 'images') {
      updateData.images = newValue.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (fieldKey === 'sizes') {
      updateData.sizes = newValue;
    } else if (fieldKey === 'composition') {
      updateData.composition = newValue.split(',').map((s) => s.trim());
    } else {
      updateData[fieldKey] = newValue;
    }

    try {
      await conversation.external(() => apiService.updateProduct(currentProduct.id, updateData as any));
      logger.info('Product updated via bot', { productId: currentProduct.id, field: fieldKey });
      const updatedProduct = await conversation.external(() => apiService.getProductById(currentProduct.id));
      if (updatedProduct) {
        currentProduct = updatedProduct;
      }
      await ctx.reply('✅ Товар успешно обновлён!\n\n' + formatProductCard(currentProduct), {
        parse_mode: 'HTML',
        reply_markup: editProductKeyboard,
      });
    } catch (err) {
      logger.error('Failed to update product via bot', { err });
      await ctx.reply('⚠️ Ошибка при обновлении товара.', { reply_markup: editProductKeyboard });
    }
  }
}
