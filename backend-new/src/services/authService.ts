import jwt from 'jsonwebtoken';
import { validateFp, ExpiredError, SignatureInvalidError, SignatureMissingError, AuthDateInvalidError } from '@tma.js/init-data-node';
import { either } from 'fp-ts';
import { prisma } from '../lib/prisma.js';
import type { IUser } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-me';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-me';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
/**
 * Валидирует initData от Telegram Mini App
 * Проверяет подпись (HMAC-SHA256). Проверка времени отключена (expiresIn: 0),
 * так как Telegram кэширует initData и auth_date может быть старше 24 часов.
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

        // Используем validateFp для получения конкретной ошибки валидации.
        // expiresIn: 0 — отключаем проверку времени, т.к. Telegram кэширует initData.
        const result = validateFp(initData, TELEGRAM_BOT_TOKEN, { expiresIn: 0 });

        if (either.isLeft(result)) {
            const err = result.left;
            let errorMsg = 'Невалидная подпись initData';

            if (err instanceof ExpiredError) {
                errorMsg = `initData истёк: ${err.message}`;
            } else if (err instanceof SignatureInvalidError) {
                errorMsg = 'Невалидная подпись initData (неверный TELEGRAM_BOT_TOKEN?)';
            } else if (err instanceof SignatureMissingError) {
                errorMsg = 'Отсутствует hash в initData';
            } else if (err instanceof AuthDateInvalidError) {
                errorMsg = 'Отсутствует или невалидный auth_date в initData';
            }

            return {
                valid: false,
                error: errorMsg,
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
