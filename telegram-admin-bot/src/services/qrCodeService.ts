import QRCode from 'qrcode';
import { logger } from '../utils/logger';

class QRCodeService {
  /**
   * Генерирует QR-код в виде Data URL
   */
  async generateQRCodeDataUrl(data: string, options?: any): Promise<string> {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.95,
        margin: 1,
        width: 300,
        ...options,
      });
      return qrCodeDataUrl as unknown as string;
    } catch (error) {
      logger.error('Failed to generate QR code data URL', { data, error });
      throw error;
    }
  }

  /**
   * Генерирует QR-код в виде PNG буфера
   */
  async generateQRCodeBuffer(data: string, options?: any): Promise<Buffer> {
    try {
      const buffer = await new Promise<Buffer>((resolve, reject) => {
        QRCode.toBuffer(data, {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          quality: 0.95,
          margin: 1,
          width: 300,
          ...options,
        }, (err: any, buffer: Buffer) => {
          if (err) reject(err);
          else resolve(buffer);
        });
      });
      return buffer;
    } catch (error) {
      logger.error('Failed to generate QR code buffer', { data, error });
      throw error;
    }
  }

  /**
   * Генерирует QR-код в виде SVG строки
   */
  async generateQRCodeSVG(data: string, options?: any): Promise<string> {
    try {
      const svg = await new Promise<string>((resolve, reject) => {
        QRCode.toString(data, {
          errorCorrectionLevel: 'H',
          type: 'image/svg+xml',
          quality: 0.95,
          margin: 1,
          width: 300,
          ...options,
        }, (err: any, svg: string) => {
          if (err) reject(err);
          else resolve(svg);
        });
      });
      return svg;
    } catch (error) {
      logger.error('Failed to generate QR code SVG', { data, error });
      throw error;
    }
  }

  /**
   * Создает QR-код для товара с информацией о нем
   */
  async generateProductQRCode(productId: string, productName: string): Promise<string> {
    try {
      // Формируем данные для QR-кода
      const qrData = `PRODUCT:${productId}:${productName}`;
      const dataUrl = await this.generateQRCodeDataUrl(qrData);
      return dataUrl;
    } catch (error) {
      logger.error('Failed to generate product QR code', { productId, productName, error });
      throw error;
    }
  }

  /**
   * Парсит данные из QR-кода товара
   */
  parseProductQRCode(qrData: string): { productId: string; productName: string } | null {
    try {
      if (!qrData.startsWith('PRODUCT:')) {
        return null;
      }

      const parts = qrData.split(':');
      if (parts.length < 3) {
        return null;
      }

      return {
        productId: parts[1],
        productName: parts.slice(2).join(':'),
      } as { productId: string; productName: string };
    } catch (error) {
      logger.error('Failed to parse product QR code', { qrData, error });
      return null;
    }
  }
}

export const qrCodeService = new QRCodeService();
