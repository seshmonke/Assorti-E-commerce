import { Keyboard } from 'grammy';

export const SCANNER_URL = 'https://assortishop.online/scanner.html';

export const mainMenuKeyboard = new Keyboard()
  .text('🔍 Найти товар').text('🔍 Найти категорию')
  .row()
  .text('➕ Добавить товар').text('➕ Добавить категорию')
  .row()
  .text('📋 Показать товары').text('📋 Показать категории')
  .row()
  .text('📦 Посмотреть заказы').text('🔎 Найти заказ')
  .row()
  .text('📁 Посмотреть архив').text('🛒 Корзина')
  .row()
  .webApp('📷 Сканер', SCANNER_URL)
  .resized();

export const backKeyboard = new Keyboard()
  .text('⬅️ Назад').text('🏠 Главное меню')
  .resized();
