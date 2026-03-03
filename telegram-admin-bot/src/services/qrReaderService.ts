import { Jimp } from 'jimp';
import { BrowserQRCodeReader, BinaryBitmap, HybridBinarizer, RGBLuminanceSource } from '@zxing/library';
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
 * Использует ZXing для декодирования.
 *
 * *Интериор: "Это не просто фото. Это улика. Скоро узнаем."*
 */
export async function readQRFromBuffer(imageBuffer: Buffer): Promise<QRReadResult> {
  try {
    // Загружаем изображение через Jimp v1 API
    const image = await Jimp.fromBuffer(imageBuffer);

    // Масштабируем если сли��ком маленькое (ZXing лучше работает с большими изображениями)
    const { width, height } = image;
    if (width < 300 || height < 300) {
      image.scale(2);
    }

    // Конвертируем в RGBA буфер для ZXing
    const w = image.width;
    const h = image.height;
    const rgbaBuffer = image.bitmap.data;

    // ZXing ожидает Uint8ClampedArray с RGBA данными
    const uint8Array = new Uint8ClampedArray(rgbaBuffer);

    // Создаём источник яркости для ZXing
    const luminanceSource = new RGBLuminanceSource(uint8Array, w, h);
    const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));

    // Декодируем QR
    const reader = new BrowserQRCodeReader();
    const result = reader.decodeBitmap(binaryBitmap);

    const rawText = result.getText();
    logger.info('QR code decoded', { rawText });

    // Парсим UUID товара из текста
    const productId = parseProductId(rawText);

    return {
      found: true,
      productId: productId ?? undefined,
      rawText,
    };
  } catch (err: any) {
    // ZXing бросает NotFoundException если QR не найден
    if (
      err?.name === 'NotFoundException' ||
      err?.message?.includes('No MultiFormat Readers') ||
      err?.message?.includes('No barcode')
    ) {
      logger.info('No QR code found in image');
      return { found: false };
    }

    logger.error('Error reading QR code', { err });
    return { found: false };
  }
}
