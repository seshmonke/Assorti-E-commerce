import { Keyboard } from 'grammy';

export const mainMenuKeyboard = new Keyboard()
  .text('🔍 Найти товар').text('🔍 Найти категорию')
  .row()
  .text('➕ Добавить товар').text('➕ Добавить категорию')
  .row()
  .text('📋 Показать товары').text('📋 Показать категории')
  .row()
  .text('📦 Посмотреть заказы').text('🔎 Найти заказ')
  .resized();

export const backKeyboard = new Keyboard()
  .text('⬅️ Назад').text('🏠 Главное меню')
  .resized();
