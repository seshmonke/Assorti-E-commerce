import { Router } from 'express';
import { BrowserUserController } from '../controllers/browserUserController.js';

const router = Router();

// Регистрация/обновление browserUser (без авторизации)
router.post('/register', BrowserUserController.register);

// Получить browserUser по ID
router.get('/:id', BrowserUserController.getById);

export default router;
