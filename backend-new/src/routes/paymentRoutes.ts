import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Создать платёж (из бота — требует авторизации)
router.post('/create', authMiddleware, PaymentController.createPayment);

// Вебхук от ЮKassa (публичный — ЮKassa сама шлёт POST запросы)
router.post('/webhook', PaymentController.handleWebhook);

// Получить статус платежа
router.get('/:paymentId', authMiddleware, PaymentController.getPaymentStatus);

export default router;
