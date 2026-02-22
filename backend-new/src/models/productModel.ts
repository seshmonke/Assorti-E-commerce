import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import type { CreateProductDTO, UpdateProductDTO, IProduct } from '../types/index.js';

export class ProductModel {
    /**
     * Получить все продукты
     */
    static async findAll(): Promise<IProduct[]> {
        return prisma.product.findMany();
    }

    /**
     * Получить продукт по ID
     */
    static async findById(id: number): Promise<IProduct | null> {
        return prisma.product.findUnique({
            where: { id },
        });
    }

    /**
     * Получить продукты по категории
     */
    static async findByCategory(category: string): Promise<IProduct[]> {
        return prisma.product.findMany({
            where: { category: category as any },
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
        });
    }

    /**
     * Создать новый продукт
     */
    static async create(data: CreateProductDTO): Promise<IProduct> {
        return prisma.product.create({
            data: data as Prisma.ProductCreateInput,
        });
    }

    /**
     * Обновить продукт
     */
    static async update(id: number, data: UpdateProductDTO): Promise<IProduct> {
        return prisma.product.update({
            where: { id },
            data: data as Prisma.ProductUpdateInput,
        });
    }

    /**
     * Удалить продукт
     */
    static async delete(id: number): Promise<IProduct> {
        return prisma.product.delete({
            where: { id },
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
        });
    }
}
