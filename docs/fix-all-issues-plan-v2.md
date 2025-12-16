## Fix All Issues Plan (v2)

### Overview
This plan addresses critical issues preventing deployment: TypeScript compilation errors (22), build failures, linting violations (26 errors, 29 warnings), and missing database functionality. The approach fixes issues in dependency order with explicit verification checkpoints to minimize cascading failures while maintaining code quality and architectural integrity.

**Key Changes from v1:**
- Explicit verification commands after each phase
- Database migrations applied locally before type fixes
- Analytics refactor completed and verified before TypeScript phase
- Concrete file:line mappings from actual error output
- Contingency planning for newly discovered errors

---

## Verification Protocol

Execute these commands after each phase to validate progress:

```bash
# TypeScript compilation
bun run typecheck
# Expected: "Found 0 errors"

# Linting
bun run lint
# Expected: Zero errors (warnings acceptable)

# Build
bun run build
# Expected: Successful .next output, no compilation failures

# Type generation (after migrations)
npx supabase gen types typescript --local > src/lib/supabase/database.types.ts
# Expected: New types include schema changes
```

---

## Phase 0: Pre-Flight Verification

### 0.1 Review Existing Uncommitted Migrations
**Status:** Pending
**Priority:** CRITICAL
**Description:** Analyze and apply 5 existing migration files to understand current schema state before planning new migrations.

**Files to review:**
- `supabase/migrations/20251215000003_add_user_activity_rls.sql`
- `supabase/migrations/20251215000004_add_user_activity_composite_index.sql`
- `supabase/migrations/20251215000005_add_last_active_trigger.sql`
- `supabase/migrations/20251215000006_create_unified_timeline_view.sql`
- `supabase/migrations/20251215000007_create_get_filtered_user_list_rpc.sql`

**Actions:**
1. Read each migration file to understand schema changes
2. Apply migrations locally: `npx supabase db push`
3. Regenerate types: `npx supabase gen types typescript --local > src/lib/supabase/database.types.ts`
4. Run verification: `bun run typecheck`
5. Document which Phase 1A schema gaps remain after these migrations

**Risk:** Medium - May reveal that some Phase 1A work is already done
**Testing:** Verify types generated include `user_activity` table and related changes

### 0.2 Audit Analytics Import Sites
**Status:** Pending
**Priority:** HIGH
**Description:** Identify all files importing from analytics to prepare for refactor in Phase 1.

**Actions:**
```bash
grep -r "from '@/lib/analytics'" src/ > analytics-imports.txt
grep -r "PostHogProvider" src/ > posthog-usage.txt
```

**Expected:** List of files requiring import updates when analytics is split into client/server exports

---

## Phase 1: Critical Infrastructure

### 1.1 Fix Next.js 16 Build Configuration
**Status:** Pending
**Priority:** HIGH
**Description:** Remove outdated `experimental.turbo: false` configuration to enable Turbopack (now stable default in Next.js 16).

**Files:** `next.config.mjs`
**Action:** Delete the `experimental.turbo: false` line
**Risk:** Low - Configuration is from Next.js 15 experimental period
**Testing:**
```bash
bun run build
# Verify: Build completes successfully with Turbopack
```

### 1.2 Fix Analytics Architecture
**Status:** Pending
**Priority:** CRITICAL
**Description:** Separate client/server analytics exports to resolve bundling conflicts. Create dedicated client export file, update barrel export to exclude server functions, remove redundant PostHogProvider component.

**Files:**
- `src/lib/analytics/client.ts` (new - client-safe exports only)
- `src/lib/analytics/index.ts` (update - split client/server)
- `src/app/client-providers.tsx` (update - remove PostHogProvider if redundant)
- All files in `analytics-imports.txt` from Phase 0.2

**Actions:**
1. Create `client.ts` with browser-safe exports (`trackEvent`, `identifyUser`)
2. Keep server-only code (`trackServerEvent`) in `server.ts`
3. Update `index.ts` to export from both with clear comments
4. Grep for `PostHogProvider` usage - if zero usages, remove component
5. Update all import sites to use correct client/server imports
6. **CRITICAL CHECKPOINT:** Run `bun run typecheck` - must show ZERO errors from analytics before proceeding to Phase 1.3

**Risk:** Medium - Requires updating import statements across codebase
**Testing:**
```bash
bun run typecheck
bun run build
# Verify: Client bundle excludes server-only PostHog code
# Verify: No "can't use server-only module in client" errors
```

### 1.3 Fix Database Schema Gaps
**Status:** Pending (depends on Phase 0.1 findings)
**Priority:** CRITICAL
**Description:** After applying existing migrations in Phase 0.1, create additional migrations for any remaining schema gaps identified in type errors.

