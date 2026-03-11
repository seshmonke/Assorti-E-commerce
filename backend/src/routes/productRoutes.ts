import { Router } from 'express';
import { ProductController } from '../controllers/productController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Публичные маршруты (без аутентификации)
router.get('/', ProductController.getAllProducts);
router.get('/archived', ProductController.getArchivedProducts);
router.get('/sale', ProductController.getProductsOnSale);
router.get('/search', ProductController.searchProducts);
router.get('/category/:categoryId', ProductController.getProductsByCategory);
router.get('/:id', ProductController.getProductById);

// Защищённые маршруты (требуют аутентификации)
router.post('/', authMiddleware, ProductController.createProduct);
router.put('/:id', authMiddleware, ProductController.updateProduct);
router.delete('/:id', authMiddleware, ProductController.deleteProduct);

export default router;
