# Iterate Command Cleanup Plan

## Overview

Remove evolutionary iteration system code that is no longer used after implementing the new `improve` command. This cleanup removes complex genetic algorithm logic, session management, convergence detection, and related infrastructure that was part of the experimental `iterate` command.

## Why Remove

1. **New `improve` command supersedes old `iterate`** - Different, simpler approach
2. **Unused code is maintenance burden** - Dependencies, tests, documentation to maintain
3. **Confusing for users** - Two similar commands doing different things
4. **Old approach wasn't working** - Expensive ($9+/session), complex, no clear value
5. **Code is preserved in git history** - Can be recovered if ever needed

## What Gets Removed

### Core Modules (Complete Removal)

These files are ONLY used by old iterate and can be fully deleted:

- [ ] **`prompt-bench/core/evolution.ts`** - Genetic algorithm mutation/crossover logic
- [ ] **`prompt-bench/core/convergence.ts`** - Population convergence detection
- [ ] **`prompt-bench/core/state.ts`** - Session state persistence for iterate
- [ ] **`prompt-bench/core/iteration-types.ts`** - Types for evolutionary system

### Command Files (Complete Removal)

- [ ] **`prompt-bench/commands/iterate.ts`** - Old iterate command (1089 lines)

### Test Files (Complete Removal)

- [ ] **`prompt-bench/__tests__/evolution.test.ts`** - Evolution module tests
- [ ] **`prompt-bench/__tests__/convergence.test.ts`** - Convergence tests
- [ ] **`prompt-bench/__tests__/iteration-types.test.ts`** - Type tests (if exists)

### Session Files (Optional Cleanup)

- [ ] **`prompt-bench/sessions/*.json`** - Old session state files (gitignored)
- [ ] **`prompt-bench/sessions/*-costs.csv`** - Old cost tracking files (gitignored)

Note: Sessions directory can be deleted entirely or kept for historical reference

### Partial Cleanup Needed

These files have iterate-specific code mixed with shared code:

#### `prompt-bench/commands/insights.ts`

**Remove**:
- Imports: `StructuredInsight`, `PromptVariation`, `SuccessPattern`, `FailurePattern` from iteration-types
- Function: `generateStructuredInsights()` (used only by iterate)
- Function: `buildInsightPrompt()` (used only by iterate)

**Keep**:
- Type: `BatchSummary` (may be used by improve/reports)
- Type: `InsightResult` (may be used by improve)
- Other analysis functions if they exist

#### `prompt-bench/core/index.ts`

**Remove**:
```typescript
// Iteration system exports
export * from './iteration-types';
export * from './state';
export * from './evolution';
export * from './convergence';
```

**Keep**: All other exports

#### `prompt-bench/cli.ts`

**Remove**:
- Import for `iterateCommand`
- Case handler for 'iterate' command
- Help text for iterate command

**Keep**: All other commands

### Documentation Updates

- [ ] **`CLAUDE.md`** - Remove iterate command documentation, keep improve
- [ ] **`docs/prompt-iterate/`** - Delete entire directory (implementation docs for old system)
- [ ] **`docs/iterate-command-refactor-plan.md`** - Delete (superseded by improve)
- [ ] **`.claude/commands/prompt-iterate.md`** - Delete slash command (if exists)

### Configuration Updates

- [ ] **`prompt-bench.toml`** - Remove `[defaults.iterate]` section if it exists

## Implementation Checklist

### Phase 1: Verify No External Dependencies

Before deleting, verify these modules are not imported anywhere except iterate:

- [ ] Search codebase for imports from `evolution.ts`
- [ ] Search codebase for imports from `convergence.ts`
- [ ] Search codebase for imports from `state.ts`
- [ ] Search codebase for imports from `iteration-types.ts`
- [ ] Search for `generateStructuredInsights` usage outside iterate

