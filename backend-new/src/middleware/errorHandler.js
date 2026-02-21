/**
 * Middleware для обработки ошибок
 */
export function errorHandler(err, req, res, _next) {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: err.message || 'Internal server error',
    });
}
//# sourceMappingURL=errorHandler.js.map