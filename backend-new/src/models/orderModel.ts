import { prisma } from '../lib/prisma.js';
import type { CreateOrderDTO, UpdateOrderStatusDTO, IOrder, OrderStatus } from '../types/index.js';

const orderInclude = {
    items: {
        include: {
            product: {
                include: { category: true },
            },
        },
    },
} as const;

export class OrderModel {
    /**
     * Получить все заказы
     */
    static async findAll(): Promise<IOrder[]> {
        return prisma.order.findMany({
            include: orderInclude,
            orderBy: { createdAt: 'desc' },
        }) as unknown as IOrder[];
    }

    /**
     * Получить заказ по ID
     */
    static async findById(id: string): Promise<IOrder | null> {
        return prisma.order.findUnique({
            where: { id },
            include: orderInclude,
        }) as unknown as IOrder | null;
    }

    /**
     * Получить заказы по статусу
     */
    static async findByStatus(status: OrderStatus): Promise<IOrder[]> {
        return prisma.order.findMany({
            where: { status },
            include: orderInclude,
            orderBy: { createdAt: 'desc' },
        }) as unknown as IOrder[];
    }

    /**
     * Получить заказы по Telegram User ID
     */
    static async findByTelegramUserId(telegramUserId: string): Promise<IOrder[]> {
        return prisma.order.findMany({
            where: { telegramUserId },
            include: orderInclude,
            orderBy: { createdAt: 'desc' },
        }) as unknown as IOrder[];
    }

    /**
     * Создать новый заказ с массивом товаров
     */
    static async create(data: CreateOrderDTO): Promise<IOrder> {
        return prisma.order.create({
            data: {
                totalPrice: data.totalPrice,
                telegramUserId: data.telegramUserId ?? null,
                paymentMethod: data.paymentMethod ?? 'card',
                status: 'pending_payment',
                items: {
                    create: data.items.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity ?? 1,
                        price: item.price,
                        name: item.name,
                    })),
                },
            },
            include: orderInclude,
        }) as unknown as IOrder;
    }

    /**
     * Обновить ста��ус заказа
     */
    static async updateStatus(id: string, data: UpdateOrderStatusDTO): Promise<IOrder> {
        return prisma.order.update({
            where: { id },
            data: {
                status: data.status,
                ...(data.paymentId !== undefined ? { paymentId: data.paymentId } : {}),
                ...(data.confirmationUrl !== undefined ? { confirmationUrl: data.confirmationUrl } : {}),
            },
            include: orderInclude,
        }) as unknown as IOrder;
    }

    /**
     * Найти заказ по paymentId (ЮKassa payment ID)
     */
    static async findByPaymentId(paymentId: string): Promise<IOrder | null> {
        return prisma.order.findFirst({
            where: { paymentId },
            include: orderInclude,
        }) as unknown as IOrder | null;
    }

    /**
     * Удалить заказ
     */
    static async delete(id: string): Promise<IOrder> {
        return prisma.order.delete({
            where: { id },
            include: orderInclude,
        }) as unknown as IOrder;
    }
}
