type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase();

    if (data) {
      return `[${timestamp}] ${levelUpper}: ${message}`;
    }

    return `[${timestamp}] ${levelUpper}: ${message}`;
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles: Record<LogLevel, string> = {
      info: 'color: #0066cc; font-weight: bold;',
      warn: 'color: #ff9900; font-weight: bold;',
      error: 'color: #cc0000; font-weight: bold;',
      debug: 'color: #666666; font-weight: normal;',
    };
    return styles[level];
  }

  private addToHistory(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  info(message: string, data?: unknown): void {
    const formatted = this.formatMessage('info', message, data);
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      data,
    };

    console.log(`%c${formatted}`, this.getConsoleStyle('info'), data || '');
    this.addToHistory(entry);
  }

  warn(message: string, data?: unknown): void {
    const formatted = this.formatMessage('warn', message, data);
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      data,
    };

    console.warn(`%c${formatted}`, this.getConsoleStyle('warn'), data || '');
    this.addToHistory(entry);
  }

  error(message: string, data?: unknown): void {
    const formatted = this.formatMessage('error', message, data);
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      data,
    };

    console.error(`%c${formatted}`, this.getConsoleStyle('error'), data || '');
    this.addToHistory(entry);
  }

  debug(message: string, data?: unknown): void {
    if (!this.isDevelopment) {
      return;
    }

    const formatted = this.formatMessage('debug', message, data);
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'debug',
      message,
      data,
    };

    console.debug(`%c${formatted}`, this.getConsoleStyle('debug'), data || '');
    this.addToHistory(entry);
  }

  /**
   * Получить историю логов
   */
  getHistory(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Очистить историю логов
   */
  clearHistory(): void {
    this.logs = [];
  }

  /**
   * Экспортировать логи в JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();
