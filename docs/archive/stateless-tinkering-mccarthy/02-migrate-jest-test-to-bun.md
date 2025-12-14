# Migrate Jest Test to Bun

## Files to Modify
- `src/components/admin/__tests__/user-timeline.test.tsx` (complete rewrite of test framework)

## Implementation Details

**Rule violation:** `@typescript-eslint/no-require-imports` (3 errors)

Migrate test file from Jest to Bun test framework per CLAUDE.md requirements.

### Violations to Fix:
- Lines 7-11: `jest.mock()` → Bun's `mock.module()`
- Lines 13-15: `require()` imports → ES6 imports
- Line 203: `jest.spyOn()` → Bun's `spyOn()`
- Line 69: `jest.clearAllMocks()` → manual mock reset

### Migration Pattern:

**1. Replace jest.mock with Bun's mock.module:**
```typescript
// BEFORE
jest.mock('@/lib/admin-api/client');

// AFTER
import { mock } from 'bun:test';

mock.module('@/lib/admin-api/client', () => ({
  getUserTimeline: mock(() => Promise.resolve(mockTimelineResponse)),
  resolveError: mock(() => Promise.resolve(undefined)),
  unresolveError: mock(() => Promise.resolve(undefined)),
}));
```

**2. Replace require() with ES6 imports:**
```typescript
// BEFORE
const mockGetUserTimeline = require('@/lib/admin-api/client').getUserTimeline;
const mockResolveError = require('@/lib/admin-api/client').resolveError;
const mockUnresolveError = require('@/lib/admin-api/client').unresolveError;

// AFTER
import * as adminApiClient from '@/lib/admin-api/client';
const mockGetUserTimeline = adminApiClient.getUserTimeline as ReturnType<typeof mock>;
const mockResolveError = adminApiClient.resolveError as ReturnType<typeof mock>;
const mockUnresolveError = adminApiClient.unresolveError as ReturnType<typeof mock>;
```

**3. Replace jest.spyOn with Bun's spyOn:**
```typescript
// BEFORE
const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

// AFTER
import { spyOn } from 'bun:test';
const consoleSpy = spyOn(console, 'error').mockImplementation(() => {});
```

**4. Replace jest.clearAllMocks with manual reset:**
```typescript
// BEFORE
beforeEach(() => {
  jest.clearAllMocks();
});

// AFTER
beforeEach(() => {
  mockGetUserTimeline.mockReset();
  mockGetUserTimeline.mockResolvedValue(mockTimelineResponse);
  mockResolveError.mockReset();
  mockResolveError.mockResolvedValue(undefined);
  mockUnresolveError.mockReset();
  mockUnresolveError.mockResolvedValue(undefined);
});
```

## Acceptance Criteria
- [ ] No `jest.` API calls remain in the file
- [ ] No `require()` imports remain in the file
- [ ] All imports are ES6 style
- [ ] Bun test APIs used: `mock`, `mock.module`, `spyOn` from `bun:test`
- [ ] Test passes: `bun test src/components/admin/__tests__/user-timeline.test.tsx`
- [ ] Linting passes: `bun run lint`

## Dependencies
None - this is an isolated test file migration.

## Estimated Time
45 minutes
