# Integrate Logger into CLI Commands

## Files to Modify/Create
- `prompt-bench/commands/test.ts` (modify)
- `prompt-bench/commands/run.ts` (modify)
- `prompt-bench/cli.ts` (modify - optional log-level flag)

## Implementation Details

### Replace Console Statements
Replace all `console.log/warn/error` calls with appropriate logger methods:
- `console.log` → `logger.info`
- `console.warn` → `logger.warn`
- `console.error` → `logger.error`

### Pass Batch Label Context
Include batch label in all log calls for traceability:

```typescript
import { logger } from '@bench/core/logger';

// Example from commands/test.ts
logger.info('Pipeline started', {
  batchLabel,
  template: templateSlug
});

logger.success('Pipeline completed', {
  batchLabel,
  duration: `${totalTime}s`,
  success: true
});

logger.error('Pipeline failed', {
  batchLabel,
  error: error.message
});
```

### Add CLI Flag Support (Optional)
In `cli.ts` or individual command files, add `--log-level` flag handling:

```typescript
import { setLogLevel } from '@bench/core/logger';

// Parse args and set log level if provided
if (args['log-level']) {
  setLogLevel(args['log-level'] as 'debug' | 'info' | 'warn' | 'error');
}
```

## Acceptance Criteria
- [ ] All console.log calls replaced in test.ts
- [ ] All console.log calls replaced in run.ts
- [ ] Batch labels included in log context
- [ ] Log level flag support added (if desired)
- [ ] Logs appear in both console and file

## Dependencies
- Task 01 (logger infrastructure must exist)
