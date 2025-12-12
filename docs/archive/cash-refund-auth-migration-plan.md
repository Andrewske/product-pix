# Cash Refund Auth Migration: next-auth → Supabase

## Overview

Refactor the 2 cash refund API routes from `next-auth` to Supabase auth using the `withAuth` middleware pattern. This aligns them with the existing image refund routes and removes the phantom dependency on `next-auth` (which isn't installed).

**Scope:** 2 route files + 2 test files, zero functional changes (auth mechanism only)

## Architecture Decisions

### Decision 1: Use `withAuth` Middleware Pattern
**Rationale:**
- Already used by image refund routes (`/src/app/api/refunds/image/route.ts`)
- Centralizes auth logic in `/src/lib/auth/api-middleware.ts`
- Provides type-safe `request.user` from Supabase
- Eliminates manual session checks in every route

### Decision 2: Enhance Test Mocks for `withAuth`
**Rationale:**
- Current mocks for `withAuth` exist but don't inject user object
- Tests need `request.user.id` to verify business logic
- Enhanced mock maintains test coverage while removing next-auth dependency

### Decision 3: Minimal Refactoring Scope
**Rationale:**
- Only change auth mechanism, not business logic
- Preserve exact same error handling (401 status codes)
- No additional improvements or refactoring beyond auth swap

## Implementation Tasks

### Phase 1: Route File Refactoring

#### Task 1.1: Refactor Cash Refund Request Route
- [ ] Update `/src/app/api/refunds/cash/route.ts` to use Supabase auth
  - **Files:** `/src/app/api/refunds/cash/route.ts` (modify - 116 lines)
  - **Changes:**
    - Line 2: Remove `NextRequest` from `next/server` import
    - Line 3: Delete `import { getServerSession } from 'next-auth';`
    - Line 3 (new): Add `import { withAuth } from '@/lib/auth/server';`
    - Line 7: Change `export async function POST(request: NextRequest) {` to `export const POST = withAuth(async (request) => {`
    - Lines 8-13: Delete session retrieval and auth check block
    - Line 25: Change `session.user.id` to `request.user.id`
    - Line 116: Change `}` to `});` (close withAuth wrapper)
  - **Tests:** Verify with existing tests (will be updated in Task 2.1)
  - **Acceptance:**
    - No TypeScript errors
    - Function exports `POST` as `withAuth`-wrapped handler
    - `request.user.id` used instead of `session.user.id`
    - No imports from `next-auth` remain

#### Task 1.2: Refactor Cash Refund Eligibility Route
- [ ] Update `/src/app/api/refunds/cash/eligibility/route.ts` to use Supabase auth
  - **Files:** `/src/app/api/refunds/cash/eligibility/route.ts` (modify - 26 lines)
  - **Changes:**
    - Line 1: Remove `NextRequest` from `next/server` import
    - Line 2: Delete `import { getServerSession } from 'next-auth';`
    - Line 2 (new): Add `import { withAuth } from '@/lib/auth/server';`
    - Line 6: Change `export async function GET(request: NextRequest) {` to `export const GET = withAuth(async (request) => {`
    - Lines 8-12: Delete session retrieval and auth check block
    - Line 14: Change `session.user.id` to `request.user.id`
    - Line 26: Change `}` to `});` (close withAuth wrapper)
  - **Tests:** Verify with existing tests (will be updated in Task 2.2)
  - **Acceptance:**
    - No TypeScript errors
    - Function exports `GET` as `withAuth`-wrapped handler
    - `request.user.id` used instead of `session.user.id`
    - No imports from `next-auth` remain

### Phase 2: Test File Updates

#### Task 2.1: Update Cash Refund Request Tests
- [ ] Update `/src/app/api/refunds/cash/__tests__/route.test.ts` to mock Supabase auth
  - **Files:** `/src/app/api/refunds/cash/__tests__/route.test.ts` (modify)
  - **Changes:**
    - Lines 3-6: Replace basic `withAuth` mock with enhanced version:
      ```typescript
      const mockWithAuth = mock((handler: unknown) => {
        return async (request: Request) => {
          const authenticatedRequest = Object.assign(request, {
            user: { id: 'user-123' }
          });
          return handler(authenticatedRequest);
        };
      });
      mock.module('@/lib/auth/api-middleware', () => ({
        withAuth: mockWithAuth,
      }));
      ```
    - Lines 9-12: Delete `next-auth` mock module entirely
  - **Tests:** Run `bun test src/app/api/refunds/cash/__tests__/route.test.ts`
  - **Acceptance:**
    - All tests pass
    - No next-auth mocks remain
    - `withAuth` mock injects `user` object with id `'user-123'`
    - Tests verify handler receives authenticated request

#### Task 2.2: Update Cash Refund Eligibility Tests
- [ ] Update `/src/app/api/refunds/cash/__tests__/eligibility.test.ts` to mock Supabase auth
  - **Files:** `/src/app/api/refunds/cash/__tests__/eligibility.test.ts` (modify)
  - **Changes:**
    - Lines 3-6: Replace basic `withAuth` mock with enhanced version (same as Task 2.1)
    - Lines 9-12: Delete `next-auth` mock module entirely
  - **Tests:** Run `bun test src/app/api/refunds/cash/__tests__/eligibility.test.ts`
  - **Acceptance:**
    - All tests pass
    - No next-auth mocks remain
    - Test assertion `expect(mockGetEligibleCashRefunds).toHaveBeenCalledWith('user-123')` passes
    - `withAuth` mock provides user context to handler

### Phase 3: Verification

#### Task 3.1: Run Full Test Suite
- [ ] Run all refund-related tests
  - **Command:** `bun test src/app/api/refunds/cash`
  - **Acceptance:** All tests pass with no errors

#### Task 3.2: TypeScript Type Checking
- [ ] Verify no TypeScript errors in refactored files
  - **Command:** `bun run tsc --noEmit`
  - **Acceptance:** Zero TypeScript errors, all types resolve correctly

#### Task 3.3: Verify No next-auth References Remain
- [ ] Search codebase for any remaining next-auth imports
  - **Command:** `grep -r "next-auth" src/`
  - **Acceptance:** Zero matches in `src/` directory

## Code Reference Patterns

### Before Pattern (next-auth)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    // ... rest of handler
  } catch (error) {
    // error handling
  }
}
```

### After Pattern (Supabase withAuth)
```typescript
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/server';

