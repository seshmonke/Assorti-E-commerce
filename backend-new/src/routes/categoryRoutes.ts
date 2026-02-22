import { Router } from 'express';
import { CategoryController } from '../controllers/categoryController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Публичные маршруты
router.get('/', CategoryController.getAllCategories);
router.get('/:id', CategoryController.getCategoryById);

// Защищённые маршруты
router.post('/', authMiddleware, CategoryController.createCategory);
router.put('/:id', authMiddleware, CategoryController.updateCategory);
router.delete('/:id', authMiddleware, CategoryController.deleteCategory);

export default router;
