import { type Conversation, type ConversationFlavor } from '@grammyjs/conversations';
import { type Context } from 'grammy';
import { mainMenuKeyboard } from '../keyboards/mainMenu';
import { editProductById } from './editProduct';
import { logger } from '../utils/logger';

export type MyContext = ConversationFlavor<Context>;
type MyConversation = Conversation<MyContext, MyContext>;

/**
 * Conversation для открытия карточки товара после сканирования QR-кода через WebApp.
 *
 * Ожидает, что перед входом в conversation бот уже отправил сообщение с UUID товара
 * через ctx.session или через специальный текстовый триггер.
 *
 * Поток:
 * 1. Бот получает web_app_data с UUID
 * 2. Бот от��равляет сообщение "Загружаю товар..."
 * 3. Входит в эту conversation, передавая UUID через первое ожидаемое сообщение
 *
 * *Интериор: "UUID — это ключ. Ключ открывает дверь. Дверь ведёт к товару."*
 */
export async function scannerProductConversation(
  conversation: MyConversation,
  ctx: MyContext,
): Promise<void> {
  // Получаем UUID из web_app_data текущего сообщения
  // Conversation запускается сразу после получения web_app_data,
  // поэтому ctx.message.web_app_data.data содержит UUID
  const productId = ctx.message?.web_app_data?.data?.trim();

  if (!productId) {
    logger.warn('scannerProductConversation: no productId in web_app_data');
    await ctx.reply('⚠️ Сканер не вернул данные. Попробуйте снова.', { reply_markup: mainMenuKeyboard });
    return;
  }

  logger.info('scannerProductConversation: opening product from scanner', { productId });

  const result = await editProductById(conversation, ctx, productId);

  if (result === 'done' || result === 'back') {
    await ctx.reply('👋 Главное меню:', { reply_markup: mainMenuKeyboard });
  }
}
