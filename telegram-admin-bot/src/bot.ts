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
import { showOrdersConversation } from './conversations/showOrders';
import { findOrderConversation } from './conversations/findOrder';
import { showArchiveConversation } from './conversations/showArchive';
import { showCartConversation } from './conversations/showCart';

// Создаём экземпляр бота с типизированным контекстом
export const bot = new Bot<MyContext>(env.BOT_API_KEY);

// Middleware
bot.use(loggingMiddleware);

// Middleware авторизации — только разрешённые пользователи могут использовать бота
bot.use(async (ctx, next) => {
  const userId = ctx.from?.id?.toString();
  const allowedIds = env.ALLOWED_USER_IDS.split(',').map(id => id.trim());
  if (!userId || !allowedIds.includes(userId)) {
    await ctx.reply('❌ У вас нет доступа к этому боту.');
    return;
  }
  await next();
});

// Подключаем conversations plugin
bot.use(conversations());

// Регистрируем все conversations
bot.use(createConversation(findProductConversation));
bot.use(createConversation(addProductConversation));
bot.use(createConversation(findCategoryConversation));
bot.use(createConversation(addCategoryConversation));
bot.use(createConversation(showProductsConversation));
bot.use(createConversation(showCategoriesConversation));
bot.use(createConversation(showOrdersConversation));
bot.use(createConversation(findOrderConversation));
bot.use(createConversation(showArchiveConversation));
bot.use(createConversation(showCartConversation));

// Команда /start — показываем главное меню
bot.command('start', async (ctx) => {
  await ctx.reply(
    '👋 Добро пожаловать в панель управления магазином!\n\nВыберите действие:',
    { reply_markup: mainMenuKeyboard },
  );
  logger.info('Start command', { userId: ctx.from?.id });
});

// Кнопка "Главное меню" — глобальный выход из любого места
bot.hears('🏠 Главное меню', async (ctx) => {
  await ctx.conversation.exitAll();
  await ctx.reply('👋 Главное меню:', { reply_markup: mainMenuKeyboard });
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

// Кнопка "Посмотреть заказы"
bot.hears('📦 Посмотреть заказы', async (ctx) => {
  await ctx.conversation.enter('showOrdersConversation');
});

// Кнопка "Найти заказ"
bot.hears('🔎 Найти заказ', async (ctx) => {
  await ctx.conversation.enter('findOrderConversation');
});

// Кнопка "Посмотреть архив"
bot.hears('📁 Посмотреть архив', async (ctx) => {
  await ctx.conversation.enter('showArchiveConversation');
});

// Кнопка "Корзина"
bot.hears('🛒 Корзина', async (ctx) => {
  await ctx.conversation.enter('showCartConversation');
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
