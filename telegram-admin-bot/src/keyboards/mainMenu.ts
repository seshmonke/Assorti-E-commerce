import { Keyboard } from 'grammy';

export const mainMenuKeyboard = new Keyboard()
  .text('🔍 Найти товар').text('🔍 Найти категорию')
  .row()
  .text('➕ Добавить товар').text('➕ Добавить категорию')
  .row()
  .text('📋 Показать товары').text('📋 Показать категории')
  .resized();

export const backKeyboard = new Keyboard()
  .text('⬅️ Назад')
  .resized();
