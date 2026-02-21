import type { Request, Response, NextFunction } from 'express';

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId?: string;
                role?: string;
            };
        }
    }
}

/**
 * Middleware для проверки JWT токена
 * Ожидает токен в заголовке Authorization: Bearer <token>
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'Missing or invalid authorization header',
            });
            return;
        }

        const token = authHeader.substring(7);

        // Простая проверка токена (в реальном приложении используй jwt.verify)
        // Для демонстрации просто проверяем наличие токена
        if (!token) {
            res.status(401).json({
                success: false,
                error: 'Invalid token',
            });
            return;
        }

        // TODO: Добавить реальную проверку JWT токена
        // const decoded = jwt.verify(token, config.jwtSecret);
        // req.user = decoded;

        // Для демонстрации просто устанавливаем пользователя
        req.user = {
            userId: 'demo-user',
            role: 'admin',
        };

        next();
    } catch {
        res.status(401).json({
            success: false,
            error: 'Authentication failed',
        });
    }
}

/**
 * Middleware для проверки роли пользователя
 */
export function requireRole(role: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user || req.user.role !== role) {
            res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
            });
            return;
        }
        next();
    };
}
