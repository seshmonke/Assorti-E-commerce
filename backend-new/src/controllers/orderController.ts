import type { Request, Response, NextFunction } from 'express';
import { OrderModel } from '../models/orderModel.js';
import type { CreateOrderDTO, UpdateOrderStatusDTO, ApiResponse, OrderStatus } from '../types/index.js';

export class OrderController {
    /**
     * GET /api/orders - Получить все заказы
     */
    static async getAllOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { status } = req.query as { status?: string };

            let orders;
            if (status) {
                orders = await OrderModel.findByStatus(status as OrderStatus);
            } else {
                orders = await OrderModel.findAll();
            }

            const response: ApiResponse<typeof orders> = {
                success: true,
                data: orders,
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/orders/:id - Получить заказ по ID
     */
    static async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const order = await OrderModel.findById(id);

            if (!order) {
                res.status(404).json({
                    success: false,
                    error: 'Order not found',
                });
                return;
            }

            const response: ApiResponse<typeof order> = {
                success: true,
                data: order,
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/orders - Создать новый заказ
     */
    static async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data: CreateOrderDTO = req.body;

            if (!data.productId || !data.totalPrice) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required fields: productId, totalPrice',
                });
                return;
            }

            const order = await OrderModel.create(data);

            res.status(201).json({
                success: true,
                data: order,
                message: 'Order created successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/orders/:id/status - Обновить статус заказа
     */
    static async updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const data: UpdateOrderStatusDTO = req.body;

            const validStatuses: OrderStatus[] = ['pending_payment', 'paid', 'delivered'];
            if (!data.status || !validStatuses.includes(data.status)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid status. Must be: pending_payment, paid, delivered',
                });
                return;
            }

            const order = await OrderModel.updateStatus(id, data);

            const response: ApiResponse<typeof order> = {
                success: true,
                data: order,
                message: 'Order status updated successfully',
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/orders/:id - Удалить заказ
     */
    static async deleteOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const order = await OrderModel.delete(id);

            const response: ApiResponse<typeof order> = {
                success: true,
                data: order,
                message: 'Order deleted successfully',
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }
}
