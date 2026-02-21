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
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware для проверки роли пользователя
 */
export declare function requireRole(role: string): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map