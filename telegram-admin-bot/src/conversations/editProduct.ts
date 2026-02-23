import { type Conversation, type ConversationFlavor } from '@grammyjs/conversations';
import { type Context, Keyboard } from 'grammy';
import { apiService } from '../services/apiService';
import { mainMenuKeyboard, backKeyboard } from '../keyboards/mainMenu';
import { logger } from '../utils/logger';
import type { Product, Category } from '../types';

type MyContext = ConversationFlavor<Context>;
type MyConversation = Conversation<MyContext, MyContext>;

export function formatProductCard(product: Product): string {
  const sizes = Array.isArray(product.sizes)
    ? (product.sizes as string[]).join(', ')
    : String(product.sizes ?? '—');

  const composition =
    typeof product.composition === 'object' &&
    product.composition !== null &&
    !Array.isArray(product.composition)
      ? Object.entries(product.composition as Record<string, number>)
          .map(([k, v]) => `${k}: ${v}%`)
          .join(', ')
      : String(product.composition ?? '—');

  const categoryDisplay = product.category?.name ?? product.categoryId;

  let text = '📦 <b>Карточка товара</b>\n\n';
  text += `🆔 ID: <code>${product.id}</code>\n`;
  text += `📝 Название: <b>${product.name}</b>\n`;
  text += `💰 Цена: <b>${product.price} руб.</b>\n`;
  text += `🖼 Картинка: ${product.image}\n`;
  text += `📂 Категория: ${categoryDisplay}\n`;
  text += `📄 Описание: ${product.description}\n`;
  text += `📏 Размеры: ${sizes}\n`;
  text += `🧵 Состав: ${composition}\n`;
  if (product.discount !== null && product.discount !== undefined) {
    text += `🏷 Скидка: ${product.discount}%\n`;
  }
  text += `🔒 Бронь: ${product.reserved ? '✅ Забронирован' : '❌ Не забронирован'}\n`;
  return text;
}

export const productActionKeyboard = new Keyboard()
  .text('⬅️ Назад').text('🏠 Главное меню')
  .row()
  .text('💰 Продажа').text('✏️ Редактировать товар')
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
  .text('✏️ Изменить скидку').text('🗑 Удалить товар')
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

    // === ПРОДАЖА ===
    if (actionText === '💰 Продажа') {
      const result = await handleSale(conversation, ctx, product!);
      if (result === 'done') return 'done';
      // После продажи возвращаемся к меню товара
      await ctx.reply(formatProductCard(product!), {
        parse_mode: 'HTML',
        reply_markup: productActionKeyboard,
      });
      continue;
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
  }
}

/**
 * Обрабатывает продажу товара — создаёт заказ с оплатой наличными
 */
async function handleSale(
  conversation: MyConversation,
  ctx: MyContext,
  product: Product,
): Promise<'back' | 'done'> {
  // Проверяем бронь до отправки запроса
  if (product.reserved) {
    await ctx.reply(
      `🔒 <b>Товар забронирован!</b>\n\n` +
      `📦 <b>${product.name}</b> уже забронирован другим заказом и не может быть продан.\n\n` +
      `Если бронь нужно снять — найдите соответствующий заказ и отмените его.`,
      { parse_mode: 'HTML', reply_markup: productActionKeyboard },
    );
    return 'back';
  }

  try {
    // Создаём заказ с оплатой наличными
    const order = await conversation.external(() =>
      apiService.createOrder({
        productId: product.id,
        quantity: 1,
        totalPrice: product.price,
        telegramUserId: String(ctx.from?.id ?? ''),
        paymentMethod: 'cash',
      }),
    );
    logger.info('Order created via bot (cash)', { orderId: order.id, productId: product.id });

    await ctx.reply(
      `✅ <b>Заказ создан!</b>\n\n` +
      `🆔 ID заказа: <code>${order.id}</code>\n` +
      `📦 Товар: <b>${product.name}</b>\n` +
      `💰 Сумма: <b>${order.totalPrice} руб.</b>\n` +
      `💵 Оплата: Наличными\n` +
      `📊 Статус: ⏳ Ожидает оплаты\n\n` +
      `Когда клиент оплатит — найдите заказ и отметьте его оплаченным.`,
      { parse_mode: 'HTML', reply_markup: productActionKeyboard },
    );
  } catch (err: any) {
    logger.error('Failed to create order via bot', { err });
    const errorMsg = err?.response?.data?.error ?? err?.message ?? 'неизвестная ошибка';
    await ctx.reply(
      `⚠️ Ошибка при создании заказа: ${errorMsg}`,
      { reply_markup: productActionKeyboard },
    );
  }
  return 'back';
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
    else if (editText === '✏️ Изменить картинку') { fieldPrompt = 'Введите новый URL картинки:'; fieldKey = 'image'; }
    else if (editText === '✏️ Изменить категорию') { fieldPrompt = 'Выберите новую категорию:'; fieldKey = 'category'; }
    else if (editText === '✏️ Изменить размер') { fieldPrompt = 'Введите размеры через запятую (S,M,L,XL):'; fieldKey = 'sizes'; }
    else if (editText === '✏️ Изменить состав') { fieldPrompt = 'Введите состав через запятую:'; fieldKey = 'composition'; }
    else if (editText === '✏️ Изменить скидку') { fieldPrompt = 'Введите скидку в % (0 — без скидки):'; fieldKey = 'discount'; }
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
    } else if (fieldKey === 'sizes') {
      updateData.sizes = newValue.split(',').map((s) => s.trim());
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
