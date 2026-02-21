import { ProductModel } from '../models/productModel.js';
export class ProductController {
    /**
     * GET /api/products - Получить все продукты
     */
    static async getAllProducts(req, res, next) {
        try {
            const products = await ProductModel.findAll();
            const response = {
                success: true,
                data: products,
            };
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/products/:id - Получить продукт по ID
     */
    static async getProductById(req, res, next) {
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
            const response = {
                success: true,
                data: product,
            };
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/products/category/:category - Получить продукты по категории
     */
    static async getProductsByCategory(req, res, next) {
        try {
            const { category } = req.params;
            const products = await ProductModel.findByCategory(category);
            const response = {
                success: true,
                data: products,
            };
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/products/search?q=query - Поиск продуктов
     */
    static async searchProducts(req, res, next) {
        try {
            const { q } = req.query;
            if (!q || typeof q !== 'string') {
                res.status(400).json({
                    success: false,
                    error: 'Search query is required',
                });
                return;
            }
            const products = await ProductModel.search(q);
            const response = {
                success: true,
                data: products,
            };
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/products - Создать новый продукт (требует аутентификации)
     */
    static async createProduct(req, res, next) {
        try {
            const data = req.body;
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /api/products/:id - Обновить продукт (требует аутентификации)
     */
    static async updateProduct(req, res, next) {
        try {
            const { id } = req.params;
            const data = req.body;
            const product = await ProductModel.update(Number(id), data);
            const response = {
                success: true,
                data: product,
                message: 'Product updated successfully',
            };
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /api/products/:id - Удалить продукт (требует аутентификации)
     */
    static async deleteProduct(req, res, next) {
        try {
            const { id } = req.params;
            const product = await ProductModel.delete(Number(id));
            const response = {
                success: true,
                data: product,
                message: 'Product deleted successfully',
            };
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
}
//# sourceMappingURL=productController.js.map