**Known schema gaps from type errors:**
- `users.deleted_at` column (4 errors in `src/lib/auth/__tests__/hooks.test.ts`)
- `users.original_email` column (1 error in `src/lib/r2/cleanup.ts:73`)
- `generated_images.refunded_at` column (1 error in `src/components/__tests__/image-card.test.tsx:62`)
- `account_deletion_audit` table (3 errors in `src/lib/r2/cleanup.ts:71`)

**Actions:**
1. Create migration(s) for remaining gaps:
   ```bash
   npx supabase migration new add_user_deletion_fields
   npx supabase migration new add_refunded_at_to_generated_images
   npx supabase migration new create_account_deletion_audit
   ```
2. Write SQL for each migration
3. Apply locally: `npx supabase db push`
4. Regenerate types: `npx supabase gen types typescript --local > src/lib/supabase/database.types.ts`
5. **VERIFICATION:** Run `bun run typecheck` - schema-related errors should be reduced

**Risk:** High - Database changes are foundational for type fixes
**Testing:** Check generated types include new columns/tables with correct types

### 1.4 Fix TypeScript Compilation Errors
**Status:** Pending
**Priority:** CRITICAL
**Description:** Fix remaining 22 TypeScript errors in dependency order. After Phase 1.3, many schema errors should auto-resolve. Focus on remaining type mismatches and component interface issues.

**Current error breakdown (from docs/current-type-errors.md):**
- 1 error: `src/app/api/admin/users/[userId]/timeline/route.ts:33` - null vs undefined
- 11 errors: `src/components/admin/__tests__/timeline-filters.test.tsx` - missing `types` property
- 1 error: `src/components/admin/user-timeline.tsx:19` - useRef missing initialValue
- 1 error: `src/lib/db/jobs.ts:21` - undefined not assignable to string
- Schema errors (should be fixed by Phase 1.3):
  - 4 errors: `src/lib/auth/__tests__/hooks.test.ts` - deleted_at
  - 1 error: `src/components/__tests__/image-card.test.tsx` - refunded_at
  - 3 errors: `src/lib/r2/cleanup.ts` - account_deletion_audit, original_email

**Sub-phases (execute after Phase 1.3):**

#### 1.4A - Null/Undefined Conversions
**Files:**
- `src/app/api/admin/users/[userId]/timeline/route.ts:33` - Convert `cursor` from `string | null` to `string | undefined`
- `src/lib/db/jobs.ts:21` - Ensure `uploadId ?? undefined` doesn't pass undefined where string required

#### 1.4B - Component Interface Fixes
**Files:**
- `src/components/admin/__tests__/timeline-filters.test.tsx` - Add missing `types: []` to test fixtures (11 instances)
- `src/components/admin/user-timeline.tsx:19` - Add `useRef<IntersectionObserver | null>(null)` or `useRef<IntersectionObserver>(null!)`

#### 1.4C - Verification
After each sub-phase: `bun run typecheck`

**Contingency:** If new TypeScript errors are discovered during fixes:
1. Pause execution
2. Categorize new errors by type (schema, null handling, interface mismatches)
3. Create Phase 1.4D if needed with specific fixes
4. Re-run verification after all fixes

**Risk:** High - Type fixes could reveal additional errors
**Testing:** `bun run typecheck` should show "Found 0 errors" at completion

---

## Phase 2: Code Quality Improvements

### 2.1 Replace @ts-ignore with @ts-expect-error
**Status:** Pending
**Priority:** Medium
**Description:** Update 7 instances of `@ts-ignore` to `@ts-expect-error` for better type safety enforcement.

**Files (from docs/current-lint-errors.md):**
- `src/app/api/cron/analyze-sentiment/__tests__/route.test.ts:138` (4 instances: lines 138, 269, 377, 408)
- `src/app/api/messages/[id]/__tests__/route.test.ts:81` (2 instances: lines 81, 85)
- `src/lib/analytics/posthog-provider.tsx:15` (1 instance)

**Risk:** Low - Purely stylistic change for better type checking
**Testing:** `bun run typecheck` - verify no new errors introduced

### 2.2 Replace Console Statements with Structured Logging
**Status:** Pending
**Priority:** Medium
**Description:** Replace server-side console statements with calls to existing structured logger (`src/lib/logging/index.ts`). Keep client-side console.error for development debugging.

**Files with console errors (from docs/current-lint-errors.md):**
- `src/lib/auth/hooks.ts:80` - 1 console.error
- `src/lib/cookie-consent/storage.ts` - 4 console.error (lines 12, 23, 32, 54)
- `src/lib/cookie-consent/sync.ts:30` - 1 console.error
- `src/lib/logging/index.ts` - 2 console.error (lines 72, 81) - these are IN the logger, may be intentional fallbacks
- `src/lib/observability/capture-error-client.ts` - 2 console.error (lines 24, 41) - client-side, keep for dev
- `src/lib/toast/index.ts:27` - 1 console.error

