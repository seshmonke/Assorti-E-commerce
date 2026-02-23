import type { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/paymentService.js';
import { OrderModel } from '../models/orderModel.js';
import type { ApiResponse } from '../types/index.js';

export class PaymentController {
    /**
     * POST /api/payments/create
     * Создаёт платёж в ЮKassa для указанного заказа
     */
    static async createPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { orderId } = req.body as { orderId: string };

            if (!orderId) {
                res.status(400).json({
                    success: false,
                    error: 'orderId is required',
                });
                return;
            }

            const order = await OrderModel.findById(orderId);
            if (!order) {
                res.status(404).json({
                    success: false,
                    error: 'Order not found',
                });
                return;
            }

            if (order.status !== 'pending_payment') {
                res.status(400).json({
                    success: false,
                    error: `Order already has status: ${order.status}`,
                });
                return;
            }

            const productName = order.product?.name ?? 'Товар';
            const description = `Оплата заказа #${order.id.slice(0, 8)} — ${productName}`;

            // Сумма в копейках (totalPrice уже в рублях * 100 или в рублях — смотри логику)
            // У нас totalPrice хранится в рублях (целое число), ЮKassa ожидает рубли
            // Поэтому умножаем на 100 для конвертации в копейки внутри сервиса
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
            // Логируем полную ошибку для диагностики
            console.error('[PaymentController] createPayment error:', {
                message: error?.message,
                yooStatus: error?.response?.status,
                yooData: error?.response?.data,
                stack: error?.stack,
            });

            const yooStatus = error?.response?.status;
            const yooData = error?.response?.data;

            // Ошибка конфигурации — env-переменные не заданы
            if (error?.message?.includes('YOOKASSA_SHOP_ID')) {
                res.status(500).json({
                    success: false,
                    error: error.message,
                });
                return;
            }

            // 401 = невалидные ключи ЮKassa
            if (yooStatus === 401) {
                res.status(401).json({
                    success: false,
                    error: 'YooKassa authentication failed: invalid YOOKASSA_SHOP_ID or YOOKASSA_SECRET_KEY. Check backend-new/.env',
                });
                return;
            }

            // 400 = некорректный запрос к ЮKassa
            if (yooStatus === 400) {
                res.status(400).json({
                    success: false,
                    error: `YooKassa bad request: ${JSON.stringify(yooData)}`,
                });
                return;
            }

            // Любая другая ошибка от ЮKassa
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

                if (orderId) {
                    await OrderModel.updateStatus(orderId, {
                        status: 'paid',
                        paymentId,
                    });
                    console.log(`Order ${orderId} marked as paid (payment: ${paymentId})`);
                } else {
                    // Ищем заказ по paymentId
                    const order = await OrderModel.findByPaymentId(paymentId);
                    if (order) {
                        await OrderModel.updateStatus(order.id, {
                            status: 'paid',
                            paymentId,
                        });
                        console.log(`Order ${order.id} marked as paid (payment: ${paymentId})`);
                    }
                }
            }

            if (event.event === 'payment.canceled') {
                const paymentId = event.object.id;
                const order = await OrderModel.findByPaymentId(paymentId);
                if (order) {
                    console.log(`Payment canceled for order ${order.id}`);
                    // Статус остаётся pending_payment — покупатель может попробовать снова
                }
            }

            res.status(200).json({ success: true });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/payments/:paymentId - Получить статус платежа
     */
    static async getPaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { paymentId } = req.params as { paymentId: string };
            const payment = await paymentService.getPayment(paymentId);

            const response: ApiResponse<typeof payment> = {
                success: true,
                data: payment,
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }
}
