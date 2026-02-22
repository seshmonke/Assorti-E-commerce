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
     * Получить категорию по ID
     */
    static async findById(id: number): Promise<ICategory | null> {
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
    static async update(id: number, data: UpdateCategoryDTO): Promise<ICategory> {
        return prisma.category.update({
            where: { id },
            data,
        });
    }

    /**
     * Удалить категорию
     */
    static async delete(id: number): Promise<ICategory> {
        return prisma.category.delete({
            where: { id },
        });
    }
}
