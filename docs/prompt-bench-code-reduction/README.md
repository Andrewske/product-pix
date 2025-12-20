# Prompt Bench Code Reduction

## Overview

This plan addresses code quality issues identified in the `prompt-bench/` directory of the ProductPix codebase. The analysis found 6 actionable reduction opportunities across 23,430 lines of TypeScript code, with potential to reduce ~580 lines (2.5%) while significantly improving maintainability.

**Key Issues Addressed:**
- Duplicated type guards and mapping logic in improve.ts
- Repeated database client instantiation (52 occurrences)
- 371-line monolithic function with 30+ cyclomatic complexity
- Dead code (non-functional approval function)
- HTML template duplication in UI server

## Task Sequence

1. [01-remove-dead-approval-function.md](./01-remove-dead-approval-function.md) - Remove non-functional `requestApproval` that always returns true
2. [02-consolidate-html-templates.md](./02-consolidate-html-templates.md) - Merge duplicate HTML rendering functions into parameterized helper
3. [03-extract-evaluation-type-guard.md](./03-extract-evaluation-type-guard.md) - Extract duplicated `hasBreakdown` type guard and mapping utilities
4. [04-extract-variable-merge-utility.md](./04-extract-variable-merge-utility.md) - Extract duplicated variable merging logic in orchestrator
5. [05-refactor-database-client-injection.md](./05-refactor-database-client-injection.md) - Introduce dependency injection for database clients
6. [06-decompose-collection-generation.md](./06-decompose-collection-generation.md) - Break down 371-line function into focused, testable units

## Success Criteria

- [ ] All 6 tasks completed without regressions
- [ ] TypeScript compiles cleanly: `bunx tsc --noEmit`
- [ ] All tests pass: `bun test prompt-bench`
- [ ] Core commands work:
  - `bun bench test --template ecommerce-base --batch prompt-bench/fixtures/mini-batch.json`
  - `bun bench improve --auto-approve --template ecommerce-base`
- [ ] UI server routes functional at `http://localhost:8181/` and `/notebook`
- [ ] ~580 lines reduced from codebase
- [ ] Cyclomatic complexity of `coordinateCollectionGeneration` reduced from 30+ to <15

## Execution Instructions

1. Execute tasks in numerical order (01 → 06)
2. Each task file contains:
   - Files to modify/create
   - Implementation details with code examples
   - Acceptance criteria checklist
   - Dependencies on prior tasks
   - Risk level assessment
3. Verify acceptance criteria before moving to next task
4. Run `bunx tsc --noEmit && bun test prompt-bench` after each task

## Dependencies

- Bun runtime (for tests and CLI)
- TypeScript 5.x
- Existing test coverage in `prompt-bench/__tests__/`

## Estimated Effort

| Task | Effort | Risk | Lines Saved |
|------|--------|------|-------------|
| 01 | 20 min | Very Low | ~30 |
| 02 | 30 min | Very Low | ~60 |
| 03 | 45 min | Low | ~140 |
| 04 | 15 min | Very Low | ~10 |
| 05 | 90 min | Medium | ~200 (architectural) |
| 06 | 60 min | High | ~120 |

**Total: ~3.5 hours, ~580 lines**

## Quick Wins First

Tasks 01-04 are quick wins that can be completed in under 2 hours with minimal risk. Consider completing these first to build momentum before tackling the architectural refactors in tasks 05-06.
