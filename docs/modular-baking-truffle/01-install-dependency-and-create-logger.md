# Install Dependency and Create Logger Infrastructure

## Files to Modify/Create
- `package.json` (modify - add consola dependency)
- `prompt-bench/core/logger.ts` (create)

## Implementation Details

### Install Consola
```bash
bun add consola
```

### Create Logger Wrapper
Create `prompt-bench/core/logger.ts` with the following implementation:

```typescript
import { consola } from 'consola';
import { appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const LOG_DIR = join(import.meta.dir, '../logs');
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
```

## Acceptance Criteria
- [ ] Consola package installed successfully
- [ ] `prompt-bench/core/logger.ts` created with all methods
- [ ] Logger creates log directory automatically
- [ ] File write failures fall back to console.error
- [ ] Log level setter function exported

## Dependencies
None - this is the foundation task
