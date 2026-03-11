import { prisma } from '../lib/prisma.js';
import type { IBrowserUser, CreateBrowserUserDTO } from '../types/index.js';

export class BrowserUserModel {
    /**
     * Найти browserUser по ID
     */
    static async findById(id: string): Promise<IBrowserUser | null> {
        return prisma.browserUser.findUnique({
            where: { id },
        }) as unknown as IBrowserUser | null;
    }

    /**
     * Найти browserUser по telegramId
     */
    static async findByTelegramId(telegramId: string): Promise<IBrowserUser | null> {
        return prisma.browserUser.findFirst({
            where: { telegramId },
        }) as unknown as IBrowserUser | null;
    }

    /**
     * Найти browserUser по телефону
     */
    static async findByPhone(phone: string): Promise<IBrowserUser | null> {
        return prisma.browserUser.findFirst({
            where: { phone },
        }) as unknown as IBrowserUser | null;
    }

    /**
     * Найти или создать browserUser.
     * Логика: если есть telegramId — ищем по telegramId, иначе по phone.
     * Если нашли — обновляем данные. Если нет — создаём.
     */
    static async findOrCreate(data: CreateBrowserUserDTO): Promise<IBrowserUser> {
        let existing: IBrowserUser | null = null;

        // Сначала ищем по telegramId (если передан)
        if (data.telegramId) {
            existing = await BrowserUserModel.findByTelegramId(data.telegramId);
        }

        // Если не нашли по telegramId — ищем по phone
        if (!existing) {
            existing = await BrowserUserModel.findByPhone(data.phone);
        }

        if (existing) {
            // Обновляем данные
            return prisma.browserUser.update({
                where: { id: existing.id },
                data: {
                    name: data.name,
                    phone: data.phone,
                    email: data.email ?? null,
                    telegram: data.telegram ?? null,
                    ...(data.telegramId ? { telegramId: data.telegramId } : {}),
                },
            }) as unknown as IBrowserUser;
        }

        // Создаём нового
        return prisma.browserUser.create({
            data: {
                telegramId: data.telegramId ?? null,
                name: data.name,
                phone: data.phone,
                email: data.email ?? null,
                telegram: data.telegram ?? null,
            },
        }) as unknown as IBrowserUser;
    }

    /**
     * Создать нового browserUser
     */
    static async create(data: CreateBrowserUserDTO): Promise<IBrowserUser> {
        return prisma.browserUser.create({
            data: {
                telegramId: data.telegramId ?? null,
                name: data.name,
                phone: data.phone,
                email: data.email ?? null,
                telegram: data.telegram ?? null,
            },
        }) as unknown as IBrowserUser;
    }
}
