import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/authService.js';
import { logAuthDenied } from '../utils/authLogger.js';

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                telegramId: string;
            };
        }
    }
}

/**
 * Middleware для проверки JWT токена из cookies
 * Проверяет accessToken из httpOnly cookies или заголовка Authorization: Bearer <token>
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    try {
        let token: string | null = null;

        // Сначала проверяем cookies
        if (req.cookies?.accessToken) {
            token = req.cookies.accessToken;
        }

        // Затем проверяем Authorization header (для совместимости)
        if (!token && req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.substring(7);
        }

        if (!token) {
            logAuthDenied('Missing authentication token', req.path, req.method, req);
            res.status(401).json({
                success: false,
                error: 'Missing authentication token',
            });
            return;
        }

        // Проверяем статичный API_SECRET_TOKEN для бота
        const apiSecretToken = process.env.API_SECRET_TOKEN;
        if (apiSecretToken && token === apiSecretToken) {
            // Для бота устанавливаем специальный пользователь
            req.user = {
                userId: 'bot',
                telegramId: 'bot',
            };
            next();
            return;
        }

        // Верифицируем JWT токен
        const verification = verifyAccessToken(token);

        if (!verification.valid || !verification.payload) {
            logAuthDenied(verification.error || 'Invalid or expired token', req.path, req.method, req);
            res.status(401).json({
                success: false,
                error: 'Invalid or expired token',
            });
            return;
        }

        // Устанавливаем пользователя в request
        req.user = {
            userId: verification.payload.userId as string,
            telegramId: verification.payload.telegramId as string,
        };

        next();
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Authentication failed';
        logAuthDenied(message, req.path, req.method, req);
        res.status(401).json({
            success: false,
            error: message,
        });
    }
}

