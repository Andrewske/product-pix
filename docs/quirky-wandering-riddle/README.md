# TypeScript Error Fix - Implementation Tasks

**Goal:** Fix all 68 TypeScript errors with proper long-term solutions (not quick fixes).

## Task Sequence

This plan is divided into 6 sequential tasks that must be executed in order:

### 01 - Fix Supabase Dependency Resolution
**Priority:** CRITICAL - Must run first
**Impact:** Fixes 2 type errors (Supabase client/server conflicts)
**Files:** `package.json`
**Time:** ~5 minutes (mostly `bun install` time)

Forces all packages to use @supabase/supabase-js@2.87.1 via Bun resolutions.

---

### 02 - Update Environment Schema
**Priority:** HIGH - Can run in parallel with Task 01
**Impact:** Fixes ~10 type errors (missing env variables)
**Files:** `src/lib/env.ts`, 3 component files
**Time:** ~10 minutes

Adds 4 missing PostHog variables to schema; standardizes on `NEXT_PUBLIC_POSTHOG_KEY` naming.

---

### 03 - Create Type-Safe Test Mock Helpers
**Priority:** HIGH - Enables Task 04
**Impact:** Infrastructure for fixing ~40 test errors
**Files:** Create `src/lib/test-utils/` (2 new files)
**Time:** ~20 minutes

Builds reusable Supabase mock utilities with proper TypeScript types.

---

### 04 - Migrate Test Files to Type-Safe Mocks
**Priority:** HIGH - Depends on Task 03
**Impact:** Fixes ~40 test mock type errors
**Files:** ~10-15 test files
**Time:** ~30-45 minutes

Replaces all `as any` casts in test files with type-safe mock helpers.

---

### 05 - Fix Remaining Type Issues
**Priority:** MEDIUM - Cleanup task
**Impact:** Fixes remaining ~16 type errors
**Files:** 8 files (production + test)
**Time:** ~20-30 minutes

Addresses miscellaneous type issues including AsyncLocalStorage, test mock mismatches, and deprecated properties.

---

### 06 - Verification and Documentation
**Priority:** MEDIUM - Final validation
**Impact:** Ensures all fixes work; documents patterns
**Files:** `.env.example`, `ai-learnings.md`, `CLAUDE.md`
**Time:** ~15 minutes

Runs full verification suite and updates documentation with learnings.

---

## Total Estimated Time

**Sequential execution:** ~2-2.5 hours
**Parallel opportunities:** Tasks 01 and 02 can run simultaneously (~5 min saved)

## Error Breakdown

| Category | Count | Fixed By |
|----------|-------|----------|
| Supabase version conflicts | 2 | Task 01 |
| Environment schema issues | 10 | Task 02 |
| Test mock type issues | 40 | Tasks 03 & 04 |
| Miscellaneous type issues | 16 | Task 05 |
| **Total** | **68** | - |

## Execution Options

### Option A: Manual Sequential Execution
1. Read each task file in order (01 through 06)
2. Execute the changes described
3. Run the acceptance criteria tests
4. Move to next task

### Option B: Automated Orchestrator
Use your preferred automation tool (OpenCode, cursor, etc.) to:
1. Parse task files
2. Execute changes programmatically
3. Verify acceptance criteria
4. Continue to next task

### Option C: Git Worktree Isolation
```bash
# Create isolated workspace
git worktree add .worktrees/quirky-wandering-riddle main
cd .worktrees/quirky-wandering-riddle

# Execute tasks...

# When complete, review and merge
git checkout main
git merge quirky-wandering-riddle
git worktree remove .worktrees/quirky-wandering-riddle
```

## Critical Dependencies

- **Task 03 MUST complete before Task 04** (test utils infrastructure)
- **Task 01 SHOULD complete before others** (foundation for type system)
- **Tasks 01-05 MUST complete before Task 06** (verification needs all fixes)

## Success Criteria

At the end of Task 06:
- ✅ `bunx tsc --noEmit` reports 0 errors
- ✅ `bun test` all tests pass
- ✅ No `as any` in test files
- ✅ Documentation updated
- ✅ Single Supabase version (2.87.1)

## Notes

- **Do not skip tasks** - they build on each other
- **Run acceptance criteria** after each task to catch issues early
- **Commit after each major task** to enable easy rollback
- **Original plan** preserved at `.claude/plans/quirky-wandering-riddle.md`
