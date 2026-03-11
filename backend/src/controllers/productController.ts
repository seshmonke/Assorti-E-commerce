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
            const { id } = req.params as { id: string };
            const product = await ProductModel.findById(id);

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
     * GET /api/products/category/:categoryId - Получить продукты по категории ID
     */
    static async getProductsByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { categoryId } = req.params as { categoryId: string };
            const products = await ProductModel.findByCategory(categoryId);

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
     * GET /api/products/sale - Получить товары со скидкой
     */
    static async getProductsOnSale(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const products = await ProductModel.findOnSale();
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
     * GET /api/products/archived - Получить архивированные товары
     */
    static async getArchivedProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const products = await ProductModel.findAllArchived();
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
            if (!data.name || !data.price || !data.categoryId) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required fields: name, price, categoryId',
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
            const { id } = req.params as { id: string };
            const data: UpdateProductDTO = req.body;

            const product = await ProductModel.update(id, data);

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
            const { id } = req.params as { id: string };

            const product = await ProductModel.delete(id);

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
