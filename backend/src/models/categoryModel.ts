import { prisma } from '../lib/prisma.js';
import type { ICategory, CreateCategoryDTO, UpdateCategoryDTO } from '../types/index.js';

export class CategoryModel {
    /**
     * Получить все категории
     */
    static async findAll(): Promise<ICategory[]> {
        return prisma.category.findMany({
            orderBy: { order: 'asc' },
        });
    }

    /**
     * Получить максимальный order в разделе
     */
    static async getMaxOrder(section: string): Promise<number> {
        const result = await prisma.category.aggregate({
            where: { section },
            _max: { order: true },
        });
        return result._max.order ?? 0;
    }

    /**
     * Перенумеровать все категории в разделе (1, 2, 3, ...)
     */
    static async renumberSection(section: string): Promise<void> {
        const categories = await prisma.category.findMany({
            where: { section },
            orderBy: { order: 'asc' },
            select: { id: true },
        });
        await Promise.all(
            categories.map((cat, idx) =>
                prisma.category.update({
                    where: { id: cat.id },
                    data: { order: idx + 1 },
                }),
            ),
        );
    }

    /**
     * Получить категорию по ID
     */
    static async findById(id: string): Promise<ICategory | null> {
        return prisma.category.findUnique({
            where: { id },
        });
    }

    /**
     * Создать категорию
     */
    static async create(data: CreateCategoryDTO): Promise<ICategory> {
        return prisma.category.create({
            data: {
                name: data.name,
                section: data.section,
                order: data.order,
            },
        });
    }

    /**
     * Обновить категорию
     */
    static async update(id: string, data: UpdateCategoryDTO): Promise<ICategory> {
        return prisma.category.update({
            where: { id },
            data,
        });
    }

    /**
     * Удалить категорию
     */
    static async delete(id: string): Promise<ICategory> {
        return prisma.category.delete({
            where: { id },
        });
    }
}
