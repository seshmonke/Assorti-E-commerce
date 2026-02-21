import prisma from '../config/database.js';
export class ProductModel {
    /**
     * Получить все продукты
     */
    static async findAll() {
        return prisma.product.findMany();
    }
    /**
     * Получить продукт по ID
     */
    static async findById(id) {
        return prisma.product.findUnique({
            where: { id },
        });
    }
    /**
     * Получить продукты по категории
     */
    static async findByCategory(category) {
        return prisma.product.findMany({
            where: { category: category },
        });
    }
    /**
     * Создать новый продукт
     */
    static async create(data) {
        return prisma.product.create({
            data,
        });
    }
    /**
     * Обновить продукт
     */
    static async update(id, data) {
        return prisma.product.update({
            where: { id },
            data,
        });
    }
    /**
     * Удалить продукт
     */
    static async delete(id) {
        return prisma.product.delete({
            where: { id },
        });
    }
    /**
     * Поиск продуктов по названию
     */
    static async search(query) {
        return prisma.product.findMany({
            where: {
                name: {
                    contains: query,
                    mode: 'insensitive',
                },
            },
        });
    }
}
//# sourceMappingURL=productModel.js.map