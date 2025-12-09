import { z } from 'zod';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LOG_LEVEL_SCHEMA = z.enum(['debug', 'info', 'warn', 'error']);

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

export interface Logger {
  debug: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, context?: Record<string, unknown>) => void;
}

const getCurrentLogLevel = (): LogLevel => {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase();
  const parsed = LOG_LEVEL_SCHEMA.safeParse(envLevel);
  return parsed.success ? parsed.data : 'info';
};

const shouldLog = (level: LogLevel, currentLevel: LogLevel): boolean =>
  LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];

const createLogEntry = (
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>
): LogEntry => ({
  timestamp: new Date().toISOString(),
  level,
  message,
  ...(context && { context }),
});

const writeLog = (entry: LogEntry): void => {
  const output = JSON.stringify(entry);
  if (entry.level === 'error') {
    process.stderr.write(`${output}\n`);
  } else {
    process.stdout.write(`${output}\n`);
  }
};

export const createLogger = (): Logger => {
  const currentLevel = getCurrentLogLevel();

  const log = (level: LogLevel) => (message: string, context?: Record<string, unknown>) => {
    if (shouldLog(level, currentLevel)) {
      const entry = createLogEntry(level, message, context);
      writeLog(entry);
    }
  };

  return {
    debug: log('debug'),
    info: log('info'),
    warn: log('warn'),
    error: log('error'),
  };
};

export const logger = createLogger();