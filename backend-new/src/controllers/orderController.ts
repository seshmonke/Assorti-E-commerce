import type { Request, Response, NextFunction } from 'express';
import { OrderModel } from '../models/orderModel.js';
import { ProductModel } from '../models/productModel.js';
import { prisma } from '../lib/prisma.js';
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
     * При создании атомарно бронируем товар и создаём заказ
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

            // Проверяем существование товара
            const product = await ProductModel.findById(data.productId);
            if (!product) {
                res.status(404).json({
                    success: false,
                    error: 'Product not found',
                });
                return;
            }

            // Создаём заказ
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
     * При переходе в "paid" — удаляем товар из БД
     * При переходе в "cancelled" — снимаем бронь атомарно
     */
    static async updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const data: UpdateOrderStatusDTO = req.body;

            const validStatuses: OrderStatus[] = ['pending_payment', 'paid', 'delivered', 'cancelled'];
            if (!data.status || !validStatuses.includes(data.status)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid status. Must be: pending_payment, paid, delivered, cancelled',
                });
                return;
            }

            const existingOrder = await OrderModel.findById(id);
            if (!existingOrder) {
                res.status(404).json({
                    success: false,
                    error: 'Order not found',
                });
                return;
            }

            // Если заказ отменён — просто обновляем статус
            if (data.status === 'cancelled') {
                const order = await OrderModel.updateStatus(id, data);
                const response: ApiResponse<typeof order> = {
                    success: true,
                    data: order,
                    message: 'Order status updated successfully',
                };
                res.json(response);
                return;
            }

            const order = await OrderModel.updateStatus(id, data);

            // Если заказ оплачен — удаляем товар из БД (продан)
            if (data.status === 'paid') {
                try {
                    await ProductModel.delete(existingOrder.productId);
                } catch {
                    // Товар мог быть уже удалён — не критично
                }
            }

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
     * POST /api/orders/:id/cancel - Отменить заказ
     * Атомарно снимает бронь с товара и ставит статус cancelled
     */
    static async cancelOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };

            const existingOrder = await OrderModel.findById(id);
            if (!existingOrder) {
                res.status(404).json({
                    success: false,
                    error: 'Order not found',
                });
                return;
            }

            if (existingOrder.status === 'cancelled') {
                res.status(400).json({
                    success: false,
                    error: 'Order is already cancelled',
                });
                return;
            }

            if (existingOrder.status === 'paid' || existingOrder.status === 'delivered') {
                res.status(400).json({
                    success: false,
                    error: `Cannot cancel order with status: ${existingOrder.status}`,
                });
                return;
            }

            // Обновляем статус заказа на cancelled
            const order = await OrderModel.updateStatus(id, { status: 'cancelled' });

            const response: ApiResponse<typeof order> = {
                success: true,
                data: order,
                message: 'Order cancelled successfully',
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/orders/:id - Удалить заказ
     * Также снимает бронь если заказ ещё активен
     */
    static async deleteOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };

            const existingOrder = await OrderModel.findById(id);
            if (!existingOrder) {
                res.status(404).json({
                    success: false,
                    error: 'Order not found',
                });
                return;
            }


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
