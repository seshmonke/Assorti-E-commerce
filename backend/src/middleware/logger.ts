import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

// Создаём папку logs если не существует
const logsDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const logFilePath = path.join(logsDir, 'app.log');

function writeToFile(message: string): void {
    fs.appendFile(logFilePath, message + '\n', (err) => {
        if (err) {
            console.error('Failed to write to log file:', err);
        }
    });
}

function formatLog(req: Request, res: Response, duration: number): string {
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const query = Object.keys(req.query).length ? JSON.stringify(req.query) : '{}';
    const body = req.method !== 'GET' && req.body && Object.keys(req.body).length
        ? JSON.stringify(req.body)
        : null;

    const bodyPart = body ? ` | Body: ${body}` : '';

    return `[${timestamp}] INFO: ${req.method} ${req.path} | IP: ${ip} | Query: ${query}${bodyPart} → ${res.statusCode} (${duration}ms)`;
}

/**
 * Middleware для логирования запросов
 */
export function logger(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const message = formatLog(req, res, duration);

        console.log(message);
        writeToFile(message);
    });

    next();
}
