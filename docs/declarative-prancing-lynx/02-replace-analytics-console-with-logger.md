# Replace Analytics Console.warn with Logger

## Priority
**HIGH** - Code quality and convention compliance

## Files to Modify
- `src/lib/analytics/client.ts` (modify lines 56, 67, 70, 94, 97, 114, 117)

## Implementation Details

**Issue:** Using `console.warn` violates project convention "No scattered console logs - use centralized logging"

**Changes Required:**

### 1. Add logger import (after line 2)
```typescript
import { logger } from '@/lib/logging';
```

### 2. Replace all 7 console.warn calls

**Line 56:**
```typescript
// Before
console.warn('Invalid analytics event:', event);
// After
logger.warn('Invalid analytics event', { event });
```

**Line 67:**
```typescript
// Before
console.warn('Failed to track analytics event:', error);
// After
logger.warn('Failed to track analytics event', { error });
```

**Line 70:**
```typescript
// Before
console.warn('Failed to track analytics event:', error);
// After
logger.warn('Failed to track analytics event', { error });
```

**Line 94:**
```typescript
// Before
console.warn('Failed to identify user:', error);
// After
logger.warn('Failed to identify user', { error });
```

**Line 97:**
```typescript
// Before
console.warn('Failed to identify user:', error);
// After
logger.warn('Failed to identify user', { error });
```

**Line 114:**
```typescript
// Before
console.warn('Failed to reset user:', error);
// After
logger.warn('Failed to reset user', { error });
```

**Line 117:**
```typescript
// Before
console.warn('Failed to reset user:', error);
// After
logger.warn('Failed to reset user', { error });
```

**Reasoning:**
- Logger provides centralized, structured logging with consistent formatting
- Works identically in browser (uses console.warn under the hood)
- Allows future enhancements (log levels, filtering, remote logging)
- Follows project conventions

## Acceptance Criteria
- [ ] Logger import added at top of file
- [ ] All 7 console.warn calls replaced with logger.warn
- [ ] Test: Trigger analytics warning in browser → verify logger.warn output in console
- [ ] `bun run lint` passes (no console usage warnings)

## Dependencies
- Requires Fix #1 (browser error logging) to be complete for consistent logger behavior
