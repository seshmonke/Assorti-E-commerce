import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import type { CreateArchiveDTO, IArchive } from '../types/index.js';

export class ArchiveModel {
    /**
     * Получить все архивные товары
     */
    static async findAll(): Promise<IArchive[]> {
        return prisma.archive.findMany({
            include: { category: true },
            orderBy: { createdAt: 'desc' },
        }) as unknown as IArchive[];
    }

    /**
     * Получить архивный товар по ID
     */
    static async findById(id: string): Promise<IArchive | null> {
        return prisma.archive.findUnique({
            where: { id },
            include: { category: true },
        }) as unknown as IArchive | null;
    }

    /**
     * Создать запись в архиме
     */
    static async create(data: CreateArchiveDTO): Promise<IArchive> {
        const { sizes, composition, ...rest } = data;
        return prisma.archive.create({
            data: {
                ...rest,
                sizes: sizes as Prisma.InputJsonValue,
                composition: composition as Prisma.InputJsonValue,
            },
            include: { category: true },
        }) as unknown as IArchive;
    }

    /**
     * Удалить запись из архива
     */
    static async delete(id: string): Promise<IArchive> {
        return prisma.archive.delete({
            where: { id },
            include: { category: true },
        }) as unknown as IArchive;
    }
}
