import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import type { CreateProductDTO, UpdateProductDTO, IProduct } from '../types/index.js';

export class ProductModel {
    /**
     * Получить все продукты
     */
    static async findAll(): Promise<IProduct[]> {
        return prisma.product.findMany({
            include: { category: true },
        });
    }

    /**
     * Получить продукт по ID
     */
    static async findById(id: string): Promise<IProduct | null> {
        return prisma.product.findUnique({
            where: { id },
            include: { category: true },
        });
    }

    /**
     * Получить продукты по категории ID
     */
    static async findByCategory(categoryId: string): Promise<IProduct[]> {
        return prisma.product.findMany({
            where: { categoryId },
            include: { category: true },
        });
    }

    /**
     * Получить товары со скидкой (discount > 0)
     */
    static async findOnSale(): Promise<IProduct[]> {
        return prisma.product.findMany({
            where: {
                discount: { gt: 0 },
            },
            include: { category: true },
        });
    }

    /**
     * Создать новый продукт
     */
    static async create(data: CreateProductDTO): Promise<IProduct> {
        const { categoryId, sizes, composition, ...rest } = data;
        return prisma.product.create({
            data: {
                ...rest,
                sizes: sizes as Prisma.InputJsonValue,
                composition: composition as Prisma.InputJsonValue,
                category: { connect: { id: categoryId } },
            },
            include: { category: true },
        });
    }

    /**
     * Обновить продукт
     */
    static async update(id: string, data: UpdateProductDTO): Promise<IProduct> {
        const { categoryId, sizes, composition, ...rest } = data;
        return prisma.product.update({
            where: { id },
            data: {
                ...rest,
                ...(sizes !== undefined ? { sizes: sizes as Prisma.InputJsonValue } : {}),
                ...(composition !== undefined ? { composition: composition as Prisma.InputJsonValue } : {}),
                ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
            },
            include: { category: true },
        });
    }

    /**
     * Удалить продукт
     */
    static async delete(id: string): Promise<IProduct> {
        return prisma.product.delete({
            where: { id },
            include: { category: true },
        });
    }

    /**
     * Поиск продуктов по названию
     */
    static async search(query: string): Promise<IProduct[]> {
        return prisma.product.findMany({
            where: {
                name: {
                    contains: query,
                },
            },
            include: { category: true },
        });
    }
}
