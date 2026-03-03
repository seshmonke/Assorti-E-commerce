import { type Conversation, type ConversationFlavor } from '@grammyjs/conversations';
import { type Context } from 'grammy';
import type { PhotoSize } from 'grammy/types';
import axios from 'axios';
import { mainMenuKeyboard, backKeyboard } from '../keyboards/mainMenu';
import { editProductById } from './editProduct';
import { readQRFromBuffer } from '../services/qrReaderService';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export type MyContext = ConversationFlavor<Context>;
type MyConversation = Conversation<MyContext, MyContext>;

/**
 * Обрабатывает фото с QR-кодом: скачивает, сканирует, показывает товар.
 * Возвращает 'done' если нужно завершить conversation, 'continue' если продолжать цикл.
 */
async function processPhoto(
  conversation: MyConversation,
  ctx: MyContext,
  photos: PhotoSize[],
): Promise<'done' | 'continue'> {
  const bestPhoto = photos[photos.length - 1];

  await ctx.reply('🔍 Сканирую QR-код на этикетке...');

  try {
    // Скачиваем файл
    const fileInfo = await conversation.external(() =>
      ctx.api.getFile(bestPhoto.file_id),
    );
    const fileUrl = `https://api.telegram.org/file/bot${env.BOT_API_KEY}/${fileInfo.file_path}`;
    const imageBuffer = await conversation.external(async () => {
      const response = await axios.get<ArrayBuffer>(fileUrl, { responseType: 'arraybuffer' });
      return Buffer.from(response.data);
    });

    // Читаем QR-код
    const qrResult = await conversation.external(() => readQRFromBuffer(imageBuffer));

    if (!qrResult.found) {
      await ctx.reply(
        '🤔 QR-код не найден на фото.\n\nПопробуйте сделать более чёткое фото или введите ID товара вручную:',
        { reply_markup: backKeyboard },
      );
      return 'continue';
    }

    if (!qrResult.productId) {
      await ctx.reply(
        `🔎 QR найден, но это не товар нашего магазина.\n\nСодержимое: <code>${qrResult.rawText}</code>\n\nВведите ID товара вручную:`,
        { parse_mode: 'HTML', reply_markup: backKeyboard },
      );
      return 'continue';
    }

    // Нашли UUID — показываем карточку товара
    await ctx.reply(`✅ QR распоз��ан! Загружаю товар...`);
    logger.info('Product found via QR scan in findProductConversation', {
      productId: qrResult.productId,
    });

    const result = await editProductById(conversation, ctx, qrResult.productId);
    if (result === 'done') return 'done';

    // result === 'back' — просим снова
    await ctx.reply(
      '🔍 Введите ID товара или отправьте фото этикетки с QR-кодом:',
      { reply_markup: backKeyboard },
    );
    return 'continue';
  } catch (err: any) {
    logger.error('findProductConversation: error processing photo', {
      errName: err?.name,
      errMessage: err?.message,
      errStack: err?.stack,
    });
    await ctx.reply(
      '⚠️ Ошибка при обработке фото. Попробуйте снова или введите ID вручную:',
      { reply_markup: backKeyboard },
    );
    return 'continue';
  }
}

export async function findProductConversation(
  conversation: MyConversation,
  ctx: MyContext,
): Promise<void> {
  // Если conversation запущена через bot.on('message:photo') — фото уже есть в ctx
  // Обрабатываем его сразу, без показа приветственного сообщения
  const initialPhotos = ctx.message?.photo;
  if (initialPhotos && initialPhotos.length > 0) {
    const result = await processPhoto(conversation, ctx, initialPhotos);
    if (result === 'done') return;
    // После обраб��тки фото продолжаем в обычный цикл
  } else {
    await ctx.reply(
      '🔍 Чтобы найти товар, введите его ID (UUID) или отправьте фото этикетки с QR-кодом:',
      { reply_markup: backKeyboard },
    );
  }

  while (true) {
    const msgCtx = await conversation.wait();

    // === Обработка текста (ID товара) ===
    const text = msgCtx.message?.text?.trim();
    if (text) {
      if (text === '⬅️ Назад' || text === '🏠 Главное меню') {
        await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
        return;
      }

      const result = await editProductById(conversation, ctx, text);
      if (result === 'done') return;

      // result === 'back' — просим ввести снова
      await ctx.reply(
        '🔍 Введите ID товара или отправьте фото этикетки с QR-кодом:',
        { reply_markup: backKeyboard },
      );
      continue;
    }

    // === Обработка фото (этикетка с QR-кодом) ===
    const photos = msgCtx.message?.photo;
    if (photos && photos.length > 0) {
      const result = await processPhoto(conversation, ctx, photos);
      if (result === 'done') return;
      continue;
    }

    // Неизвестный тип сообщения — игнорируем
  }
}