Commands to verify:
```bash
# Check for evolution imports
grep -r "from.*evolution" prompt-bench --exclude-dir=__tests__ --exclude=iterate.ts

# Check for convergence imports
grep -r "from.*convergence" prompt-bench --exclude-dir=__tests__ --exclude=iterate.ts

# Check for state imports
grep -r "from.*state" prompt-bench --exclude-dir=__tests__ --exclude=iterate.ts

# Check for iteration-types imports
grep -r "from.*iteration-types" prompt-bench --exclude-dir=__tests__ --exclude=iterate.ts

# Check for generateStructuredInsights usage
grep -r "generateStructuredInsights" prompt-bench --exclude=iterate.ts --exclude=insights.ts
```

### Phase 2: Delete Core Files

- [ ] Delete `prompt-bench/core/evolution.ts`
- [ ] Delete `prompt-bench/core/convergence.ts`
- [ ] Delete `prompt-bench/core/state.ts`
- [ ] Delete `prompt-bench/core/iteration-types.ts`
- [ ] Verify TypeScript compilation still passes
- [ ] Verify no import errors

### Phase 3: Delete Test Files

- [ ] Delete `prompt-bench/__tests__/evolution.test.ts`
- [ ] Delete `prompt-bench/__tests__/convergence.test.ts`
- [ ] Delete `prompt-bench/__tests__/iteration-types.test.ts` (if exists)
- [ ] Run test suite to verify no failures

### Phase 4: Delete Command File

- [ ] Delete `prompt-bench/commands/iterate.ts`
- [ ] Verify TypeScript compilation passes

### Phase 5: Clean Up insights.ts

- [ ] Remove imports from iteration-types:
  ```typescript
  // REMOVE these imports
  import {
    StructuredInsight,
    PromptVariation,
    SuccessPattern,
    FailurePattern,
  } from '@bench/core/iteration-types';
  ```

- [ ] Remove `generateStructuredInsights()` function (if only used by iterate)
- [ ] Remove `buildInsightPrompt()` function (if only used by iterate)
- [ ] Keep `BatchSummary` and other types that might be used elsewhere
- [ ] Verify TypeScript compilation passes

### Phase 6: Update Barrel Exports

- [ ] Edit `prompt-bench/core/index.ts`:
  ```typescript
  // REMOVE these lines:
  // Iteration system exports
  export * from './iteration-types';
  export * from './state';
  export * from './evolution';
  export * from './convergence';
  ```
- [ ] Verify TypeScript compilation passes
- [ ] Verify test suite passes

### Phase 7: Update CLI

- [ ] Edit `prompt-bench/cli.ts`:
  - Remove import: `import { iterateCommand } from '@bench/commands/iterate';`
  - Remove case handler for 'iterate'
  - Remove help text mentioning iterate
- [ ] Test CLI help output: `bun bench --help`
- [ ] Verify other commands still work

### Phase 8: Clean Up Documentation

- [ ] Delete `docs/prompt-iterate/` directory entirely
- [ ] Delete `docs/iterate-command-refactor-plan.md`
- [ ] Delete `.claude/commands/prompt-iterate.md` (if exists)
- [ ] Update `CLAUDE.md`:
  - Remove iterate from commands list
  - Remove iterate documentation section
  - Keep improve command documentation
  - Update "Recent Updates" section to mention removal

### Phase 9: Clean Up Configuration

- [ ] Edit `prompt-bench.toml`:
  - Remove `[defaults.iterate]` section if present
- [ ] Verify config loads correctly for other commands

### Phase 10: Optional - Clean Up Session Files

- [ ] Decide whether to keep sessions/ directory
  - Option A: Delete all `prompt-bench/sessions/*.json` and `.csv` files
  - Option B: Archive to `docs/archived-sessions/` for reference
  - Option C: Leave as-is (gitignored, not in repo)

Recommended: **Delete** since they're gitignored and not needed

```bash
# If deleting:
rm -rf prompt-bench/sessions/*.json
rm -rf prompt-bench/sessions/*-costs.csv
```

### Phase 11: Verify Everything Still Works

