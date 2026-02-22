import { Keyboard } from 'grammy';

export const mainMenuKeyboard = new Keyboard()
  .text('🔍 Найти товар').text('➕ Добавить товар')
  .row()
  .text('🔍 Найти категорию').text('➕ Добавить категорию')
  .row()
  .text('📋 Показать товары')
  .resized();

export const backKeyboard = new Keyboard()
  .text('⬅️ Назад')
  .resized();
