import { createCanvas, registerFont, loadImage } from 'canvas';
import QRCode from 'qrcode';
import path from 'path';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import type { Product } from '../types';

// Путь к шрифтам — Sofia Sans Condensed
const FONTS_DIR = path.join(__dirname, '../assets/fonts');

// Регистрируем шрифты один раз при загрузке модуля
try {
  registerFont(path.join(FONTS_DIR, 'SofiaSansCondensed-Regular.ttf'), {
    family: 'Sofia Sans Condensed',
    weight: '400',
  });
  registerFont(path.join(FONTS_DIR, 'SofiaSansCondensed-Bold.ttf'), {
    family: 'Sofia Sans Condensed',
    weight: '700',
  });
  logger.info('Sofia Sans Condensed fonts registered successfully');
} catch (err) {
  logger.error('Failed to register fonts, falling back to sans-serif', { err });
}

// Размеры этикетки ×2: портрет 20×40мм при 406dpi = 320×640px
// (было 160×320px при 203dpi — увеличено вдвое для чёткости текста и QR)
const LABEL_WIDTH = 320;
const LABEL_HEIGHT = 640;

// Размер QR-кода (увеличен ×2: было 120, стало 240)
const QR_SIZE = 240;

// Отступы (увеличены ×2: было 10, стало 20)
const PADDING = 20;

/**
 * Форматирует состав товара в читаемую строку
 */
function formatComposition(composition: unknown): string {
  if (!composition) return '';

  if (typeof composition === 'string') {
    return composition;
  }

  if (Array.isArray(composition)) {
    return (composition as string[]).join(', ');
  }

  if (typeof composition === 'object' && composition !== null) {
    return Object.entries(composition as Record<string, number>)
      .map(([k, v]) => `${k}: ${v}%`)
      .join(', ');
  }

  return String(composition);
}

/**
 * Разбивает текст на строки с учётом максимальной ширины
 */
function wrapText(
  ctx: ReturnType<typeof createCanvas>['getContext'],
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = (ctx as any).measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines) break;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Генерирует PNG-буфер этикетки для товара.
 * Портретный макет 20×40мм (320×640px @406dpi):
 * - Сверху: название товара (тонкий шрифт, 1-2 строки)
 * - Под названием: состав коротко (мелкий шрифт)
 * - Снизу по центру: QR-код 240×240px
 */