- [ ] Run TypeScript type checking: `bun tsc --noEmit`
- [ ] Run test suite: `bun test`
- [ ] Run each remaining command manually:
  - `bun bench sync`
  - `bun bench run --template ecommerce-base --batch fixtures/images-batch.json`
  - `bun bench evaluate --label test-label`
  - `bun bench report --label test-label`
  - `bun bench improve` (new command)
- [ ] Verify no broken imports or missing dependencies

### Phase 12: Update Changelog

- [ ] Add entry to CHANGELOG.md (or create if doesn't exist):

```markdown
## [Version] - YYYY-MM-DD

### Removed
- **BREAKING**: Removed experimental `bun bench iterate` command
  - Evolutionary prompt optimization approach was complex, expensive, and not delivering value
  - Replaced by new `bun bench improve` command with diagnostic approach
  - Old implementation preserved in git history (commit: xxx)
  - Removed modules: evolution.ts, convergence.ts, state.ts, iteration-types.ts
  - Session files preserved in git history but removed from working directory

### Added
- New `bun bench improve` command for iterative template improvement
  - See docs/improve-command-guide.md for details
```

### Phase 13: Git Commit Strategy

Commit in logical chunks for easy revert if needed:

- [ ] Commit 1: "docs: remove iterate documentation"
  - Files: docs/prompt-iterate/, docs/iterate-command-refactor-plan.md, CLAUDE.md

- [ ] Commit 2: "test: remove iterate test files"
  - Files: __tests__/evolution.test.ts, __tests__/convergence.test.ts

- [ ] Commit 3: "refactor: remove iterate command"
  - Files: commands/iterate.ts, cli.ts

- [ ] Commit 4: "refactor: remove evolutionary system core modules"
  - Files: core/evolution.ts, core/convergence.ts, core/state.ts, core/iteration-types.ts, core/index.ts

- [ ] Commit 5: "refactor: clean up insights.ts iterate dependencies"
  - Files: commands/insights.ts

- [ ] Commit 6: "chore: remove iterate session files"
  - Files: prompt-bench/sessions/* (if deleting)

- [ ] Commit 7: "docs: update changelog for iterate removal"
  - Files: CHANGELOG.md

## Risk Assessment

### Low Risk
- Deleting core modules (evolution, convergence, state, iteration-types)
  - Only used by iterate command
  - No external dependencies found

### Medium Risk
- Cleaning up insights.ts
  - Verify `generateStructuredInsights` not used elsewhere
  - Check if improve command needs any insights functions

### Minimal Risk
- Documentation and test deletions
  - No runtime impact
  - Can be recovered from git

## Rollback Plan

If issues discovered after cleanup:

1. **Find the commit before cleanup**: `git log --oneline`
2. **Revert specific commits**: `git revert <commit-hash>`
3. **Or checkout specific files**: `git checkout <commit-hash> -- path/to/file.ts`
4. **Full reset** (last resort): `git reset --hard <commit-hash>`

All deleted code is preserved in git history permanently.

## Acceptance Criteria

- [ ] All TypeScript compilation passes with no errors
- [ ] All tests pass (no broken imports or missing dependencies)
- [ ] `bun bench --help` shows correct commands (no iterate)
- [ ] `bun bench improve` works correctly
- [ ] All other commands (sync, run, evaluate, report, compare, test) still work
- [ ] No references to iterate in documentation
- [ ] No dead imports from deleted modules
- [ ] Git history preserves all deleted code
- [ ] Changelog documents the removal

## Estimated Impact

**Lines of Code Removed**: ~2,000+ lines
**Files Deleted**: 8-10 files
**Test Files Deleted**: 3 files
**Documentation Deleted**: 1 directory, 2-3 files

**Benefits**:
- Reduced maintenance burden
- Clearer codebase focus
- Less user confusion
- Faster CI/CD (fewer tests)
- Smaller bundle size

**Time Estimate**: 1-2 hours for full cleanup and verification

## Notes

- The evolutionary iterate approach was an interesting experiment but didn't deliver practical value
- The new improve command is simpler, cheaper, and more aligned with actual user needs
- All work is preserved in git history and can be restored if ever needed
- This cleanup makes the codebase easier to maintain and understand