**Actions:**
```typescript
// Before
console.error('Something failed', error);

// After (server-side)
import { logger } from '@/lib/logging';
logger.error('Something failed', { error });
```

**Review logging/index.ts console usage:** Lines 72, 81 may be intentional fallbacks when logger fails - confirm before changing.

**Risk:** Low - Aligns with existing logging standards
**Testing:**
```bash
bun run lint | grep "no-console"
# Expected: Zero server-side console violations, client-side acceptable
```

### 2.3 Remove 'any' Types and Use Proper Types
**Status:** Pending
**Priority:** HIGH
**Description:** Eliminate 8 instances of `any` types in database queries, test mocks, and async local storage.

**Files with @typescript-eslint/no-explicit-any errors:**
- `src/lib/db/admin-messages.ts` - 2 any (lines 93, 188)
- `src/lib/db/admin-timeline.ts` - 3 any (lines 51, 89, 109)
- `src/lib/request/context.ts` - 3 any (lines 8, 10, 22)

**Actions:**
1. For database query results: Use generated Supabase types or create specific interfaces
2. For async storage: Define explicit context types
3. Consider: If unavoidable due to library constraints, disable rule for specific lines with justification comment

**Risk:** Medium - May require new type definitions or rule adjustments
**Testing:**
```bash
bun run lint | grep "no-explicit-any"
# Expected: Zero violations
```

---

## Phase 3: Cleanup and Optimization

### 3.1 Handle Unused Variables and Imports
**Status:** Pending
**Priority:** Low
**Description:** Clean up 29 linting warnings for unused imports/variables using consistent criteria.

**Criteria for removal:**
- **Remove:** Truly unused imports with no side effects (verify with eslint + manual review)
- **Prefix with `_`:** Intentionally unused function parameters (e.g., mock functions, API route params)
- **Keep:** Imports with side effects (CSS, module registration) even if unused

**Files with unused var warnings (from docs/current-lint-errors.md):**
- Mock function parameters (prefix with `_`):
  - `src/lib/test-utils/supabase-mocks.ts` - 6 unused params (lines 90-92, 144-146)
  - `src/app/api/contact/__tests__/route.test.ts:19` - unused `params`
  - `src/app/api/cookie-consent/route.ts:6` - unused `request`

- Truly unused imports (review and remove):
  - `middleware.ts:1` - `CookieOptions`
  - `src/app/api/generate/route.ts:3` - `crypto`
  - `src/lib/auth/__tests__/hooks.test.ts:1` - `beforeEach`
  - `src/lib/cookie-consent/__tests__/storage.test.ts:5` - `clearLocalStorageConsent`
  - And 15+ more warnings in test files

**Actions:**
1. For each warning, check if import/variable has side effects
2. If no side effects and unused: delete
3. If function parameter: prefix with `_`
4. Review `src/lib/analytics/posthog-provider.tsx:42` - unused eslint-disable directive (remove directive)

**Risk:** Low - Code cleanup with minimal functional impact
**Testing:**
```bash
bun run lint
# Expected: Reduced warnings, no new errors
bun run test
# Expected: All tests still pass
```

### 3.2 Add Missing Return Types
**Status:** Pending
**Priority:** Low
**Description:** Add explicit return type to 1 exported function violating explicit-function-return-type rule.

**Files:**
- `src/app/api/cookie-consent/route.ts:6` - Missing return type on exported function

**Action:**
```typescript
// Before
export async function GET(request) { ... }

// After
export async function GET(request: Request): Promise<Response> { ... }
```

**Risk:** Low - Single line change
**Testing:** `bun run typecheck`

---

## Phase 4: Database and Legal Compliance

### 4.1 Implement Account Deletion Functionality (UI + Flow)
**Status:** Pending
**Priority:** HIGH (Required before production deployment)
**Description:** Implement complete account deletion flow with 30-day soft delete, audit logging, and UI. Database table created in Phase 1.3; this phase adds business logic and UI.

**Prerequisites:** Phase 1.3 must be complete (`account_deletion_audit` table exists)

**Components to create:**
- Account deletion API endpoint (`src/app/api/account/delete/route.ts`)
- Soft delete logic (set `deleted_at`, create audit record, queue cleanup)
- UI component for account deletion (settings page)
- Confirmation dialog with warnings
- Scheduled cleanup job (R2 files, DB records after 30 days)

**Files:**
- New: `src/app/api/account/delete/route.ts`
- New: `src/components/account/delete-account-dialog.tsx`
- Update: Account settings page to include deletion option
- New: Cron endpoint for 30-day cleanup (`src/app/api/cron/cleanup-deleted-accounts/route.ts`)

