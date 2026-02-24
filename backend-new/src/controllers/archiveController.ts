import type { Request, Response, NextFunction } from 'express';
import { ArchiveModel } from '../models/archiveModel.js';
import { ProductModel } from '../models/productModel.js';
import { prisma } from '../lib/prisma.js';
import type { CreateArchiveDTO, ApiResponse } from '../types/index.js';

export class ArchiveController {
    /**
     * GET /api/archive - Получить все архивные товары
     */
    static async getAllArchive(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const items = await ArchiveModel.findAll();
            const response: ApiResponse<typeof items> = {
                success: true,
                data: items,
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/archive/:id - Получить архивный товар по ID
     */
    static async getArchiveById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const item = await ArchiveModel.findById(id);

            if (!item) {
                res.status(404).json({
                    success: false,
                    error: 'Archive item not found',
                });
                return;
            }

            const response: ApiResponse<typeof item> = {
                success: true,
                data: item,
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/archive - Создать запись в архиве
     */
    static async createArchive(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data: CreateArchiveDTO = req.body;

            if (!data.name || !data.price || !data.categoryId) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required fields: name, price, categoryId',
                });
                return;
            }

            const item = await ArchiveModel.create(data);

            res.status(201).json({
                success: true,
                data: item,
                message: 'Archive item created successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/archive/:id/restore - Вернуть товар из архива в ассортимент
     * Создаёт Product из Archive, удаляет запись из Archive
     */
    static async restoreFromArchive(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };

            const archiveItem = await ArchiveModel.findById(id);
            if (!archiveItem) {
                res.status(404).json({
                    success: false,
                    error: 'Archive item not found',
                });
                return;
            }

            // Атомарно: создаём товар и удаляем из архива
            const product = await prisma.$transaction(async (tx) => {
                const newProduct = await tx.product.create({
                    data: {
                        name: archiveItem.name,
                        price: archiveItem.price,
                        image: archiveItem.image,
                        categoryId: archiveItem.categoryId,
                        description: archiveItem.description,
                        sizes: archiveItem.sizes as any,
                        composition: archiveItem.composition as any,
                        discount: archiveItem.discount ?? null,
                    },
                    include: { category: true },
                });

                await tx.archive.delete({ where: { id } });

                return newProduct;
            });

            res.json({
                success: true,
                data: product,
                message: 'Product restored from archive successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/archive/:id - Удалить запись из архива без восстановления
     */
    static async deleteArchive(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };

            const item = await ArchiveModel.findById(id);
            if (!item) {
                res.status(404).json({
                    success: false,
                    error: 'Archive item not found',
                });
                return;
            }

            await ArchiveModel.delete(id);

            res.json({
                success: true,
                message: 'Archive item deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }
}
