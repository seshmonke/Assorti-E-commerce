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

// Размеры этикетки: портрет 20×40мм при 203dpi = 160×320px
const LABEL_WIDTH = 160;
const LABEL_HEIGHT = 320;

// Размер QR-кода
const QR_SIZE = 120;

// Отступы
const PADDING = 10;

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
 * Портретный макет 20×40мм (160×320px @203dpi):
 * - Сверху: название товара (тонкий шрифт, 1-2 строки)
 * - Под названием: состав коротко (мелкий шрифт)
 * - Снизу по центру: QR-код 120×120px
 */
export async function generateLabelImage(product: Product): Promise<Buffer> {
  const productUrl = `${env.SITE_URL}/product/${product.id}`;

  // Генерируем QR-код в буфер
  const qrBuffer = await QRCode.toBuffer(productUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: QR_SIZE,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  // Создаём canvas (портрет)
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
  let currentY = PADDING;

  // === НАЗВАНИЕ ТОВАРА (Regular, тонкий, ~13px) ===
  ctx.fillStyle = '#111111';
  ctx.font = '400 13px "Sofia Sans Condensed", sans-serif';

  const nameLines = wrapText(ctx as any, product.name.toUpperCase(), textZoneWidth, 2);
  for (const line of nameLines) {
    currentY += 14;
    ctx.fillText(line, PADDING, currentY);
  }

  // Небольшой отступ после названия
  currentY += 6;

  // Разделитель
  ctx.strokeStyle = '#DDDDDD';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(PADDING, currentY);
  ctx.lineTo(LABEL_WIDTH - PADDING, currentY);
  ctx.stroke();
  currentY += 6;

  // === СОСТАВ (мелкий, ~10px) ===
  const compositionRaw = formatComposition(product.composition);
  if (compositionRaw) {
    const compositionText = compositionRaw.length > 60
      ? compositionRaw.slice(0, 60) + '...'
      : compositionRaw;

    ctx.fillStyle = '#555555';
    ctx.font = '400 10px "Sofia Sans Condensed", sans-serif';

    const compositionLines = wrapText(ctx as any, compositionText, textZoneWidth, 3);
    for (const line of compositionLines) {
      currentY += 12;
      ctx.fillText(line, PADDING, currentY);
    }
  }

  // === QR-КОД (снизу по центру) ===
  const qrImage = await loadImage(qrBuffer);
  const qrX = (LABEL_WIDTH - QR_SIZE) / 2;
  const qrY = LABEL_HEIGHT - QR_SIZE - PADDING - 14;
  ctx.drawImage(qrImage, qrX, qrY, QR_SIZE, QR_SIZE);

  // Подпись под QR
  ctx.fillStyle = '#888888';
  ctx.font = '400 8px "Sofia Sans Condensed", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SCAN ME', LABEL_WIDTH / 2, qrY + QR_SIZE + 10);

  // ID товара (мелко, под SCAN ME)
  const shortId = product.id.split('-')[0];
  ctx.fillStyle = '#BBBBBB';
  ctx.font = '400 7px "Sofia Sans Condensed", sans-serif';
  ctx.fillText(`#${shortId}`, LABEL_WIDTH / 2, LABEL_HEIGHT - PADDING);
  ctx.textAlign = 'left';

  logger.info('Label generated', { productId: product.id, productName: product.name });

  return canvas.toBuffer('image/png');
}
