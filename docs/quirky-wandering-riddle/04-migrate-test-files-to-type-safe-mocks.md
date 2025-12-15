# Migrate Test Files to Type-Safe Mocks

## Files to Modify
- `src/app/api/contact/__tests__/route.test.ts` (modify)
- `src/app/api/cron/analyze-sentiment/__tests__/route.test.ts` (modify)
- `src/lib/db/__tests__/purchase-ledger.test.ts` (modify)
- All other test files with Supabase mocks using `as any` (~10-15 files total)

## Implementation Details

**Problem:** Test files use `as any` to suppress type errors when mocking Supabase query chains.

**Solution:** Replace inline mock objects with type-safe helpers from `@/lib/test-utils`.

### Migration Pattern

**OLD Pattern (with `as any`):**
```typescript
mock.module('@/lib/supabase/admin', () => ({
  createAdminClient: mock(() => ({
    from: mock(() => ({
      select: mock(() => ({
        eq: mock(() => ({
          single: mock(() => Promise.resolve({
            data: null,
            error: null
          }))
        }))
      }))
    })) as any  // ❌ Type safety bypass
  }))
}));
```

**NEW Pattern (type-safe):**
```typescript
import { createSupabaseMock } from '@/lib/test-utils';

mock.module('@/lib/supabase/admin', () => ({
  createAdminClient: () => createSupabaseMock()  // ✅ Fully typed
}));
```

### Priority Files to Update

1. **src/app/api/contact/__tests__/route.test.ts**
   - Simple .from() chains
   - Good starting point for pattern validation

2. **src/app/api/cron/analyze-sentiment/__tests__/route.test.ts**
   - Complex conditional routing based on table name
   - Use `createSentimentAnalysisFromMock()` helper for queue-specific behavior

3. **src/lib/db/__tests__/purchase-ledger.test.ts**
   - Standard CRUD operations
   - Test .insert() and .update() chains

### Search Strategy

Find all files needing updates:
```bash
grep -r "as any" src/**/__tests__/**/*.test.ts
# Or more specifically:
grep -r "mock.*from.*as any" src/
```

### Customizing Mock Responses

When tests need specific return values:

```typescript
import { createSupabaseMock, createFromMock } from '@/lib/test-utils';

const mockSupabase = createSupabaseMock();

// Override specific responses
mockSupabase.from.mockReturnValue(
  createFromMock({
    data: [{ id: '123', name: 'Test' }],
    error: null
  })
);
```

## Acceptance Criteria

1. **No `as any` in Test Mocks:**
   ```bash
   grep -r "mock.*from.*as any" src/**/__tests__/
   # Expected: 0 matches
   ```

2. **TypeScript Check:**
   ```bash
   bunx tsc --noEmit 2>&1 | grep "__tests__"
   # Expected: 0 mock-related errors
   ```

3. **Tests Still Pass:**
   ```bash
   bun test
   # Expected: All tests pass with same coverage
   ```

4. **All Test Files Import Helper:**
   ```bash
   grep -l "from '@/lib/test-utils'" src/**/__tests__/**/*.test.ts
   # Expected: List of all files that were updated
   ```

## Dependencies

- **REQUIRED:** Task 03 (create test-utils helpers) must be complete
- Task 01 and 02 can be complete but not strictly required

## Impact

**Fixes:** ~40 TypeScript errors related to test mock types.

## Notes

- Each file may have multiple mock.module() calls - update all of them
- Some tests use mockReturnValueOnce() for scenario-specific responses - these should use the helper factories with custom responses
- Preserve existing test behavior - only change the mock structure, not the test assertions
