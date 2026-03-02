import type { Request, Response, NextFunction } from 'express';
import { OrderModel } from '../models/orderModel.js';
import { ProductModel } from '../models/productModel.js';
import { prisma } from '../lib/prisma.js';
import type { CreateOrderDTO, UpdateOrderStatusDTO, ApiResponse, OrderStatus } from '../types/index.js';

export class OrderController {
    /**
     * GET /api/orders/my - Получить заказы текущего пользователя
     */
    static async getMyOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const telegramUserId = req.user?.telegramId;

            if (!telegramUserId) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated',
                });
                return;
            }

            const orders = await OrderModel.findByTelegramUserId(telegramUserId);

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
     * GET /api/orders/:id - Получить заказ по ID (без авторизации — для страницы заказа)
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
     * Принимает массив товаров (items), browserUserId, данные доставки.
     * Атомарно помечает все товары как архивные.
     * Не требует Telegram авторизации — browserUser уже зарегистрирован.
     */
    static async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data: CreateOrderDTO = req.body;

            if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required field: items (must be a non-empty array)',
                });
                return;
            }

            if (!data.totalPrice) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required field: totalPrice',
                });
                return;
            }

            // Проверяем существование всех товаров и собираем их данные
            const productIds = data.items.map((item) => item.productId);
            const products = await Promise.all(
                productIds.map((id) => ProductModel.findByIdIncludingArchived(id)),
            );

            for (let i = 0; i < products.length; i++) {
                const product = products[i];
                const productId = productIds[i];

                if (!product) {
                    res.status(404).json({
                        success: false,
                        error: `Product not found: ${productId}`,
                    });
                    return;
                }

                if (product.archive) {
                    res.status(400).json({
                        success: false,
                        error: `Cannot create order for archived product: ${product.name}`,
                    });
                    return;
                }
            }

            // Обогащаем items данными из Product (price и name на момент покупки)
            const enrichedItems = data.items.map((item, i) => {
                const product = products[i]!;
                const finalPrice = product.discount
                    ? Math.round(product.price * (1 - product.discount / 100))
                    : product.price;
                return {
                    productId: item.productId,
                    quantity: item.quantity ?? 1,
                    price: item.price ?? finalPrice,
                    name: item.name ?? product.name,
                };
            });

            // Атомарно: создаём заказ с items и помечаем все товары как архивные
            const order = await prisma.$transaction(async (tx) => {
                // Создаём заказ с вложенными OrderItem
                const newOrder = await tx.order.create({
                    data: {
                        totalPrice: data.totalPrice,
                        telegramUserId: data.telegramUserId ?? null,
                        paymentMethod: data.paymentMethod ?? 'card',
                        status: 'pending_payment',
                        userId: data.userId ?? null,
                        deliveryCity: data.deliveryCity ?? null,
                        deliveryPvzCode: data.deliveryPvzCode ?? null,
                        deliveryPvzAddress: data.deliveryPvzAddress ?? null,
                        deliveryPrice: data.deliveryPrice ?? null,
                        items: {
                            create: enrichedItems,
                        },
                    },
                    include: {
                        items: {
                            include: {
                                product: { include: { category: true } },
                            },
                        },
                        user: true,
                    },
                });

                // Помечаем все товары как архивные
                await tx.product.updateMany({
                    where: { id: { in: productIds } },
                    data: { archive: true },
                });

                return newOrder;
            });

            res.status(201).json({
                success: true,
                data: order,
                message: 'Order created successfully and products moved to archive',
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
     * POST /api/orders/:id/cancel - Отменить заказ
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
     * Атомарно удаляет заказ и разархивирует все его товары
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

            // Собираем productId всех товаров в заказе
            const productIds = existingOrder.items.map((item) => item.productId);

            // Атомарно: удаляем заказ и разархивируем все его товары
            const order = await prisma.$transaction(async (tx) => {
                const deletedOrder = await tx.order.delete({
                    where: { id },
                    include: {
                        items: {
                            include: {
                                product: { include: { category: true } },
                            },
                        },
                        user: true,
                    },
                });

                if (productIds.length > 0) {
                    await tx.product.updateMany({
                        where: { id: { in: productIds } },
                        data: { archive: false },
                    });
                }

                return deletedOrder;
            });

            const response: ApiResponse<typeof order> = {
                success: true,
                data: order,
                message: 'Order deleted successfully and products unarchived',
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }
}
