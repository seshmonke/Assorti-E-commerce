import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware для обработки ошибок
 */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
    console.error('Error:', err);

    res.status(500).json({
        success: false,
        error: err.message || 'Internal server error',
    });
}
