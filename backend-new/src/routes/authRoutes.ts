import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Публичные роуты
router.post('/signin', AuthController.signin);
router.post('/refresh', AuthController.refresh);

// Защищённые роуты
router.post('/logout', authMiddleware, AuthController.logout);

export default router;