**Risk:** Medium - Adds new functionality, critical for legal compliance
**Testing:**
- Manual: Trigger account deletion, verify audit log created
- Verify: User marked as deleted, still visible in admin panel
- Verify: R2 files queued for cleanup
- Test: 30-day cleanup cron job

**Note:** All phases (1-5) must complete before PRODUCTION deployment. Staging/development deployment can proceed after Phase 1-3.

---

## Phase 5: Final Verification

### 5.1 Execute Complete Verification Checklist
**Status:** Pending
**Priority:** HIGH
**Description:** Run comprehensive verification checklist to ensure all fixes are complete and no regressions introduced.

**Verification Commands:**
```bash
# 1. TypeScript Compilation
bun run typecheck
# Expected: "Found 0 errors"

# 2. Linting
bun run lint
# Expected: 0 errors, <29 warnings (warnings acceptable)

# 3. Build Process
bun run build
# Expected: Successful .next output, no compilation failures

# 4. Test Suite
bun run test
# Expected: All tests pass

# 5. Manual Verification
# - Start dev server: bun run dev
# - Test analytics tracking (client events fire)
# - Test timeline filters with types property
# - Test image card rendering (refunded_at field)
# - Verify user list loads (new RPC function works)
```

**Success Criteria:**
- ✅ Zero TypeScript compilation errors
- ✅ Zero linting errors (26 fixed)
- ✅ Warnings reduced (from 29, some may remain)
- ✅ Successful Next.js build with Turbopack
- ✅ All timeline, user list, and validation APIs functional
- ✅ Analytics client/server split working correctly
- ✅ Database migrations applied and types regenerated

**If any failures:**
1. Document the failure with full error output
2. Trace failure back to specific phase
3. Re-execute that phase with corrected approach
4. Re-run verification

**Risk:** Low - Validation only, no code changes
**Testing:** This IS the testing phase

---

## Implementation Strategy

### Execution Order (Sequential)
1. **Phase 0:** Discovery (existing migrations, import sites)
2. **Phase 1.1:** Next.js config (independent fix)
3. **Phase 1.2:** Analytics refactor (must complete + verify before 1.3)
4. **Phase 1.3:** Database migrations (enables 1.4)
5. **Phase 1.4:** TypeScript errors (depends on 1.3 types)
6. **Phase 2:** Code quality (can run in any order within phase)
7. **Phase 3:** Cleanup (lowest priority)
8. **Phase 4:** Account deletion (can parallelize with Phase 3)
9. **Phase 5:** Final verification

### Critical Path
Phase 0.1 → Phase 1.2 (+ verify) → Phase 1.3 → Phase 1.4 → Phase 5

### Testing Checkpoints
- After Phase 0.1: Verify types regenerated with user_activity
- After Phase 1.2: `bun run typecheck` must show zero analytics errors
- After Phase 1.3: Verify schema-related TS errors reduced
- After Phase 1.4: `bun run typecheck` must show zero errors total
- After Phase 2: `bun run lint` - check error count
- After Phase 5: All verification commands pass

### Rollback Strategy
- **Migrations:** Local testing via `npx supabase db push` before committing
- **Code changes:** Git commits after each phase for easy revert
- **No production deployment** until Phase 5 verification passes

---

## Dependencies and Prerequisites

- **Database Access:** Local Supabase instance via `npx supabase`
- **Next.js 16 Environment:** Build fixes assume Next.js 16 compatibility
- **No Breaking Changes:** All fixes maintain existing API contracts
- **Local Migration Testing:** Migrations tested locally before production

---

## Success Metrics

- ✅ Zero TypeScript compilation errors (currently 22)
- ✅ Zero linting errors (currently 26)
- ✅ Warnings reduced and documented (currently 29)
- ✅ Successful Next.js build with Turbopack enabled
- ✅ All timeline, user list, and validation APIs functional
- ✅ Analytics properly split between client/server
- ✅ Database schema matches application requirements
- ✅ Legal compliance ready (account deletion implemented before production)

---

## Notes

**Changed from v1:**
- Added Phase 0 for discovery (existing migrations, import audits)
- Reordered: Analytics refactor now comes BEFORE TypeScript fixes with mandatory verification
- Explicit verification commands replacing vague "verify build succeeds"
- Concrete file:line references from actual error output
- Local migration testing protocol instead of vague "rollback plan"
- Clarified account deletion is pre-production requirement, not blocking development
- Fixed success metrics (zero errors, not "reduced to ~20")
- Added contingency planning for newly discovered errors
- Specified existing logger (`src/lib/logging/index.ts`) for console replacements
