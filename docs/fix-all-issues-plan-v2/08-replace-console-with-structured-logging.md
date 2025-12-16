# Replace Console Statements with Structured Logging

## Files to Modify
- src/lib/auth/hooks.ts (modify - line 80)
- src/lib/cookie-consent/storage.ts (modify - lines 12, 23, 32, 54)
- src/lib/cookie-consent/sync.ts (modify - line 30)
- src/lib/logging/index.ts (review - lines 72, 81)
- src/lib/toast/index.ts (modify - line 27)

## Files NOT to Modify (Client-side, keep for dev)
- src/lib/observability/capture-error-client.ts (lines 24, 41) - client-side debugging

## Implementation Details

Replace server-side console statements with calls to existing structured logger (`src/lib/logging/index.ts`). Keep client-side console.error for development debugging.

**Pattern:**
```typescript
// Before (server-side)
console.error('Something failed', error);

// After (server-side)
import { logger } from '@/lib/logging';
logger.error('Something failed', { error });
```

**Files with console errors (from docs/current-lint-errors.md):**

1. **src/lib/auth/hooks.ts:80** - Replace with logger.error
2. **src/lib/cookie-consent/storage.ts** - Replace 4 instances (lines 12, 23, 32, 54)
3. **src/lib/cookie-consent/sync.ts:30** - Replace with logger.error
4. **src/lib/toast/index.ts:27** - Replace with logger.error
5. **src/lib/logging/index.ts** (lines 72, 81) - REVIEW ONLY
   - These are IN the logger itself, may be intentional fallbacks when logger fails
   - Do NOT change these without confirming they're not bootstrap/fallback handlers

**Special Review Required:**
- Examine src/lib/logging/index.ts lines 72 and 81 carefully
- If these are fallback handlers for when the logger itself fails, keep them
- If they're regular error logging, replace with logger.error

## Acceptance Criteria

- [ ] All server-side console.error replaced with logger.error
- [ ] Client-side console.error preserved (capture-error-client.ts)
- [ ] Logger fallback handlers preserved (if applicable in logging/index.ts)
- [ ] All imports for logger added where needed
- [ ] `bun run lint | grep "no-console"` shows zero server-side violations

## Dependencies

None - Uses existing logger at src/lib/logging/index.ts

## Risk

Low - Aligns with existing logging standards

## Testing

```bash
bun run lint | grep "no-console"
# Expected: Zero server-side console violations
# Client-side violations acceptable (observability/capture-error-client.ts)

# Verify logger is imported in all modified files
grep -l "from '@/lib/logging'" src/lib/auth/hooks.ts src/lib/cookie-consent/storage.ts src/lib/cookie-consent/sync.ts src/lib/toast/index.ts
```
