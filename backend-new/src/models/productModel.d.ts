import type { CreateProductDTO, UpdateProductDTO, IProduct } from '../types/index.js';
export declare class ProductModel {
    /**
     * Получить все продукты
     */
    static findAll(): Promise<IProduct[]>;
    /**
     * Получить продукт по ID
     */
    static findById(id: number): Promise<IProduct | null>;
    /**
     * Получить продукты по категории
     */
    static findByCategory(category: string): Promise<IProduct[]>;
    /**
     * Создать новый продукт
     */
    static create(data: CreateProductDTO): Promise<IProduct>;
    /**
     * Обновить продукт
     */
    static update(id: number, data: UpdateProductDTO): Promise<IProduct>;
    /**
     * Удалить продукт
     */
    static delete(id: number): Promise<IProduct>;
    /**
     * Поиск продуктов по названию
     */
    static search(query: string): Promise<IProduct[]>;
}
//# sourceMappingURL=productModel.d.ts.map