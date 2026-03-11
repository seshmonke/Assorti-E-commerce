import { Router } from 'express';
import { OrderController } from '../controllers/orderController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Требуют Telegram авторизации
router.get('/my', authMiddleware, OrderController.getMyOrders);
router.get('/', authMiddleware, OrderController.getAllOrders);
router.put('/:id/status', authMiddleware, OrderController.updateOrderStatus);
router.post('/:id/cancel', authMiddleware, OrderController.cancelOrder);
router.delete('/:id', authMiddleware, OrderController.deleteOrder);

// Без авторизации — browserUser flow
router.post('/', OrderController.createOrder);
router.get('/:id', OrderController.getOrderById);

export default router;
