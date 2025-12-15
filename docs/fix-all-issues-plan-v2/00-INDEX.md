# Fix All Issues - Task Index

**Plan Source:** docs/fix-all-issues-plan-v2.md
**Total Tasks:** 13
**Estimated Timeline:** 6-9 days

## Task Sequence

### Phase 0: Pre-Flight Verification (Discovery)
- **01-review-existing-migrations.md** - Apply 5 existing migrations, regenerate types
- **02-audit-analytics-imports.md** - Grep for analytics import sites

### Phase 1: Critical Infrastructure
- **03-fix-nextjs-build-config.md** - Remove experimental.turbo: false
- **04-refactor-analytics-architecture.md** - Split client/server exports (CRITICAL CHECKPOINT)
- **05-create-database-schema-migrations.md** - Add missing schema (deleted_at, refunded_at, etc.)
- **06-fix-typescript-errors.md** - Fix 22 type errors after migrations

### Phase 2: Code Quality Improvements
- **07-replace-ts-ignore-with-ts-expect-error.md** - Update 7 instances
- **08-replace-console-with-structured-logging.md** - Use logger for server-side
- **09-eliminate-any-types.md** - Fix 8 instances with proper types

### Phase 3: Cleanup and Optimization
- **10-cleanup-unused-variables-imports.md** - Clean 29 warnings
- **11-add-missing-return-types.md** - Add return type to 1 function

### Phase 4: Database and Legal Compliance
- **12-implement-account-deletion-feature.md** - Complete deletion flow (UI + API)

### Phase 5: Final Verification
- **13-final-verification.md** - Execute complete verification checklist

## Critical Path

Tasks that MUST be completed in order:

```
01 → 04 (verify) → 05 → 06 → 13
```

- **Task 01:** Must complete before Task 05 (need to know existing schema)
- **Task 04:** MUST verify with `bun run typecheck` before proceeding to Task 05
- **Task 05:** Enables Task 06 (types must exist for fixes)
- **Task 06:** Must complete before Task 13 (zero TS errors required)

## Parallelization Opportunities

After Task 06 completes, these can run in parallel:
- Tasks 07-11 (code quality and cleanup)
- Task 12 (account deletion - if desired before production)

## Verification Checkpoints

- **After Task 01:** Types regenerated with user_activity
- **After Task 04:** Zero analytics-related TS errors (MANDATORY GATE)
- **After Task 05:** Schema-related TS errors reduced
- **After Task 06:** Zero TS errors total
- **After Task 13:** All verification commands pass

## Deployment Gates

**Staging/Development:** Tasks 01-06 sufficient
**Production:** Tasks 01-13 required (includes account deletion)

## Quick Reference

**Verification commands:**
```bash
bun run typecheck  # Zero errors required
bun run lint       # Zero errors, warnings acceptable
bun run build      # Successful build
bun run test       # All tests pass
```

**Migration commands:**
```bash
npx supabase db push  # Apply migrations locally
npx supabase gen types typescript --local > src/lib/supabase/database.types.ts
```

## Current State

- TypeScript errors: 22
- Linting errors: 26
- Linting warnings: 29
- Build status: Failing
- Missing schema: 4 columns, 1 table

## Target State

- TypeScript errors: 0
- Linting errors: 0
- Linting warnings: <29 (documented)
- Build status: Passing with Turbopack
- Schema: Complete and migrated
