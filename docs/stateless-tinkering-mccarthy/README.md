# Fix 59 Linting Issues - Task Sequence

**Plan:** stateless-tinkering-mccarthy
**Created:** 2025-12-13
**Total Tasks:** 6
**Estimated Time:** ~4 hours

## Overview

Resolve all 59 linting violations by migrating to centralized logging infrastructure and fixing TypeScript/test framework issues. **Also fixes bug where original error context is lost in catch blocks.**

**Current State:**
- 43 errors, 16 warnings across 4 rule categories
- Centralized logging infrastructure exists but partially adopted
- **Bug:** 23 catch blocks lose original error context

**Target State:**
- 0 errors, 0 warnings
- Consistent structured logging throughout codebase
- Bun test framework (no Jest)
- All catch blocks preserve original error details for debugging

## Task Sequence

Execute tasks in order (dependencies flow from top to bottom):

### 01-fix-typescript-any-type.md
**Time:** 5 minutes
**Type:** Quick win - TypeScript cleanup

Remove unnecessary `any` type annotation that React Query can infer.

**Files:**
- `src/components/admin/user-timeline.tsx` (1 line)

---

### 02-migrate-jest-test-to-bun.md
**Time:** 45 minutes
**Type:** Test framework migration

Convert Jest test to Bun test framework per CLAUDE.md requirements.

**Files:**
- `src/components/admin/__tests__/user-timeline.test.tsx` (complete rewrite)

**Key changes:**
- `jest.mock` → `mock.module` from `bun:test`
- `require()` → ES6 imports
- `jest.spyOn` → `spyOn` from `bun:test`
- `jest.clearAllMocks` → manual mock reset

---

### 03-fix-catch-blocks-preserve-error-context.md
**Time:** 45 minutes
**Type:** Bug fix - Error handling

Fix 23 catch blocks that lose original error context when creating ProductPixErrors.

**Files:**
- 12 API route files with catch blocks
- Total: 23 catch blocks across `src/app/api/**/route.ts`

**Impact:**
- Debugging: "Database error: unique constraint violation" vs "Database error"
- Production troubleshooting: Actual Stripe/DB error messages preserved

---

### 04-migrate-console-errors-to-logger.md
**Time:** 60 minutes
**Type:** Pattern A - Simple logging

Replace 17 console.error calls with structured `logger.error()` for non-critical operations.

**Files:**
- `src/lib/db/credits.ts` (4)
- `src/lib/db/cost-queries.ts` (4)
- `src/lib/db/uploads.ts` (4)
- 5 additional lib files (1-2 each)

**Benefits:**
- Structured JSON logs with automatic requestId
- Log level filtering
- Vercel log capture

---

### 05-migrate-console-errors-to-observability.md
**Time:** 90 minutes
**Type:** Pattern B - Full observability

Replace 21 console.error calls with ProductPixError + captureError for critical operations.

**Files:**
- `src/lib/db/refunds.ts` (14) - **HIGHEST PRIORITY**
- `src/lib/stripe/*.ts` (4)
- `src/lib/pricing/*.ts` (2)
- `src/lib/toast/index.ts` (1 - special case)

**Benefits:**
- Three-tier capture: Vercel logs → Database → PostHog
- Critical errors persisted for audit trail
- Error analytics in PostHog
- Request correlation

---

### 06-verification-and-testing.md
**Time:** 30 minutes
**Type:** Verification and quality assurance

Verify all issues resolved and implementation is production-ready.

**Steps:**
1. Linting: `bun run lint` (expect 0 errors, 0 warnings)
2. Type checking: `bunx tsc --noEmit` (expect no errors)
3. Test suite: `bun test` (expect all pass)
4. Manual smoke testing (structured logs, error capture)
5. Code review checklist

**Deliverables:**
- Clean linting
- All tests passing
- Commit message template provided
- Optional PR creation steps

---

## Implementation Strategies

### Recommended: All-at-once (single PR)
Execute all 6 tasks sequentially in one session.

**Advantages:**
- Single coherent story: "Enforce centralized logging standards"
- Easier to review as a unit
- No intermediate inconsistent states
- Complete bug fix (error context preservation)

**Time:** 3-4 hours

### Alternative: Phased approach
Execute in 2-3 separate PRs.

**Phase 1:** Tasks 01-03 (quick wins + bug fix) - 90 min
**Phase 2:** Tasks 04-05 (logging migration) - 2.5 hours
**Phase 3:** Task 06 (verification) - 30 min

## Benefits Summary

**Immediate wins:**
1. Better debugging: Original error messages preserved
2. Error tracking: Search PostHog for specific error patterns
3. Request correlation: Trace entire request flow via requestId
4. Audit trail: Critical errors persisted to database

**Long-term wins:**
1. Pattern consistency: All errors handled uniformly
2. Observability foundation: Ready for scaling
3. No technical debt: Won't need revisiting
4. Compliance: Aligns with CLAUDE.md standards

## Critical Files Reference

Most impacted files (highest concentration of changes):

1. `src/lib/db/refunds.ts` - 14 console.error → observability (task 05)
2. `src/app/api/**/route.ts` - 23 catch blocks (task 03)
3. `src/lib/db/credits.ts` - 4 console.error → logger (task 04)
4. `src/lib/db/cost-queries.ts` - 4 console.error → logger (task 04)
5. `src/components/admin/__tests__/user-timeline.test.tsx` - Jest → Bun (task 02)

## Infrastructure Used

**Existing (no changes needed):**
- `src/lib/logging/index.ts` - Structured logger
- `src/lib/observability/capture-error.ts` - Three-tier capture
- `src/lib/errors/error-classes.ts` - ProductPixError types
- `src/lib/errors/codes.ts` - Error code constants

## Next Steps

1. **Review this README** and all task files
2. **(Optional) Create isolated git worktree:**
   ```bash
   git worktree add ../stateless-tinkering-mccarthy -b fix/linting-issues
   cd ../stateless-tinkering-mccarthy
   ```
3. **Execute tasks 01-06 in sequence**
4. **Verify with task 06**
5. **Commit and PR** (template provided in task 06)

---

**Original Plan:** `.claude/plans/stateless-tinkering-mccarthy.md`
**Task Files:** `./docs/stateless-tinkering-mccarthy/01-*.md` through `06-*.md`
