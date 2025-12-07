# Phase 6: Cleanup

## Overview
Remove the now-empty original directories after all files have been moved.

## Tasks

### 6.1 Remove src/lib/prompts/ Directory

This directory should now be empty after moving all files.

```bash
# Verify it's empty first
ls -la src/lib/prompts/

# If empty (or only contains empty subdirectories), remove it
rm -rf src/lib/prompts/
```

### 6.2 Remove scripts/commands/ Directory

This directory should now be empty after moving all command files.

```bash
# Verify it's empty first
ls -la scripts/commands/

# If empty, remove it
rm -rf scripts/commands/
```

### 6.3 Remove scripts/prompt-bench.ts

This file was moved to `prompt-bench/cli.ts`.

```bash
# Verify the file still exists (should have been moved, not copied)
ls scripts/prompt-bench.ts

# If it exists (wasn't moved properly), remove it
rm scripts/prompt-bench.ts
```

### 6.4 Remove tests/fixtures/ Directory

This directory should now be empty after moving fixtures.

```bash
# Verify it's empty first
ls -la tests/fixtures/

# If empty, remove it
rm -rf tests/fixtures/

# If tests/ directory is now empty, remove it too
rmdir tests/ 2>/dev/null || true
```

### 6.5 Keep scripts/ Directory

**DO NOT** remove the `scripts/` directory entirely. It still contains other utility scripts:

Files to keep in `scripts/`:
- `scripts/test-text-to-image.ts`
- `scripts/test-image-to-image.ts`
- `scripts/test-aspect-ratios.ts`
- `scripts/check-failed-tests.ts`
- `scripts/delete-failed-test.ts`
- `scripts/test-ai.ts`

Verify:
```bash
ls scripts/
# Should show remaining test-*.ts and utility scripts
```

### 6.6 Remove Old Barrel Export

If there was an `src/lib/prompts/index.ts` barrel file, it should have been removed with the directory. Verify:

```bash
# Should return "No such file or directory"
ls src/lib/prompts/index.ts
```

## Verification

After cleanup, verify the old paths no longer exist:

```bash
# All should return "No such file or directory"
ls src/lib/prompts/
ls scripts/commands/
ls tests/fixtures/

# scripts/ should still exist with other files
ls scripts/
```

Verify no broken imports:
```bash
# Search for any remaining imports from old paths
grep -r "@/lib/prompts" src/ scripts/ prompt-bench/
# Should return nothing

grep -r "from '\.\./\.\./prompts" prompt-bench/
# Should return nothing
```

## Dependencies
- Phases 1-5 must be complete
- All files must be successfully moved and imports updated

## Next Phase
Phase 7: Update Documentation
