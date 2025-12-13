# Code Review Fixes - Implementation Plans

OpenCode-ready planning documents for addressing all code review issues from the admin dashboard implementation.

## Execution Order (Recommended)

### 1. Critical (Must Fix First)
**[1-fix-critical-issues-plan.md](./1-fix-critical-issues-plan.md)**
- Add 'use client' directive to AdminNav (prevents runtime error)
- Fix disabled link navigation (accessibility bug)
- **Impact**: Blocks production deployment
- **Estimated Tasks**: 2
- **Files Modified**: 1

### 2. Type Safety (High Priority)
**[2-fix-type-safety-plan.md](./2-fix-type-safety-plan.md)**
- Add explicit return types to all functions
- **Impact**: Project standards compliance
- **Estimated Tasks**: 8
- **Files Modified**: 5

### 3. Infrastructure (Medium Priority)
**[3-centralized-logging-plan.md](./3-centralized-logging-plan.md)**
- Create centralized logger
- Replace scattered console.error calls
- **Impact**: Code quality, debugging
- **Estimated Tasks**: 4
- **Files Created**: 2
- **Files Modified**: 2

### 4. DRY Refactor (Medium Priority)
**[4-shared-admin-utilities-plan.md](./4-shared-admin-utilities-plan.md)**
- Extract duplicated admin verification logic
- Create reusable `requireAdmin()` utility
- **Impact**: Maintainability, reduces ~40 lines of duplicated code
- **Estimated Tasks**: 5
- **Files Created**: 2
- **Files Modified**: 4

### 5. Component Refactor (Medium Priority)
**[5-refactor-admin-components-plan.md](./5-refactor-admin-components-plan.md)**
- Extract RefundCard component
- Create refund utility functions
- Reduce component from 165 to ~60 lines
- **Impact**: Maintainability, testability
- **Estimated Tasks**: 5
- **Files Created**: 4
- **Files Modified**: 2
- **Dependencies**: Centralized logging

### 6. Polish (Low Priority)
**[6-fix-test-improvements-plan.md](./6-fix-test-improvements-plan.md)**
- Fix console.error mocking in tests
- Update documentation security
- Add business logic comments
- **Impact**: Test quality, documentation
- **Estimated Tasks**: 4
- **Files Modified**: 4

## Quick Stats

- **Total Plans**: 6
- **Total Tasks**: ~28
- **New Files**: 10
- **Modified Files**: 18
- **Test Files**: 6

## Implementation Strategies

### Option A: Sequential (Safest)
Execute plans in order 1→6. Each plan builds on previous work.

### Option B: Parallel Critical Path
1. Execute plans 1-2 together (critical + type safety)
2. Execute plans 3-5 in parallel (infrastructure, utilities, refactor)
3. Execute plan 6 last (polish)

### Option C: Minimal MVP
Execute only plans 1-2 for immediate production readiness, defer 3-6 to next sprint.

## Success Metrics

- [ ] All TypeScript strict mode violations resolved
- [ ] No runtime errors in admin dashboard
- [ ] All tests passing (currently 20 tests for admin features)
- [ ] Test coverage maintained ≥70%
- [ ] No console.error scattered in code
- [ ] Admin verification logic not duplicated
- [ ] Components follow ≤20 line guideline
- [ ] Documentation doesn't expose credentials

## OpenCode Usage

Each plan can be executed independently with OpenCode orchestrator:

```bash
# Execute individual plan
opencode execute docs/plans/code-review-fixes/1-fix-critical-issues-plan.md

# Execute all in sequence (numbered order)
for plan in docs/plans/code-review-fixes/{1..6}-*.md; do
  opencode execute "$plan"
done

# Or execute all except README
for plan in docs/plans/code-review-fixes/*.md; do
  [[ "$plan" != *"README"* ]] && opencode execute "$plan"
done
```

## Notes

- All plans include detailed implementation code
- Each task has file paths, tests, and acceptance criteria
- Plans are designed for autonomous execution
- Dependencies are clearly documented
- Original code review: See commit 2cbabd9d
