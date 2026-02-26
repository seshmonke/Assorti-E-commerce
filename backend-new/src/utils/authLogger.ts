import type { Request } from 'express';
import fs from 'fs';
import path from 'path';

// Типы событий авторизации
export enum AuthLogLevel {
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
}

export enum AuthEvent {
    SIGNIN_SUCCESS = 'SIGNIN_SUCCESS',
    SIGNIN_FAILED = 'SIGNIN_FAILED',
    TOKEN_REFRESHED = 'TOKEN_REFRESHED',
    REFRESH_FAILED = 'REFRESH_FAILED',
    LOGOUT = 'LOGOUT',
    AUTH_DENIED = 'AUTH_DENIED',
}

// Создаём папку logs если не существует
const logsDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const authLogFilePath = path.join(logsDir, 'auth.log');

/**
 * Пишет логи авторизации в файл
 */
function writeToFile(message: string): void {
    fs.appendFile(authLogFilePath, message + '\n', (err) => {
        if (err) {
            console.error('Failed to write to auth log file:', err);
        }
    });
}

/**
 * Получает IP адрес из request
 */
function getIP(req?: Request): string {
    if (!req) return 'unknown';
    return req.ip || req.socket?.remoteAddress || 'unknown';
}

/**
 * Логирует успешную авторизацию
 */
export function logSigninSuccess(
    telegramId: string,
    username: string | null,
    req?: Request,
): void {
    const timestamp = new Date().toISOString();
    const ip = getIP(req);
    const userInfo = username ? ` | User: ${username}` : '';

    const message = `[${timestamp}] ${AuthLogLevel.INFO}  ${AuthEvent.SIGNIN_SUCCESS}    | telegramId: ${telegramId} | IP: ${ip}${userInfo}`;

    console.log(message);
    writeToFile(message);
}

/**
 * Логирует ошибку при авторизации
 */
export function logSigninFailed(reason: string, req?: Request): void {
    const timestamp = new Date().toISOString();
    const ip = getIP(req);

    const message = `[${timestamp}] ${AuthLogLevel.WARN}  ${AuthEvent.SIGNIN_FAILED}     | IP: ${ip} | Reason: ${reason}`;

    console.warn(message);
    writeToFile(message);
}

/**
 * Логирует успешное обновление токена
 */
export function logTokenRefreshed(userId: string, req?: Request): void {
    const timestamp = new Date().toISOString();
    const ip = getIP(req);

    const message = `[${timestamp}] ${AuthLogLevel.INFO}  ${AuthEvent.TOKEN_REFRESHED}   | userId: ${userId} | IP: ${ip}`;

    console.log(message);
    writeToFile(message);
}

/**
 * Логирует ошибку при обновлении токена
 */
export function logRefreshFailed(reason: string, req?: Request): void {
    const timestamp = new Date().toISOString();
    const ip = getIP(req);

    const message = `[${timestamp}] ${AuthLogLevel.WARN}  ${AuthEvent.REFRESH_FAILED}    | IP: ${ip} | Reason: ${reason}`;

    console.warn(message);
    writeToFile(message);
}

/**
 * Логирует logout
 */
export function logLogout(userId: string, req?: Request): void {
    const timestamp = new Date().toISOString();
    const ip = getIP(req);

    const message = `[${timestamp}] ${AuthLogLevel.INFO}  ${AuthEvent.LOGOUT}            | userId: ${userId} | IP: ${ip}`;

    console.log(message);
    writeToFile(message);
}

/**
 * Логирует отказ в доступе (невалидный/отсутствующий токен)
 */
export function logAuthDenied(reason: string, path: string, method: string, req?: Request): void {
    const timestamp = new Date().toISOString();
    const ip = getIP(req);

    const message = `[${timestamp}] ${AuthLogLevel.WARN}  ${AuthEvent.AUTH_DENIED}      | IP: ${ip} | Path: ${method} ${path} | Reason: ${reason}`;

    console.warn(message);
    writeToFile(message);
}
