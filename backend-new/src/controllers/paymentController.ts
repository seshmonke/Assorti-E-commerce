import type { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/paymentService.js';
import { OrderModel } from '../models/orderModel.js';
import { ProductModel } from '../models/productModel.js';
import type { ApiResponse } from '../types/index.js';

export class PaymentController {
    /**
     * POST /api/payments/create
     * Создаёт платёж в ЮKassa для указанного заказа.
     * Возвращает confirmationUrl — URL для генерации QR-кода.
     */
    static async createPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { orderId } = req.body as { orderId: string };

            if (!orderId) {
                res.status(400).json({ success: false, error: 'orderId is required' });
                return;
            }

            const order = await OrderModel.findById(orderId);
            if (!order) {
                res.status(404).json({ success: false, error: 'Order not found' });
                return;
            }

            if (order.status !== 'pending_payment') {
                res.status(400).json({
                    success: false,
                    error: `Order already has status: ${order.status}`,
                });
                return;
            }

            if (order.paymentMethod !== 'card') {
                res.status(400).json({
                    success: false,
                    error: 'Payment via QR is only available for card payment method',
                });
                return;
            }

            const productName = order.product?.name ?? 'Товар';
            const description = `Оплата заказа #${order.id.slice(0, 8)} — ${productName}`;

            const result = await paymentService.createPayment(
                order.id,
                order.totalPrice * 100,
                description,
            );

            // Сохраняем paymentId и confirmationUrl в заказе
            await OrderModel.updateStatus(order.id, {
                status: 'pending_payment',
                paymentId: result.paymentId,
                confirmationUrl: result.confirmationUrl,
            });

            const response: ApiResponse<typeof result> = {
                success: true,
                data: result,
                message: 'Payment created successfully',
            };
            res.json(response);
        } catch (error: any) {
            console.error('[PaymentController] createPayment error:', {
                message: error?.message,
                yooStatus: error?.response?.status,
                yooData: error?.response?.data,
            });

            const yooStatus = error?.response?.status;
            const yooData = error?.response?.data;

            if (error?.message?.includes('YOOKASSA_SHOP_ID')) {
                res.status(500).json({ success: false, error: error.message });
                return;
            }
            if (yooStatus === 401) {
                res.status(401).json({
                    success: false,
                    error: 'YooKassa authentication failed: invalid credentials',
                });
                return;
            }
            if (yooStatus === 400) {
                res.status(400).json({
                    success: false,
                    error: `YooKassa bad request: ${JSON.stringify(yooData)}`,
                });
                return;
            }
            if (yooStatus) {
                res.status(502).json({
                    success: false,
                    error: `YooKassa error ${yooStatus}: ${JSON.stringify(yooData)}`,
                });
                return;
            }

            next(error);
        }
    }

    /**
     * GET /api/payments/check/:orderId
     * Проверяет статус платежа по orderId.
     * Если оплачен — обновляет заказ и удаляет товар.
     */
    static async checkPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { orderId } = req.params as { orderId: string };

            const order = await OrderModel.findById(orderId);
            if (!order) {
                res.status(404).json({ success: false, error: 'Order not found' });
                return;
            }

            if (!order.paymentId) {
                res.status(400).json({
                    success: false,
                    error: 'No payment associated with this order',
                });
                return;
            }

            const payment = await paymentService.getPayment(order.paymentId);

            let message = 'Payment status checked';

            if (payment.status === 'succeeded' && order.status !== 'paid') {
                // Обновляем статус заказа
                await OrderModel.updateStatus(order.id, {
                    status: 'paid',
                    paymentId: payment.id,
                });

                // Удаляем товар из БД
                try {
                    await ProductModel.delete(order.productId);
                } catch {
                    // Товар мог быть уже удалён
                }

                message = 'Payment confirmed — order marked as paid';
            }

            const response: ApiResponse<{ paymentStatus: string; orderStatus: string }> = {
                success: true,
                data: {
                    paymentStatus: payment.status,
                    orderStatus: payment.status === 'succeeded' ? 'paid' : order.status,
                },
                message,
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/payments/webhook
     * Вебхук от ЮKassa — обработка уведомлений о статусе платежа
     */
    static async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const event = req.body as {
                type: string;
                event: string;
                object: {
                    id: string;
                    status: string;
                    paid: boolean;
                    metadata?: { orderId?: string };
                    amount: { value: string; currency: string };
                };
            };

            console.log('YooKassa webhook received:', JSON.stringify(event, null, 2));

            if (event.event === 'payment.succeeded') {
                const paymentId = event.object.id;
                const orderId = event.object.metadata?.orderId;

                const order = orderId
                    ? await OrderModel.findById(orderId)
                    : await OrderModel.findByPaymentId(paymentId);

                if (order && order.status !== 'paid') {
                    await OrderModel.updateStatus(order.id, { status: 'paid', paymentId });

                    // Удаляем товар из БД
                    try {
                        await ProductModel.delete(order.productId);
                    } catch {
                        // Товар мог быть уже удалён
                    }

                    console.log(`Order ${order.id} marked as paid (payment: ${paymentId})`);
                }
            }

            if (event.event === 'payment.canceled') {
                const paymentId = event.object.id;
                const order = await OrderModel.findByPaymentId(paymentId);
                if (order) {
                    console.log(`Payment canceled for order ${order.id}`);
                }
            }

            res.status(200).json({ success: true });
        } catch (error) {
            next(error);
        }
    }
}
