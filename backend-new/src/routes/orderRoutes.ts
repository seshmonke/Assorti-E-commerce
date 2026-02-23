import { Router } from 'express';
import { OrderController } from '../controllers/orderController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, OrderController.getAllOrders);
router.get('/:id', authMiddleware, OrderController.getOrderById);
router.post('/', authMiddleware, OrderController.createOrder);
router.put('/:id/status', authMiddleware, OrderController.updateOrderStatus);
router.post('/:id/cancel', authMiddleware, OrderController.cancelOrder);
router.delete('/:id', authMiddleware, OrderController.deleteOrder);

export default router;
