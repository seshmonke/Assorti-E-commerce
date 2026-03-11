import type { Request, Response, NextFunction } from 'express';
import { searchCities, getPvzList, calculateDelivery } from '../services/cdekService.js';
import type { ApiResponse } from '../types/index.js';

export class CdekController {
    /**
     * GET /api/cdek/cities?query=Москва
     * Поиск городов СДЭК по названию
     */
    static async getCities(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { query } = req.query as { query?: string };

            if (!query || query.trim().length < 2) {
                res.status(400).json({
                    success: false,
                    error: 'Параметр query обязателен (минимум 2 символа)',
                });
                return;
            }

            const cities = await searchCities(query.trim());

            const response: ApiResponse<typeof cities> = {
                success: true,
                data: cities,
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/cdek/pvz?city_code=44
     * Получить список ПВЗ по коду города
     */
    static async getPvz(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { city_code } = req.query as { city_code?: string };

            if (!city_code) {
                res.status(400).json({
                    success: false,
                    error: 'Параметр city_code обязателен',
                });
                return;
            }

            const cityCode = parseInt(city_code, 10);
            if (isNaN(cityCode)) {
                res.status(400).json({
                    success: false,
                    error: 'city_code должен быть числом',
                });
                return;
            }

            const pvzList = await getPvzList(cityCode);

            const response: ApiResponse<typeof pvzList> = {
                success: true,
                data: pvzList,
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/cdek/calc
     * Рассчитать стоимость доставки
     * Body: { city_code: number, weight?: number }
     */
    static async calcDelivery(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { city_code, weight } = req.body as { city_code?: number; weight?: number };

            if (!city_code) {
                res.status(400).json({
                    success: false,
                    error: 'Поле city_code обязательно',
                });
                return;
            }

            const tariffs = await calculateDelivery(city_code, weight ?? 500);

            // Берём самый дешёвый тариф для ПВЗ (тариф 136 — Посылка склад-склад)
            const cheapest = tariffs.sort((a, b) => a.delivery_sum - b.delivery_sum)[0];

            const response: ApiResponse<{
                tariffs: typeof tariffs;
                recommended: typeof cheapest;
            }> = {
                success: true,
                data: {
                    tariffs,
                    recommended: cheapest,
                },
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }
}
