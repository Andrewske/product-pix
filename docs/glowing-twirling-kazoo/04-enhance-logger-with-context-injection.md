# Enhance Logger with Automatic Context Injection

## Files to Modify/Create
- `src/lib/logging/index.ts` (modify)
- `src/lib/logging/__tests__/index.test.ts` (modify - update tests)

## Implementation Details

### Logger Enhancement

Update existing logger in `src/lib/logging/index.ts` to auto-inject context from AsyncLocalStorage:

```typescript
import { getRequestContext } from '@/lib/request/context';

const createEnrichedEntry = (
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>
): LogEntry => {
  const reqContext = getRequestContext();

  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    requestId: reqContext?.requestId,
    userId: reqContext?.userId,
    route: reqContext?.route,
    ...context,
  };
};

export const logger = {
  error: (message: string, context?: Record<string, unknown>) => {
    const entry = createEnrichedEntry('error', message, context);
    process.stderr.write(`${JSON.stringify(entry)}\n`);
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    const entry = createEnrichedEntry('warn', message, context);
    process.stdout.write(`${JSON.stringify(entry)}\n`);
  },
  info: (message: string, context?: Record<string, unknown>) => {
    const entry = createEnrichedEntry('info', message, context);
    process.stdout.write(`${JSON.stringify(entry)}\n`);
  },
  debug: (message: string, context?: Record<string, unknown>) => {
    const entry = createEnrichedEntry('debug', message, context);
    process.stdout.write(`${JSON.stringify(entry)}\n`);
  },
};
```

### Test Updates

Update existing tests to verify context injection:
- Test that requestId is auto-added when available
- Test that userId is auto-added when set
- Test that route is auto-added when available
- Test that manual context merges with auto-context

Keep existing JSON format and level filtering tests.

## Acceptance Criteria
- [ ] Logger auto-injects requestId from AsyncLocalStorage
- [ ] Logger auto-injects userId when available
- [ ] Logger auto-injects route when available
- [ ] Manual context merges with auto-context
- [ ] Existing JSON format preserved
- [ ] Existing level filtering preserved
- [ ] Tests updated and passing

## Dependencies
- Task 03 (request context implemented)
