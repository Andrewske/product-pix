# Migrate console.error to Centralized Logging (Pattern A)

## Files to Modify
- `src/lib/db/credits.ts` (4 instances)
- `src/lib/db/cost-queries.ts` (4 instances)
- `src/lib/db/uploads.ts` (4 instances)
- `src/lib/db/generated-images.ts` (1 instance)
- `src/lib/db/users.ts` (1 instance)
- `src/lib/ai/gemini-batch.ts` (1 instance)
- `src/lib/auth/api-middleware.ts` (1 instance)
- `src/lib/auth/hooks.ts` (1 instance)

**Total:** 17 console.error calls in non-critical database/utility functions

## Implementation Details

**Rule violation:** `no-console` - only `console.warn()` and `console.info()` allowed in lib/API code

**Pattern A** is for non-critical errors where we need structured logs but not full observability (database → PostHog).

### Migration Pattern:

**BEFORE:**
```typescript
if (error) {
  console.error('Error adding credits:', error);
  throw new Error('Failed to add credits');
}
```

**AFTER:**
```typescript
import { logger } from '@/lib/logging';

if (error) {
  logger.error('Error adding credits', {
    error: error.message,
    code: error.code,
    userId: params.userId,
    amount: params.amount,
  });
  throw new Error('Failed to add credits');
}
```

### What You Get:

**Structured JSON output:**
```json
{
  "timestamp": "2025-01-15T10:30:45.123Z",
  "level": "error",
  "message": "Error adding credits",
  "requestId": "req_abc123",
  "userId": "user_xyz",
  "route": "/api/credits",
  "context": {
    "error": "insufficient_funds",
    "code": "CREDIT_ERROR",
    "userId": "user_xyz",
    "amount": 100
  }
}
```

**Benefits:**
- Automatic `requestId` correlation from middleware
- Structured context for log aggregation
- Writes to `stderr` for Vercel log capture
- Filterable by log level (via `LOG_LEVEL` env var)

## Implementation Steps

For each file:

1. **Add import at top:**
   ```typescript
   import { logger } from '@/lib/logging';
   ```

2. **Replace each console.error:**
   - Extract relevant context from surrounding code
   - Call `logger.error(message, context)`
   - Include error details, function parameters, relevant state

3. **Context guidelines:**
   - Always include `error.message` if available
   - Include function parameters that aid debugging
   - Include relevant IDs (userId, jobId, batchId, etc.)
   - Use snake_case or camelCase for context keys

## File-Specific Notes

### credits.ts (4 instances)
Include: `userId`, `amount`, `jobId`, `purchaseId` where applicable

### cost-queries.ts (4 instances)
Include: `userId`, `creditsCharged`, `modelVersion`, query parameters

### uploads.ts (4 instances)
Include: `userId`, `fileKey`, `uploadId`, file metadata

### Other files (1-2 instances each)
Follow same pattern: extract contextual data from function scope

## Acceptance Criteria
- [ ] All 17 console.error calls replaced with logger.error
- [ ] All files import logger from '@/lib/logging'
- [ ] Context objects include relevant debugging information
- [ ] No console.error violations: `bun run lint`
- [ ] All tests pass: `bun test`
- [ ] Log output is valid JSON when checked manually

## Dependencies
- Requires `src/lib/logging/index.ts` (already exists)
- No changes to logging infrastructure needed

## Estimated Time
60 minutes (17 instances × 3-4 min each)
