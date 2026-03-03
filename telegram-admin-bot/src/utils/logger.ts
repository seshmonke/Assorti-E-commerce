import { env } from '../config/env';
import fs from 'fs';
import path from 'path';

// Создаём папку logs если не существует
const logsDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const logFilePath = path.join(logsDir, 'app.log');

type LogLevel = 'info' | 'error' | 'warn' | 'debug';

class Logger {
  private isDevelopment = env.NODE_ENV === 'development';

  private serializeData(data: any): any {
    if (data === null || data === undefined) return data;

    if (data instanceof Error) {
      return {
        message: data.message,
        name: data.name,
        stack: data.stack,
      };
    }

    if (typeof data === 'object') {
      const result: Record<string, any> = {};
      for (const key of Object.keys(data)) {
        const val = data[key];
        if (val instanceof Error) {
          result[key] = {
            message: val.message,
            name: val.name,
            stack: val.stack,
          };
        } else if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
          result[key] = this.serializeData(val);
        } else {
          result[key] = val;
        }
      }
      return result;
    }

    return data;
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase();

    if (data !== undefined) {
      const serialized = this.serializeData(data);
      return `[${timestamp}] ${levelUpper}: ${message} ${JSON.stringify(serialized)}`;
    }

    return `[${timestamp}] ${levelUpper}: ${message}`;
  }

  private writeToFile(message: string): void {
    fs.appendFile(logFilePath, message + '\n', (err) => {
      if (err) {
        console.error('Failed to write to log file:', err);
      }
    });
  }

  info(message: string, data?: any): void {
    const formatted = this.formatMessage('info', message, data);
    console.log(formatted);
    this.writeToFile(formatted);
  }

  error(message: string, data?: any): void {
    const formatted = this.formatMessage('error', message, data);
    console.error(formatted);
    this.writeToFile(formatted);
  }

  warn(message: string, data?: any): void {
    const formatted = this.formatMessage('warn', message, data);
    console.warn(formatted);
    this.writeToFile(formatted);
  }

  debug(message: string, data?: any): void {
    const formatted = this.formatMessage('debug', message, data);
    if (this.isDevelopment) {
      console.debug(formatted);
    }
    this.writeToFile(formatted);
  }
}

export const logger = new Logger();
