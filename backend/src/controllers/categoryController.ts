import type { Request, Response, NextFunction } from 'express';
import { CategoryModel } from '../models/categoryModel.js';
import type { CreateCategoryDTO, UpdateCategoryDTO, ApiResponse } from '../types/index.js';

export class CategoryController {
    /**
     * GET /api/categories - Получить все категории
     */
    static async getAllCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const categories = await CategoryModel.findAll();
            const response: ApiResponse<typeof categories> = {
                success: true,
                data: categories,
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/categories/:id - Получить категорию по ID
     */
    static async getCategoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const category = await CategoryModel.findById(id);

            if (!category) {
                res.status(404).json({
                    success: false,
                    error: 'Category not found',
                });
                return;
            }

            const response: ApiResponse<typeof category> = {
                success: true,
                data: category,
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/categories - Создать категорию
     */
    static async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data: CreateCategoryDTO = req.body;

            if (!data.name || !data.section) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required fields: name, section',
                });
                return;
            }

            if (data.section !== 'clothing' && data.section !== 'accessories') {
                res.status(400).json({
                    success: false,
                    error: 'Section must be "clothing" or "accessories"',
                });
                return;
            }

            // Автоматически назначаем order = max + 1 в разделе
            const maxOrder = await CategoryModel.getMaxOrder(data.section);
            data.order = maxOrder + 1;

            const category = await CategoryModel.create(data);

            res.status(201).json({
                success: true,
                data: category,
                message: 'Category created successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/categories/:id - Обновить категорию
     */
    static async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const data: UpdateCategoryDTO = req.body;

            if (data.section && data.section !== 'clothing' && data.section !== 'accessories') {
                res.status(400).json({
                    success: false,
                    error: 'Section must be "clothing" or "accessories"',
                });
                return;
            }

            // Если меняется раздел — фиксируем старый раздел до обновления
            let oldSection: string | undefined;
            if (data.section) {
                const existing = await CategoryModel.findById(id);
                if (existing && existing.section !== data.section) {
                    oldSection = existing.section;
                    // Назначаем последний порядок в новом разделе
                    const maxOrder = await CategoryModel.getMaxOrder(data.section);
                    data.order = maxOrder + 1;
                }
            }

            const category = await CategoryModel.update(id, data);

            // Перенумеровываем старый раздел, если категория переехала
            if (oldSection) {
                await CategoryModel.renumberSection(oldSection);
            }

            const response: ApiResponse<typeof category> = {
                success: true,
                data: category,
                message: 'Category updated successfully',
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/categories/:id - Удалить категорию
     */
    static async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };

            // Фиксируем раздел до удаления для перенумерации
            const existing = await CategoryModel.findById(id);
            const section = existing?.section;

            const category = await CategoryModel.delete(id);

            // Перенумеровываем раздел после удаления
            if (section) {
                await CategoryModel.renumberSection(section);
            }

            const response: ApiResponse<typeof category> = {
                success: true,
                data: category,
                message: 'Category deleted successfully',
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }
}
