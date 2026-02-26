import type { Request, Response } from 'express';
import {
    validateTelegramInitData,
    findOrCreateUser,
    generateTokens,
    verifyRefreshToken,
} from '../services/authService.js';
import {
    logSigninSuccess,
    logSigninFailed,
    logTokenRefreshed,
    logRefreshFailed,
    logLogout,
} from '../utils/authLogger.js';
import type { ApiResponse, IUser } from '../types/index.js';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
};

export class AuthController {
    /**
     * POST /auth/signin
     * Принимает initData от Telegram Mini App, валидирует, создаёт/находит пользователя
     * Возвращает JWT токены в httpOnly cookies
     */
    static async signin(req: Request, res: Response): Promise<void> {
        try {
            const { initData } = req.body;

            if (!initData || typeof initData !== 'string') {
                res.status(400).json({
                    success: false,
                    error: 'initData is required',
                } as ApiResponse<null>);
                return;
            }

            // Валидируем initData
            const validation = await validateTelegramInitData(initData);

            if (!validation.valid) {
                logSigninFailed(validation.error || 'Invalid initData', req);
                res.status(401).json({
                    success: false,
                    error: validation.error || 'Invalid initData',
                } as ApiResponse<null>);
                return;
            }

            const telegramUser = validation.data as {
                id: number;
                username?: string;
                first_name?: string;
                last_name?: string;
            };

            // Ищем или создаём пользователя
            const user = await findOrCreateUser(telegramUser);

            // Генерируем токены
            const tokens = generateTokens(user.id, user.telegramId);

            // Логируем успешную авторизацию
            logSigninSuccess(user.telegramId, user.username || null, req);

            // Устанавливаем cookies
            res.cookie('accessToken', tokens.accessToken, COOKIE_OPTIONS);
            res.cookie('refreshToken', tokens.refreshToken, {
                ...COOKIE_OPTIONS,
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            res.status(200).json({
                success: true,
                data: {
                    user,
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                },
                message: 'Авторизация успешна',
            } as ApiResponse<{
                user: IUser;
                accessToken: string;
                refreshToken: string;
            }>);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            logSigninFailed(message, req);
            res.status(500).json({
                success: false,
                error: `Auth signin failed: ${message}`,
            } as ApiResponse<null>);
        }
    }

    /**
     * POST /auth/refresh
     * Обновляет access токен используя refresh токен из cookie
     */
    static async refresh(req: Request, res: Response): Promise<void> {
        try {
            const refreshToken = req.cookies.refreshToken;

            if (!refreshToken) {
                logRefreshFailed('Refresh token not found', req);
                res.status(401).json({
                    success: false,
                    error: 'Refresh token not found',
                } as ApiResponse<null>);
                return;
            }

            // Верифицируем refresh токен
            const verification = verifyRefreshToken(refreshToken);

            if (!verification.valid || !verification.payload) {
                logRefreshFailed('Invalid refresh token', req);
                res.status(401).json({
                    success: false,
                    error: 'Invalid refresh token',
                } as ApiResponse<null>);
                return;
            }

            const userId = verification.payload.userId as string;
            const telegramId = verification.payload.telegramId as string;

            // Генерируем новый access токен
            const tokens = generateTokens(userId, telegramId);

            // Логируем успешное обновление токена
            logTokenRefreshed(userId, req);

            // Обновляем cookies
            res.cookie('accessToken', tokens.accessToken, COOKIE_OPTIONS);

            res.status(200).json({
                success: true,
                data: {
                    accessToken: tokens.accessToken,
                },
                message: 'Token refreshed',
            } as ApiResponse<{ accessToken: string }>);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            logRefreshFailed(message, req);
            res.status(500).json({
                success: false,
                error: `Token refresh failed: ${message}`,
            } as ApiResponse<null>);
        }
    }

    /**
     * POST /auth/logout
     * Очищает cookies
     */
    static async logout(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId || 'unknown';

            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');

            // Логируем logout
            logLogout(userId, req);

            res.status(200).json({
                success: true,
                message: 'Logout successful',
            } as ApiResponse<null>);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({
                success: false,
                error: `Logout failed: ${message}`,
            } as ApiResponse<null>);
        }
    }
}
