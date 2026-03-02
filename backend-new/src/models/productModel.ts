import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import type { CreateProductDTO, UpdateProductDTO, IProduct } from '../types/index.js';

/**
 * Безопасный парсинг JSON-поля. Если значение уже объект/массив — возвращает как есть.
 * Если строка — парсит. Если пустая строка или null — возвращает fallback.
 */
function safeParseJson<T>(value: unknown, fallback: T): T {
    if (value === null || value === undefined || value === '') return fallback;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value) as T;
        } catch {
            return fallback;
        }
    }
    return value as T;
}

/**
 * Нормализует JSON-поля продукта (images, sizes, composition)
 */
function normalizeProductJson(product: IProduct): IProduct {
    return {
        ...product,
        images: safeParseJson<string[]>(product.images as unknown, []),
        sizes: safeParseJson<unknown[]>(product.sizes as unknown, []),
        composition: safeParseJson<unknown>(product.composition as unknown, {}),
    };
}

export class ProductModel {
    /**
     * Получить все активные продукты (не архивированные)
     */
    static async findAll(): Promise<IProduct[]> {
        const products = await prisma.product.findMany({
            where: { archive: false },
            include: { category: true },
        }) as unknown as IProduct[];
        return products.map(normalizeProductJson);
    }

    /**
     * Получить все продукты (включая архивированные)
     */
    static async findAllIncludingArchived(): Promise<IProduct[]> {
        const products = await prisma.product.findMany({
            include: { category: true },
        }) as unknown as IProduct[];
        return products.map(normalizeProductJson);
    }

    /**
     * Получить все архивированные продукты
     */
    static async findAllArchived(): Promise<IProduct[]> {
        const products = await prisma.product.findMany({
            where: { archive: true },
            include: { category: true },
        }) as unknown as IProduct[];
        return products.map(normalizeProductJson);
    }

    /**
     * Получить активный продукт по ID
     */
    static async findById(id: string): Promise<IProduct | null> {
        const product = await prisma.product.findUnique({
            where: { id },
            include: { category: true },
        }) as unknown as IProduct | null;
        return product ? normalizeProductJson(product) : null;
    }

    /**
     * Получить продукт по ID (включая архивированные)
     */
    static async findByIdIncludingArchived(id: string): Promise<IProduct | null> {
        const product = await prisma.product.findUnique({
            where: { id },
            include: { category: true },
        }) as unknown as IProduct | null;
        return product ? normalizeProductJson(product) : null;
    }

    /**
     * Получить активные продукты по категории ID
     */
    static async findByCategory(categoryId: string): Promise<IProduct[]> {
        const products = await prisma.product.findMany({
            where: { categoryId, archive: false },
            include: { category: true },
        }) as unknown as IProduct[];
        return products.map(normalizeProductJson);
    }

    /**
     * Получить активные товары со скидкой (discount > 0)
     */
    static async findOnSale(): Promise<IProduct[]> {
        const products = await prisma.product.findMany({
            where: {
                discount: { gt: 0 },
                archive: false,
            },
            include: { category: true },
        }) as unknown as IProduct[];
        return products.map(normalizeProductJson);
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
        const products = await prisma.product.findMany({
            where: {
                name: {
                    contains: query,
                },
                archive: false,
            },
            include: { category: true },
        }) as unknown as IProduct[];
        return products.map(normalizeProductJson);
    }

}
