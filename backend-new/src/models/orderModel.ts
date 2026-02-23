import { prisma } from '../lib/prisma.js';
import type { CreateOrderDTO, UpdateOrderStatusDTO, IOrder, OrderStatus } from '../types/index.js';

export class OrderModel {
    /**
     * Получить ��се заказы
     */
    static async findAll(): Promise<IOrder[]> {
        return prisma.order.findMany({
            include: { product: { include: { category: true } } },
            orderBy: { createdAt: 'desc' },
        }) as unknown as IOrder[];
    }

    /**
     * Получить заказ по ID
     */
    static async findById(id: string): Promise<IOrder | null> {
        return prisma.order.findUnique({
            where: { id },
            include: { product: { include: { category: true } } },
        }) as unknown as IOrder | null;
    }

    /**
     * Получить заказы по статусу
     */
    static async findByStatus(status: OrderStatus): Promise<IOrder[]> {
        return prisma.order.findMany({
            where: { status },
            include: { product: { include: { category: true } } },
            orderBy: { createdAt: 'desc' },
        }) as unknown as IOrder[];
    }

    /**
     * Получить заказы по Telegram User ID
     */
    static async findByTelegramUserId(telegramUserId: string): Promise<IOrder[]> {
        return prisma.order.findMany({
            where: { telegramUserId },
            include: { product: { include: { category: true } } },
            orderBy: { createdAt: 'desc' },
        }) as unknown as IOrder[];
    }

    /**
     * Создать новый заказ
     */
    static async create(data: CreateOrderDTO): Promise<IOrder> {
        return prisma.order.create({
            data: {
                productId: data.productId,
                quantity: data.quantity ?? 1,
                totalPrice: data.totalPrice,
                telegramUserId: data.telegramUserId ?? null,
                status: 'pending_payment',
            },
            include: { product: { include: { category: true } } },
        }) as unknown as IOrder;
    }

    /**
     * Обновить статус заказа
     */
    static async updateStatus(id: string, data: UpdateOrderStatusDTO): Promise<IOrder> {
        return prisma.order.update({
            where: { id },
            data: {
                status: data.status,
                ...(data.paymentId !== undefined ? { paymentId: data.paymentId } : {}),
                ...(data.confirmationUrl !== undefined ? { confirmationUrl: data.confirmationUrl } : {}),
            },
            include: { product: { include: { category: true } } },
        }) as unknown as IOrder;
    }

    /**
     * Найти заказ по paymentId (ЮKassa payment ID)
     */
    static async findByPaymentId(paymentId: string): Promise<IOrder | null> {
        return prisma.order.findFirst({
            where: { paymentId },
            include: { product: { include: { category: true } } },
        }) as unknown as IOrder | null;
    }

    /**
     * Удалить заказ
     */
    static async delete(id: string): Promise<IOrder> {
        return prisma.order.delete({
            where: { id },
            include: { product: { include: { category: true } } },
        }) as unknown as IOrder;
    }
}
