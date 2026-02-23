import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Создать платёж и получить QR URL
router.post('/create', authMiddleware, PaymentController.createPayment);

// Проверить статус оплаты заказа
router.get('/check/:orderId', authMiddleware, PaymentController.checkPayment);

// Вебхук от ЮKassa (без авторизации — ЮKassa шлёт сама)
router.post('/webhook', PaymentController.handleWebhook);

export default router;
