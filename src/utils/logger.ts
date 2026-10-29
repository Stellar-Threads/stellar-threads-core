export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

// Structured logging with ISO timestamps and level metadata
export interface LogContext {
  [key: string]: unknown;
}

export const logger = {
  log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context ? { context } : {}),
    };
    if (level === 'error') {
      console.error(JSON.stringify(entry));
    } else if (level === 'warn') {
      console.warn(JSON.stringify(entry));
    } else {
      console.log(JSON.stringify(entry));
    }
  },

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  },

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  },

  error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context);
  },

  debug(message: string, context?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== 'production') {
      this.log('debug', message, context);
    }
  },
};
