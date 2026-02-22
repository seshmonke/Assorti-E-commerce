import { Bot } from 'grammy';
import { conversations, createConversation } from '@grammyjs/conversations';
import { env } from './config/env';
import { logger } from './utils/logger';
import { loggingMiddleware } from './middleware/logger';
import { mainMenuKeyboard } from './keyboards/mainMenu';
import { type MyContext, findProductConversation } from './conversations/findProduct';
import { addProductConversation } from './conversations/addProduct';
import { findCategoryConversation } from './conversations/findCategory';
import { addCategoryConversation } from './conversations/addCategory';
import { showProductsConversation } from './conversations/showProducts';
import { showCategoriesConversation } from './conversations/showCategories';

// Создаём экземпляр бота с типизированным контекстом
export const bot = new Bot<MyContext>(env.BOT_API_KEY);

// Middleware
bot.use(loggingMiddleware);

// Подключаем conversations plugin
bot.use(conversations());

// Регистрируем все conversations
bot.use(createConversation(findProductConversation));
bot.use(createConversation(addProductConversation));
bot.use(createConversation(findCategoryConversation));
bot.use(createConversation(addCategoryConversation));
bot.use(createConversation(showProductsConversation));
bot.use(createConversation(showCategoriesConversation));

// Команда /start — показываем главное меню
bot.command('start', async (ctx) => {
  await ctx.reply(
    '👋 Добро пожаловать в панель управления магазином!\n\nВыберите действие:',
    { reply_markup: mainMenuKeyboard },
  );
  logger.info('Start command', { userId: ctx.from?.id });
});

// Кнопка "Найти товар"
bot.hears('🔍 Найти товар', async (ctx) => {
  await ctx.conversation.enter('findProductConversation');
});

// Кнопка "Добавить товар"
bot.hears('➕ Добавить товар', async (ctx) => {
  await ctx.conversation.enter('addProductConversation');
});

// Кнопка "Найти категорию"
bot.hears('🔍 Найти категорию', async (ctx) => {
  await ctx.conversation.enter('findCategoryConversation');
});

// Кнопка "Добавить категорию"
bot.hears('➕ Добавить категорию', async (ctx) => {
  await ctx.conversation.enter('addCategoryConversation');
});

// Кнопка "Показать товары"
bot.hears('📋 Показать товары', async (ctx) => {
  await ctx.conversation.enter('showProductsConversation');
});

// Кнопка "Показать категории"
bot.hears('📋 Показать категории', async (ctx) => {
  await ctx.conversation.enter('showCategoriesConversation');
});

// Обработчик ошибок
bot.catch((err) => {
  logger.error('Bot error', {
    error: err.error,
    message: err.message,
  });
});

export async function startBot(): Promise<void> {
  try {
    logger.info('Starting bot...');
    await bot.start();
    logger.info('Bot started successfully');
  } catch (error) {
    logger.error('Failed to start bot', { error });
    throw error;
  }
}
