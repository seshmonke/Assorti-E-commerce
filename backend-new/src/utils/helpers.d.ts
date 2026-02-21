/**
 * Вспомогательные функции
 */
/**
 * Форматирование ошибки
 */
export declare function formatError(error: unknown): string;
/**
 * Проверка валидности ID
 */
export declare function isValidId(id: unknown): boolean;
/**
 * Пагинация
 */
export interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
}
export declare function getPaginationParams(page?: string, limit?: string): PaginationParams;
//# sourceMappingURL=helpers.d.ts.map