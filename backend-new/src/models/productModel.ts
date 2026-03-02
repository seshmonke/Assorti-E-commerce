import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import type { CreateProductDTO, UpdateProductDTO, IProduct } from '../types/index.js';

export class ProductModel {
    /**
     * Получить все активные продукты (не архивированные)
     */
    static async findAll(): Promise<IProduct[]> {
        return prisma.product.findMany({
            where: { archive: false },
            include: { category: true },
        }) as unknown as IProduct[];
    }

    /**
     * Получить все продукты (включая архивированные)
     */
    static async findAllIncludingArchived(): Promise<IProduct[]> {
        return prisma.product.findMany({
            include: { category: true },
        }) as unknown as IProduct[];
    }

    /**
     * Получить все архивированные продукты
     */
    static async findAllArchived(): Promise<IProduct[]> {
        return prisma.product.findMany({
            where: { archive: true },
            include: { category: true },
        }) as unknown as IProduct[];
    }

    /**
     * Получить активный продукт по ID
     */
    static async findById(id: string): Promise<IProduct | null> {
        return prisma.product.findUnique({
            where: { id },
            include: { category: true },
        }) as unknown as IProduct | null;
    }

    /**
     * Получить продукт по ID (включая архивированные)
     */
    static async findByIdIncludingArchived(id: string): Promise<IProduct | null> {
        return prisma.product.findUnique({
            where: { id },
            include: { category: true },
        }) as unknown as IProduct | null;
    }

    /**
     * Получить активные продукты по категории ID
     */
    static async findByCategory(categoryId: string): Promise<IProduct[]> {
        return prisma.product.findMany({
            where: { categoryId, archive: false },
            include: { category: true },
        }) as unknown as IProduct[];
    }

    /**
     * Получить активные товары со скидкой (discount > 0)
     */
    static async findOnSale(): Promise<IProduct[]> {
        return prisma.product.findMany({
            where: {
                discount: { gt: 0 },
                archive: false,
            },
            include: { category: true },
        }) as unknown as IProduct[];
    }

    /**
     * Создать новый продукт
     */
    static async create(data: CreateProductDTO): Promise<IProduct> {
        const { categoryId, sizes, composition, images, archive, ...rest } = data;
        return prisma.product.create({
            data: {
                ...rest,
                images: (images ?? []) as Prisma.InputJsonValue,
                sizes: sizes as Prisma.InputJsonValue,
                composition: composition as Prisma.InputJsonValue,
                archive: archive ?? false,
                category: { connect: { id: categoryId } },
            },
            include: { category: true },
        }) as unknown as IProduct;
    }

    /**
     * Обновить продукт
     */
    static async update(id: string, data: UpdateProductDTO): Promise<IProduct> {
        const { categoryId, sizes, composition, images, ...rest } = data;
        return prisma.product.update({
            where: { id },
            data: {
                ...rest,
                ...(images !== undefined ? { images: images as Prisma.InputJsonValue } : {}),
                ...(sizes !== undefined ? { sizes: sizes as Prisma.InputJsonValue } : {}),
                ...(composition !== undefined ? { composition: composition as Prisma.InputJsonValue } : {}),
                ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
            },
            include: { category: true },
        }) as unknown as IProduct;
    }

    /**
     * Архивировать продукт
     */
    static async archive(id: string): Promise<IProduct> {
        return prisma.product.update({
            where: { id },
            data: { archive: true },
            include: { category: true },
        }) as unknown as IProduct;
    }

    /**
     * Разархивировать продукт
     */
    static async unarchive(id: string): Promise<IProduct> {
        return prisma.product.update({
            where: { id },
            data: { archive: false },
            include: { category: true },
        }) as unknown as IProduct;
    }

    /**
     * Удалить продукт
     */
    static async delete(id: string): Promise<IProduct> {
        return prisma.product.delete({
            where: { id },
            include: { category: true },
        }) as unknown as IProduct;
    }

    /**
     * Поиск активных продуктов по названию
     */
    static async search(query: string): Promise<IProduct[]> {
        return prisma.product.findMany({
            where: {
                name: {
                    contains: query,
                },
                archive: false,
            },
            include: { category: true },
        }) as unknown as IProduct[];
    }

}
