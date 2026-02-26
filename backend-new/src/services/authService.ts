import jwt from 'jsonwebtoken';
import { isValid } from '@tma.js/init-data-node';
import { prisma } from '../lib/prisma.js';
import type { IUser } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-me';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-me';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const AUTH_DATE_TOLERANCE = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах

/**
 * Валидирует initData от Telegram Mini App
 * Проверяет подпись (HMAC-SHA256) и свежесть auth_date
 */
export async function validateTelegramInitData(initData: string): Promise<{
    valid: boolean;
    data?: Record<string, unknown>;
    error?: string;
}> {
    try {
        if (!TELEGRAM_BOT_TOKEN) {
            return {
                valid: false,
                error: 'TELEGRAM_BOT_TOKEN не установлен',
            };
        }

        // Используем @tma.js/init-data-node для валидации подписи
        const valid = isValid(initData, TELEGRAM_BOT_TOKEN);

        if (!valid) {
            return {
                valid: false,
                error: 'Невалидная подпись или истёкшие данные initData',
            };
        }

        // Парсим initData для извлечения user информации
        const searchParams = new URLSearchParams(initData);
        const userStr = searchParams.get('user');

        if (!userStr) {
            return {
                valid: false,
                error: 'User информация не найдена в initData',
            };
        }

        const userData = JSON.parse(userStr);

        return {
            valid: true,
            data: userData,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
        return {
            valid: false,
            error: `Ошибка при валидации initData: ${message}`,
        };
    }
}

/**
 * Ищет пользователя по telegramId или создаёт нового
 */
export async function findOrCreateUser(telegramData: {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
}): Promise<IUser> {
    const telegramId = String(telegramData.id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let user = await (prisma as any).user.findUnique({
        where: { telegramId },
    });

    if (!user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        user = await (prisma as any).user.create({
            data: {
                telegramId,
                username: telegramData.username || null,
                firstName: telegramData.first_name || null,
                lastName: telegramData.last_name || null,
            },
        });
    }

    return user;
}

/**
 * Генерирует JWT access токен
 */
export function generateAccessToken(userId: string, telegramId: string): string {
    return jwt.sign(
        {
            userId,
            telegramId,
        },
        JWT_SECRET,
        { expiresIn: '15m' },
    );
}

/**
 * Генерирует JWT refresh токен
 */
export function generateRefreshToken(userId: string, telegramId: string): string {
    return jwt.sign(
        {
            userId,
            telegramId,
        },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' },
    );
}

/**
 * Генерирует оба токена
 */
export function generateTokens(userId: string, telegramId: string) {
    return {
        accessToken: generateAccessToken(userId, telegramId),
        refreshToken: generateRefreshToken(userId, telegramId),
    };
}

/**
 * Верифицирует и декодирует access токен
 */
export function verifyAccessToken(token: string): {
    valid: boolean;
    payload?: Record<string, unknown>;
    error?: string;
} {
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        return {
            valid: true,
            payload: payload as Record<string, unknown>,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid token';
        return {
            valid: false,
            error: message,
        };
    }
}

/**
 * Верифицирует и декодирует refresh токен
 */
export function verifyRefreshToken(token: string): {
    valid: boolean;
    payload?: Record<string, unknown>;
    error?: string;
} {
    try {
        const payload = jwt.verify(token, JWT_REFRESH_SECRET);
        return {
            valid: true,
            payload: payload as Record<string, unknown>,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid token';
        return {
            valid: false,
            error: message,
        };
    }
}
