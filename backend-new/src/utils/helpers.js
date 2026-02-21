/**
 * Вспомогательные функции
 */
/**
 * Форматирование ошибки
 */
export function formatError(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
/**
 * Проверка валидности ID
 */
export function isValidId(id) {
    const num = Number(id);
    return !isNaN(num) && num > 0;
}
export function getPaginationParams(page, limit) {
    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '10', 10)));
    return {
        page: pageNum,
        limit: limitNum,
        skip: (pageNum - 1) * limitNum,
    };
}
//# sourceMappingURL=helpers.js.map