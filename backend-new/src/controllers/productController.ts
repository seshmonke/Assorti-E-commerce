import type { Request, Response, NextFunction } from 'express';
import { ProductModel } from '../models/productModel.js';
import type { CreateProductDTO, UpdateProductDTO, ApiResponse } from '../types/index.js';

export class ProductController {
    /**
     * GET /api/products - Получить все продукты
     */
    static async getAllProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const products = await ProductModel.findAll();
            const response: ApiResponse<typeof products> = {
                success: true,
                data: products,
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/products/:id - Получить продукт по ID
     */
    static async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const product = await ProductModel.findById(Number(id));

            if (!product) {
                res.status(404).json({
                    success: false,
                    error: 'Product not found',
                });
                return;
            }

            const response: ApiResponse<typeof product> = {
                success: true,
                data: product,
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/products/category/:category - Получить продукты по категории
     */
    static async getProductsByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { category } = req.params as { category: string };
            const products = await ProductModel.findByCategory(category);

            const response: ApiResponse<typeof products> = {
                success: true,
                data: products,
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/products/search?q=query - Поиск продуктов
     */
    static async searchProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { q } = req.query as { q?: string };

            if (!q || typeof q !== 'string') {
                res.status(400).json({
                    success: false,
                    error: 'Search query is required',
                });
                return;
            }

            const products = await ProductModel.search(q);

            const response: ApiResponse<typeof products> = {
                success: true,
                data: products,
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/products - Создать новый продукт (требует аутентификации)
     */
    static async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data: CreateProductDTO = req.body;

            // Базовая валидация
            if (!data.name || !data.price || !data.category) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required fields: name, price, category',
                });
                return;
            }

            const product = await ProductModel.create(data);

            res.status(201).json({
                success: true,
                data: product,
                message: 'Product created successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/products/:id - Обновить продукт (требует аутентификации)
     */
    static async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const data: UpdateProductDTO = req.body;

            const product = await ProductModel.update(Number(id), data);

            const response: ApiResponse<typeof product> = {
                success: true,
                data: product,
                message: 'Product updated successfully',
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/products/:id - Удалить продукт (требует аутентификации)
     */
    static async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            const product = await ProductModel.delete(Number(id));

            const response: ApiResponse<typeof product> = {
                success: true,
                data: product,
                message: 'Product deleted successfully',
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }
}