export async function generateLabelImage(product: Product): Promise<Buffer> {
  logger.info('generateLabelImage: start', { productId: product.id, productName: product.name });

  const productUrl = `${env.SITE_URL}/product/${product.id}`;
  logger.debug('generateLabelImage: productUrl', { productUrl });

  // Генерируем QR-код в буфер (240×240px для чёткости)
  logger.debug('generateLabelImage: generating QR code buffer');
  const qrBuffer = await QRCode.toBuffer(productUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: QR_SIZE,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  // Создаём canvas (портрет 320×640)
  const canvas = createCanvas(LABEL_WIDTH, LABEL_HEIGHT);
  const ctx = canvas.getContext('2d');

  // Белый фон
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, LABEL_WIDTH, LABEL_HEIGHT);

  // Тонкая рамка
  ctx.strokeStyle = '#CCCCCC';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, LABEL_WIDTH - 1, LABEL_HEIGHT - 1);

  const textZoneWidth = LABEL_WIDTH - PADDING * 2;

  // === QR-КОД Y-позиция (нужна для вертикального центрирования текста) ===
  const qrY = LABEL_HEIGHT - QR_SIZE - PADDING;

  // === Предварительный расчёт высоты текстового блока ===
  // Шрифты увеличены ×2: было 26/10px, стало 52/20px
  const NAME_FONT_SIZE = 52;
  const NAME_LINE_HEIGHT = 56;
  const COMPOSITION_FONT_SIZE = 20;
  const COMPOSITION_LINE_HEIGHT = 24;
  const DIVIDER_SPACE = 24; // отступ до и после разделителя (было 12)

  ctx.font = `400 ${NAME_FONT_SIZE}px "Sofia Sans Condensed", sans-serif`;
  const nameLines = wrapText(ctx as any, product.name.toUpperCase(), textZoneWidth, 2);

  const compositionRaw = formatComposition(product.composition);
  let compositionLines: string[] = [];
  if (compositionRaw) {
    const compositionText = compositionRaw.length > 60
      ? compositionRaw.slice(0, 60) + '...'
      : compositionRaw;
    ctx.font = `400 ${COMPOSITION_FONT_SIZE}px "Sofia Sans Condensed", sans-serif`;
    compositionLines = wrapText(ctx as any, compositionText, textZoneWidth, 3);
  }

  // Цена
  const PRICE_FONT_SIZE = 28;
  const PRICE_LINE_HEIGHT = 36;
  const hasDiscount = product.discount !== null && product.discount !== undefined && product.discount > 0;
  const discountedPrice = hasDiscount
    ? Math.round(product.price * (1 - (product.discount as number) / 100))
    : null;

  const totalTextHeight =
    nameLines.length * NAME_LINE_HEIGHT +
    (compositionLines.length > 0 ? DIVIDER_SPACE + compositionLines.length * COMPOSITION_LINE_HEIGHT : 0) +
    DIVIDER_SPACE + PRICE_LINE_HEIGHT;

  // Вертикальное центрирование между верхней границей и QR-кодом
  let currentY = Math.round((qrY - totalTextHeight) / 2);

  // === НАЗВАНИЕ ТОВАРА (Regular, ~52px) ===
  ctx.fillStyle = '#111111';
  ctx.font = `400 ${NAME_FONT_SIZE}px "Sofia Sans Condensed", sans-serif`;
  ctx.textAlign = 'center';

  for (const line of nameLines) {
    currentY += NAME_LINE_HEIGHT;
    ctx.fillText(line, LABEL_WIDTH / 2, currentY);
  }

  // Небольшой отступ после названия
  currentY += 12;

  // Разделитель
  ctx.strokeStyle = '#DDDDDD';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, currentY);
  ctx.lineTo(LABEL_WIDTH - PADDING, currentY);
  ctx.stroke();
  currentY += 12;

  // === СОСТАВ (мелкий, ~20px) ===
  if (compositionLines.length > 0) {
    ctx.fillStyle = '#555555';
    ctx.font = `400 ${COMPOSITION_FONT_SIZE}px "Sofia Sans Condensed", sans-serif`;
    ctx.textAlign = 'center';

    for (const line of compositionLines) {
      currentY += COMPOSITION_LINE_HEIGHT;
      ctx.fillText(line, LABEL_WIDTH / 2, currentY);
    }
  }

  // === ЦЕНА ===
  currentY += DIVIDER_SPACE;
  ctx.font = `700 ${PRICE_FONT_SIZE}px "Sofia Sans Condensed", sans-serif`;
  ctx.textAlign = 'center';
  const priceY = currentY + PRICE_FONT_SIZE;

  if (hasDiscount && discountedPrice !== null) {
    const oldPriceText = `${product.price.toLocaleString('ru-RU')} ₽`;
    const newPriceText = `${discountedPrice.toLocaleString('ru-RU')} ₽`;
    const separator = '  →  ';

    // Измеряем ширины каждой части
    const oldPriceWidth = ctx.measureText(oldPriceText).width;
    const separatorWidth = ctx.measureText(separator).width;
    const newPriceWidth = ctx.measureText(newPriceText).width;
    const totalWidth = oldPriceWidth + separatorWidth + newPriceWidth;

    // Стартовая X для центрирования всей строки
    const startX = Math.round(LABEL_WIDTH / 2 - totalWidth / 2);

    ctx.textAlign = 'left';

    // 1. Старая цена — серым
    ctx.fillStyle = '#999999';
    ctx.fillText(oldPriceText, startX, priceY);

    // Зачёркивание старой цены
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(startX, priceY - PRICE_FONT_SIZE * 0.35);
    ctx.lineTo(startX + oldPriceWidth, priceY - PRICE_FONT_SIZE * 0.35);
    ctx.stroke();

    // 2. Стрелка — серым
    ctx.fillStyle = '#999999';
    ctx.fillText(separator, startX + oldPriceWidth, priceY);

    // 3. Новая цена — чёрным
    ctx.fillStyle = '#111111';
    ctx.fillText(newPriceText, startX + oldPriceWidth + separatorWidth, priceY);

    ctx.textAlign = 'center';
  } else {
    // Просто цена жирным
    ctx.fillStyle = '#111111';
    ctx.fillText(`${product.price.toLocaleString('ru-RU')} ₽`, LABEL_WIDTH / 2, priceY);
  }

  // === QR-КОД (снизу по центру) ===
  const qrImage = await loadImage(qrBuffer);
  const qrX = (LABEL_WIDTH - QR_SIZE) / 2;
  ctx.drawImage(qrImage, qrX, qrY, QR_SIZE, QR_SIZE);

  logger.info('Label generated', { productId: product.id, productName: product.name });

  return canvas.toBuffer('image/png');
}
