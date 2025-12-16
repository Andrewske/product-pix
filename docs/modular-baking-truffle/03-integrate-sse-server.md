# Integrate Logger into SSE Server

## Files to Modify/Create
- `prompt-bench/ui/server.ts` (modify)

## Implementation Details

### Add Connection Lifecycle Logging
Log all SSE connection events with batch label context:

```typescript
import { logger } from '@bench/core/logger';

// Connection established
logger.debug('SSE connection established', {
  batchLabel,
  connectionDuration: '0s'
});

// Heartbeat (optional - consider if needed to reduce noise)
logger.debug('SSE heartbeat sent', {
  batchLabel,
  interval: '30s'
});

// Connection closed
logger.info('SSE connection closed', {
  batchLabel,
  duration: `${totalDuration}s`,
  reason: 'complete'
});
```

### Add Error Logging with Context
Include detailed context for SSE errors:

```typescript
logger.error('SSE JSON parse error', {
  batchLabel,
  rawMessage: data,
  phase: 'evaluate',
  position: '3/5',
  error: parseError.message
});

logger.error('SSE connection error', {
  batchLabel,
  connectionDuration: `${elapsed}s`,
  error: error.message
});
```

### Log SSE Stream Events
Log progress events sent through SSE:

```typescript
logger.debug('SSE event sent', {
  batchLabel,
  event: eventType,
  phase: data.phase,
  progress: `${data.current}/${data.total}`
});
```

## Acceptance Criteria
- [ ] Connection lifecycle events logged
- [ ] Error events include full context (raw message, phase, position)
- [ ] Batch label extracted from client request and included in logs
- [ ] SSE stream events logged at debug level
- [ ] Heartbeat logging decision made (keep or skip)

## Dependencies
- Task 01 (logger infrastructure must exist)
