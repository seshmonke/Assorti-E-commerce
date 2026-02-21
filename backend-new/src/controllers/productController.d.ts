import type { Request, Response, NextFunction } from 'express';
export declare class ProductController {
    /**
     * GET /api/products - Получить все продукты
     */
    static getAllProducts(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/products/:id - Получить продукт по ID
     */
    static getProductById(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/products/category/:category - Получить продукты по категории
     */
    static getProductsByCategory(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/products/search?q=query - Поиск продуктов
     */
    static searchProducts(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/products - Создать новый продукт (требует аутентификации)
     */
    static createProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * PUT /api/products/:id - Обновить продукт (требует аутентификации)
     */
    static updateProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * DELETE /api/products/:id - Удалить продукт (требует аутентификации)
     */
    static deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=productController.d.ts.map