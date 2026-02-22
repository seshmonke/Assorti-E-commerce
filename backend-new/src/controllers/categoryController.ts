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

            if (!data.name || !data.section || data.order === undefined) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required fields: name, section, order',
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

            const category = await CategoryModel.update(id, data);

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

            const category = await CategoryModel.delete(id);

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
