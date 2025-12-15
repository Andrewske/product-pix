# Integration Verification Checkpoint

## Files to Modify/Create
- `src/lib/analytics/__tests__/integration.test.ts` (new)

## Implementation Details

### Task 1.11: Integration Verification Checkpoint

**CRITICAL**: Do not proceed to Phase 2 until this passes.

Create `src/lib/analytics/__tests__/integration.test.ts` to verify end-to-end PostHog integration:

**Integration Tests:**
- PostHog initializes in browser (mock posthog-js)
- trackEvent captures with correct properties
- Server-side queue flushes to PostHog
- Event validation rejects invalid data

**Manual Verification Steps:**
1. Start dev server
2. Open browser console, verify PostHog object exists
3. Trigger test event, check PostHog debugger

**Example Test Structure:**
```typescript
import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { trackEvent } from '@/lib/analytics/client';
import { trackServerEvent } from '@/lib/analytics/server';

describe('PostHog Integration', () => {
  it('should track client-side events', () => {
    // Test client tracking
  });

  it('should queue server-side events', () => {
    // Test server queue
  });

  it('should validate event schemas', () => {
    // Test Zod validation
  });
});
```

## Acceptance Criteria
- All integration tests pass
- Manual browser verification succeeds
- PostHog object exists in console
- Test events appear in PostHog debugger
- Event validation works end-to-end

## Dependencies
- Task 04 (client/server utilities) must be complete
- All previous Phase 1 tasks must pass

## Next Steps
**STOP HERE** and verify integration before proceeding to Phase 2 (Core Integration Points).
