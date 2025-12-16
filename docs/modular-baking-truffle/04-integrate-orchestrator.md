# Integrate Logger into Orchestrator

## Files to Modify/Create
- `prompt-bench/core/orchestrator.ts` (modify)

## Implementation Details

### Add Phase Transition Logging
Log each pipeline phase with timing information:

```typescript
import { logger } from '@bench/core/logger';

// Phase started
logger.info('Phase started', {
  batchLabel,
  phase: 'run',
  totalPhases: 3
});

// Phase completed
logger.info('Phase completed', {
  batchLabel,
  phase: 'run',
  duration: `${elapsed}s`,
  success: true,
  generated: '1/1'
});

// Phase failed
logger.error('Phase failed', {
  batchLabel,
  phase: 'evaluate',
  duration: `${elapsed}s`,
  error: error.message
});
```

### Add Step-Level Logging (Optional)
For detailed debugging, log individual steps within phases:

```typescript
logger.debug('Step started', {
  batchLabel,
  phase: 'run',
  step: 'compile_templates'
});

logger.debug('Step completed', {
  batchLabel,
  phase: 'run',
  step: 'compile_templates',
  duration: `${stepElapsed}s`
});
```

### Pass Batch Label Through Callbacks
Ensure batch label is available throughout orchestrator execution by passing it through progress callbacks or closure context.

## Acceptance Criteria
- [ ] Phase start/complete/fail events logged
- [ ] Timing information included for each phase
- [ ] Batch label passed through execution context
- [ ] Step-level logging added (if desired for deep debugging)
- [ ] Success/failure counts included in phase completion logs

## Dependencies
- Task 01 (logger infrastructure must exist)
