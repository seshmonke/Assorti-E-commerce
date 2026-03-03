import { Jimp } from 'jimp';
import jsQR from 'jsqr';
import { logger } from '../utils/logger';

/**
 * Результат чтения QR-кода из фото
 */
export interface QRReadResult {
  /** Найден ли QR-код */
  found: boolean;
  /** UUID товара (если QR содержит ссылку на товар) */
  productId?: string;
  /** Сырой текст QR-кода */
  rawText?: string;
}

/**
 * Парсит UUID товара из URL вида:
 * https://assortishop.online/product/{uuid}
 * или просто UUID напрямую
 */
function parseProductId(text: string): string | null {
  // Пробуем распарсить как URL с /product/{uuid}
  const urlMatch = text.match(/\/product\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (urlMatch) {
    return urlMatch[1];
  }

  // Пробуем как чистый UUID
  const uuidMatch = text.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
  if (uuidMatch) {
    return uuidMatch[1];
  }

  return null;
}

/**
 * Читает QR-код из PNG/JPEG буфера.
 * Использует jsQR для декодирования — чистый JS, работает в Node.js.
 *
 * jsQR принимает RGBA данные напрямую из Jimp — никакой конвертации не нужно.
 *
 * *Интериор: "Это не просто фото. Это улика. Скоро узнаем."*
 */
export async function readQRFromBuffer(imageBuffer: Buffer): Promise<QRReadResult> {
  logger.info('readQRFromBuffer: start', { bufferSize: imageBuffer.length });

  try {
    // Загружаем изображение через Jimp v1 API
    logger.debug('readQRFromBuffer: loading image with Jimp');
    const image = await Jimp.fromBuffer(imageBuffer);

    const { width, height } = image;
    logger.info('readQRFromBuffer: image loaded', { width, height });

    // Масштабируем если слишком маленькое (jsQR лучше работает с большими изображениями)
    if (width < 300 || height < 300) {
      image.scale(2);
      logger.info('readQRFromBuffer: image scaled x2', { newWidth: image.width, newHeight: image.height });
    }

    const w = image.width;
    const h = image.height;

    // jsQR принимает Uint8ClampedArray в формате RGBA — ровно то, что даёт Jimp
    const rgbaData = new Uint8ClampedArray(image.bitmap.data);
    logger.debug('readQRFromBuffer: passing RGBA data to jsQR', { w, h, dataLength: rgbaData.length });

    // Декодируем QR-код
    const code = jsQR(rgbaData, w, h);

    if (!code) {
      logger.info('readQRFromBuffer: no QR code found in image');
      return { found: false };
    }

    const rawText = code.data;
    logger.info('readQRFromBuffer: QR code decoded successfully', { rawText });

    // Парсим UUID товара из текста
    const productId = parseProductId(rawText);
    logger.info('readQRFromBuffer: parseProductId result', { productId, rawText });

    return {
      found: true,
      productId: productId ?? undefined,
      rawText,
    };
  } catch (err: any) {
    logger.error('readQRFromBuffer: unexpected error', {
      errName: err?.name,
      errMessage: err?.message,
      errStack: err?.stack,
    });
    return { found: false };
  }
}
