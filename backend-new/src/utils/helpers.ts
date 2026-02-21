/**
 * Вспомогательные функции
 */

/**
 * Форматирование ошибки
 */
export function formatError(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

/**
 * Проверка валидности ID
 */
export function isValidId(id: unknown): boolean {
    const num = Number(id);
    return !isNaN(num) && num > 0;
}

/**
 * Пагинация
 */
export interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
}

export function getPaginationParams(page?: string, limit?: string): PaginationParams {
    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '10', 10)));

    return {
        page: pageNum,
        limit: limitNum,
        skip: (pageNum - 1) * limitNum,
    };
}
