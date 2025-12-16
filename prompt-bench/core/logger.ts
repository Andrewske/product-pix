import { consola } from 'consola';
import { appendFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const LOG_DIR = join(__dirname, '../logs');
const getLogFile = () => {
  const date = new Date().toISOString().split('T')[0];
  return join(LOG_DIR, `prompt-bench-${date}.log`);
};

// Ensure log directory exists
try {
  mkdirSync(LOG_DIR, { recursive: true });
} catch {
  // Directory already exists or can't create - fail silently
}

type LogContext = {
  batchLabel?: string;
  phase?: string;
  [key: string]: unknown;
};

function appendToFile(level: string, message: string, context?: LogContext): void {
  try {
    const timestamp = new Date().toISOString();
    const ctx = context ? ` ${JSON.stringify(context)}` : '';
    const batchLabel = context?.batchLabel ? `[${context.batchLabel}]` : '';
    const line = `[${timestamp}] ${level.toUpperCase()} ${batchLabel} ${message}${ctx}\n`;
    appendFileSync(getLogFile(), line);
  } catch (err) {
    // Fallback to console if file write fails
    console.error('[Logger] File write failed:', err);
  }
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    consola.debug(message, context);
    appendToFile('debug', message, context);
  },

  info(message: string, context?: LogContext): void {
    consola.info(message, context);
    appendToFile('info', message, context);
  },

  warn(message: string, context?: LogContext): void {
    consola.warn(message, context);
    appendToFile('warn', message, context);
  },

  error(message: string, context?: LogContext): void {
    consola.error(message, context);
    appendToFile('error', message, context);
  },

  success(message: string, context?: LogContext): void {
    consola.success(message, context);
    appendToFile('info', message, context);
  },
};

// Export log level setter for CLI flags
export function setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
  consola.level = level === 'debug' ? 4 : level === 'info' ? 3 : level === 'warn' ? 2 : 1;
}