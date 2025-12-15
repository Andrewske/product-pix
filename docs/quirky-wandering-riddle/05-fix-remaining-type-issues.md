# Fix Remaining Type Issues

## Files to Modify
- `src/lib/request/context.ts` (modify)
- `src/app/api/images/[id]/feedback/__tests__/route.test.ts` (modify)
- `src/components/auth/__tests__/signup-form.integration.test.tsx` (modify)
- `src/lib/auth/__tests__/hooks.test.ts` (modify)
- `src/lib/analytics/config.ts` (modify)
- `src/components/analytics/posthog-provider.tsx` (modify)
- `src/lib/db/jobs.ts` (modify)
- `src/lib/errors/__tests__/error-classes.test.ts` (modify)

## Implementation Details

This task addresses miscellaneous type errors not covered by previous tasks.

### 5.1: AsyncLocalStorage Type Argument Error

**File:** `src/lib/request/context.ts`

**Problem:** Line 17 attempts to pass type argument to dynamically required class:
```typescript
_requestContext = new AsyncLocalStorage<RequestContext>();  // ❌ ERROR
```

**Solution:** Remove type parameter from runtime instantiation (type is already on variable):

**Replace lines 8-17:**
```typescript
// OLD
let _requestContext: any | null = null;

function getAsyncLocalStorage(): any | null {
  if (typeof window !== 'undefined') {
    return null;
  }
  if (!_requestContext) {
    const { AsyncLocalStorage } = require('node:async_hooks');
    _requestContext = new AsyncLocalStorage<RequestContext>();  // ❌
  }
  return _requestContext;
}
```

**With:**
```typescript
// NEW
let _requestContext: any | null = null;

function getAsyncLocalStorage(): any | null {
  if (typeof window !== 'undefined') {
    return null;
  }
  if (!_requestContext) {
    const { AsyncLocalStorage } = require('node:async_hooks');
    _requestContext = new AsyncLocalStorage();  // ✅ No type arg
  }
  return _requestContext;
}
```

**Fixes:** 1 error (TS2347: Untyped function calls may not accept type arguments)

---

### 5.2: Test Mock Type Mismatches

**Problem:** Mock return values don't match expected TypeScript types.

#### File 1: `src/app/api/images/[id]/feedback/__tests__/route.test.ts`

**Issues:**
- Line 216: Passing `null` where object expected
- Line 246: Type mismatch in mock response

**Strategy:** Update mock return values to match the exact structure expected by the route handler.

#### File 2: `src/components/auth/__tests__/signup-form.integration.test.tsx`

**Issues:**
- Lines 135, 271: Missing `data` property in mock response
- Line 236: Type mismatch with `access_token`

**Example Fix Pattern:**
```typescript
// OLD
mockSignUp.mockResolvedValue({
  session: null,
  user: {}
});

// NEW
mockSignUp.mockResolvedValue({
  data: {
    session: null,
    user: {}
  },
  error: null
});
```

#### File 3: `src/lib/auth/__tests__/hooks.test.ts`

**Issues:**
- Lines 67, 115, 164, 229: Assigning `User | null` to `null`

**Fix:** Update mock types to properly handle nullable User type.

**Fixes:** ~11 test type errors

---

### 5.3: Other Production Code Issues

#### File 1: `src/lib/analytics/config.ts`

**Issue:** Remove deprecated `recordCrossOriginIframes` property

**Action:** Delete or comment out the deprecated property reference.

#### File 2: `src/components/analytics/posthog-provider.tsx`

**Issue:** Fix `loaded` callback signature mismatch

**Action:** Update callback type to match PostHog's expected signature.

#### File 3: `src/lib/db/jobs.ts`

**Issue:** Handle `null` vs `undefined` for string union type

**Action:** Add proper null check or use nullish coalescing operator.

#### File 4: `src/lib/errors/__tests__/error-classes.test.ts`

**Issue:** Missing `amount` property in test object

**Action:** Add required `amount` property to test data.

#### File 5: Database Enum Types

**Issue:** Missing enum definitions in database schema

**Action:** Either:
- Add enum types to database types file, OR
- Create local type unions as temporary solution

**Affected files:**
- `src/components/admin/timeline-filters.tsx` (line 9)
- `src/lib/db/critical-errors.ts` (lines 11, 12, 51, 52)

**Investigation needed:**
```bash
# Check if enum exists in database
npx supabase db pull
# OR check migrations for critical_errors table
```

**Fixes:** 5 production code errors

---

## Acceptance Criteria

1. **Full TypeScript Check:**
   ```bash
   bunx tsc --noEmit
   # Expected: "Found 0 errors"
   ```

2. **All Tests Pass:**
   ```bash
   bun test
   # Expected: All tests pass
   ```

3. **No Remaining Type Errors:**
   - No `as any` casts added
   - No `@ts-ignore` or `@ts-expect-error` comments
   - All types properly inferred or explicitly declared

## Dependencies

- Tasks 01-04 should be complete (especially Task 04 for test infrastructure)
- Can be done incrementally (each sub-section is independent)

## Impact

**Fixes:** Remaining ~16 TypeScript errors across production and test code.

## Notes

- Database enum issue may require database migration or type generation
- Test each sub-section independently before moving to next
- Some issues may require reading surrounding code for context