export const POST = withAuth(async (request) => {
  try {
    const userId = request.user.id;
    // ... rest of handler (unchanged)
  } catch (error) {
    // error handling (unchanged)
  }
});
```

### Test Mock Pattern (Enhanced)
```typescript
const mockWithAuth = mock((handler: unknown) => {
  return async (request: Request) => {
    const authenticatedRequest = Object.assign(request, {
      user: { id: 'user-123' }
    });
    return handler(authenticatedRequest);
  };
});

mock.module('@/lib/auth/api-middleware', () => ({
  withAuth: mockWithAuth,
}));
```

## Files to Create/Modify

### Files to Modify (4 total)

**Route files:**
1. `/src/app/api/refunds/cash/route.ts` - Cash refund request handler (116 lines)
2. `/src/app/api/refunds/cash/eligibility/route.ts` - Eligibility check handler (26 lines)

**Test files:**
3. `/src/app/api/refunds/cash/__tests__/route.test.ts` - Cash refund tests
4. `/src/app/api/refunds/cash/__tests__/eligibility.test.ts` - Eligibility tests

### Reference Files (Do Not Modify)

**Auth middleware:**
- `/src/lib/auth/api-middleware.ts` - Contains `withAuth` implementation
- `/src/lib/auth/server.ts` - Re-exports `withAuth` from api-middleware

**Reference patterns:**
- `/src/app/api/refunds/image/route.ts` - Correct `withAuth` usage example
- `/src/app/api/refunds/image/__tests__/route.test.ts` - Correct test mock example

## Dependencies

### Internal Dependencies
- `@/lib/auth/server` - Provides `withAuth` middleware
- `@/lib/auth/api-middleware` - Core auth middleware implementation
- `@/lib/supabase/server` - Supabase client creation (used by withAuth)

### External Dependencies
- `@supabase/supabase-js` - Provides `User` type for `request.user`
- No new dependencies required (removing next-auth reference)

### Task Dependencies
- Task 1.1 and 1.2 can run in parallel (independent routes)
- Task 2.1 depends on Task 1.1 (tests need refactored route)
- Task 2.2 depends on Task 1.2 (tests need refactored route)
- Task 3.x depends on all Phase 1 and 2 tasks completing

## Acceptance Criteria

### Functional Requirements
- [ ] Both cash refund routes use `withAuth` middleware
- [ ] User authentication via Supabase (not next-auth)
- [ ] Same 401 unauthorized responses for unauthenticated requests
- [ ] Same business logic behavior (Stripe refunds, DB operations)
- [ ] `request.user.id` properly typed as `string`

### Code Quality
- [ ] All tests pass (`bun test src/app/api/refunds/cash`)
- [ ] No TypeScript errors (`bun run tsc --noEmit`)
- [ ] Test coverage maintained (no reduction)
- [ ] No `next-auth` imports remain in codebase
- [ ] Consistent pattern with image refund routes

### Type Safety
- [ ] `request` parameter typed as `AuthenticatedRequest`
- [ ] `request.user` typed as Supabase `User`
- [ ] No `any` types introduced
- [ ] Proper inference from `withAuth` wrapper

## Edge Cases & Error Handling

### Auth Failures
- **Scenario:** User not authenticated
- **Behavior:** `withAuth` middleware returns 401 before handler executes
- **Test:** Existing tests assume auth success; no changes needed

### Session Errors
- **Scenario:** Supabase auth service unavailable
- **Behavior:** `withAuth` catches error, returns 401 with "Authentication failed"
- **Test:** Not tested (same as image refund routes)

### Type Mismatches
- **Scenario:** `request.user` undefined
- **Behavior:** Cannot occur - `withAuth` guarantees user exists or returns 401
- **Test:** TypeScript enforces non-null `request.user`

## Rollback Plan

If issues occur during deployment:

1. **Immediate rollback:** Revert commits for all 4 files
2. **Partial rollback:** Routes can be reverted independently (1.1 vs 1.2)
3. **Test failures:** Check mock implementation matches enhanced pattern
4. **Type errors:** Verify `withAuth` import path is `@/lib/auth/server` (not `@/lib/auth/api-middleware`)

## Notes

- **No database changes** - Auth mechanism only
- **No API contract changes** - Same request/response formats
- **No new environment variables** - Supabase already configured
- **No dependency installation** - Only removing phantom dependency reference
- **Zero downtime** - Routes remain functional throughout refactor
