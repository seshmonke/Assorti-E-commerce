import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Создать платёж — без авторизации (browserUser flow)
router.post('/create', PaymentController.createPayment);

// Проверить статус оплаты заказа — без авторизации
router.get('/check/:orderId', PaymentController.checkPayment);

// Вебхук от ЮKassa (без авторизации — ЮKassa шлёт сама)
router.post('/webhook', PaymentController.handleWebhook);

export default router;
