# Phase 8: Verification

## Overview
Verify that the reorganization was successful and all functionality works correctly.

## Tasks

### 8.1 TypeScript Compilation Check

```bash
bun run tsc --noEmit
```

**Expected**: No errors. All imports should resolve correctly.

**If errors occur**:
- Check for missing `@bench/*` imports
- Verify tsconfig.json has the correct paths configuration
- Look for typos in import paths

### 8.2 Run Unit Tests

```bash
bun test
```

**Expected**: All tests pass.

**If tests fail**:
- Check jest.config.ts has correct roots and moduleNameMapper
- Verify test file imports are updated to use `@bench/*`
- Check that fixture paths in tests are updated

### 8.3 Test CLI Commands

#### Sync Command
```bash
bun bench sync
```

**Expected**: Templates sync successfully to database.

#### Run Command (Dry Run)
```bash
bun bench run --template ecommerce-base --batch prompt-bench/fixtures/products-mix.json --dry-run
```

**Expected**: Dry run completes, shows what would be generated.

#### Progress Command
```bash
bun bench progress --label <existing-batch-label>
```

**Expected**: Shows batch progress (or "no batch found" if no batches exist).

### 8.4 Lint Check

```bash
bun lint
```

**Expected**: No new lint errors introduced.

### 8.5 Build Check

```bash
bun build
```

**Expected**: Production build succeeds. The prompt-bench code shouldn't affect the Next.js build since it's not imported by the main app.

### 8.6 Verify No Broken Imports

Search for any remaining old imports:

```bash
# Should return no results
grep -r "@/lib/prompts" src/ scripts/ prompt-bench/ --include="*.ts"

# Should return no results
grep -r "from ['\"]\.\./" prompt-bench/ --include="*.ts" | grep -v "node_modules"
```

### 8.7 Verify Old Directories Removed

```bash
# All should fail with "No such file or directory"
ls src/lib/prompts/ 2>&1 | grep -q "No such file" && echo "✓ src/lib/prompts/ removed"
ls scripts/commands/ 2>&1 | grep -q "No such file" && echo "✓ scripts/commands/ removed"
ls tests/fixtures/ 2>&1 | grep -q "No such file" && echo "✓ tests/fixtures/ removed"
```

### 8.8 Verify New Structure

```bash
# Verify all expected directories exist
ls prompt-bench/
# Should show: cli.ts, commands/, core/, templates/, db/, __tests__/, fixtures/, index.ts

ls prompt-bench/core/
# Should show: types.ts, errors.ts, compiler.ts, evaluator.ts, statistics.ts, orchestrator.ts, source-image.ts

ls prompt-bench/commands/
# Should show: run.ts, evaluate.ts, compare.ts, report.ts, sync.ts, test.ts, progress.ts, insights.ts, shared.ts
```

## Verification Checklist

- [ ] `bun run tsc --noEmit` passes
- [ ] `bun test` passes (all tests)
- [ ] `bun bench sync` works
- [ ] `bun bench run --dry-run` works
- [ ] `bun lint` passes
- [ ] `bun build` succeeds
- [ ] No old `@/lib/prompts` imports remain
- [ ] Old directories are removed
- [ ] New structure is complete

## Troubleshooting

### "Cannot find module '@bench/...'"
- Check tsconfig.json paths configuration
- Ensure the path ends with `/*` (e.g., `"@bench/*": ["./prompt-bench/*"]`)
- Run `bun run tsc --noEmit` to see specific errors

### Jest tests fail with module resolution
- Check jest.config.ts moduleNameMapper
- Ensure roots includes `'<rootDir>/prompt-bench'`

### CLI command fails
- Verify package.json has `"bench": "tsx prompt-bench/cli.ts"`
- Check that cli.ts imports are correct

## Success Criteria

All verification steps pass. The prompt-bench framework is now:
1. Isolated in its own `prompt-bench/` directory
2. Uses `@bench/*` path alias for internal imports
3. Still imports shared infrastructure from `@/lib/` (r2, supabase, ai)
4. All tests pass
5. CLI commands work
6. Documentation is updated

## Post-Completion

After successful verification:
1. Commit the changes with a descriptive message
2. Update any CI/CD configurations if needed
3. Notify team members of the new structure
