import type { Request, Response, NextFunction } from 'express';
import { BrowserUserModel } from '../models/browserUserModel.js';
import type { CreateBrowserUserDTO, ApiResponse } from '../types/index.js';

export class BrowserUserController {
    /**
     * POST /api/browser-users/register
     * Регистрация / обновление browserUser по данным из формы.
     * Не требует авторизации — пользователь вводит данные в браузере.
     */
    static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = req.body as CreateBrowserUserDTO;

            if (!data.name || !data.phone) {
                res.status(400).json({
                    success: false,
                    error: 'Обязательные поля: name, phone',
                });
                return;
            }

            // Валидация телефона (простая)
            const phoneClean = data.phone.replace(/\D/g, '');
            if (phoneClean.length < 10 || phoneClean.length > 15) {
                res.status(400).json({
                    success: false,
                    error: 'Некорректный номер телефона',
                });
                return;
            }

            const browserUser = await BrowserUserModel.findOrCreate({
                ...data,
                phone: phoneClean,
            });

            const response: ApiResponse<typeof browserUser> = {
                success: true,
                data: browserUser,
                message: 'Пользователь зарегистрирован',
            };
            res.status(201).json(response);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/browser-users/:id
     * Получить browserUser по ID
     */
    static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const browserUser = await BrowserUserModel.findById(id);

            if (!browserUser) {
                res.status(404).json({
                    success: false,
                    error: 'Пользователь не найден',
                });
                return;
            }

            const response: ApiResponse<typeof browserUser> = {
                success: true,
                data: browserUser,
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }
}
