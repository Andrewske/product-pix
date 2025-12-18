# Audit Existing Usage

## Purpose

Before modifying the credit configuration structure, audit the codebase to find all existing references to the old config format. This ensures we don't miss any code paths that would break after the migration.

## Files to Audit

Search the entire codebase for references to:
- `creditsPerResolution` - Old config property name
- `getCreditsForResolution` - Function that will change signature
- `calculateBatchCredits` - Function that will be removed
- `creditEconomy.creditsPerResolution` - Direct config access

## Implementation Details

### 1. Search for Config Property References

```bash
# Find all references to old config structure
grep -r "creditsPerResolution" --include="*.ts" --include="*.tsx" src/
grep -r "creditsPerResolution" --include="*.ts" --include="*.tsx" prompt-bench/
```

**Expected locations:**
- `src/lib/pricing/pricing.config.ts` - Definition (will be replaced)
- `src/lib/pricing/credits.ts` - Usage in `getCreditsForResolution()`
- Any API routes that directly access config
- Any components that display credit costs

### 2. Search for Function Usage

```bash
# Find all calls to functions that will change
grep -r "getCreditsForResolution" --include="*.ts" --include="*.tsx" src/
grep -r "calculateBatchCredits" --include="*.ts" --include="*.tsx" src/
```

**Expected call sites:**
- `src/app/api/generate/route.ts` - Single generation endpoint
- `src/app/api/batch/route.ts` - Batch generation endpoint
- Any test files that verify credit calculations
- Any UI components that preview costs

### 3. Document Findings

Create a checklist of all files that need updates:

```
Files requiring updates:
[ ] src/lib/pricing/pricing.config.ts - Replace config structure
[ ] src/lib/pricing/credits.ts - Update/remove functions
[ ] src/app/api/generate/route.ts - Update function calls
[ ] src/app/api/batch/route.ts - Update function calls
[ ] [Add any additional files found]
```

### 4. Verify Prompt Bench Isolation

The credit system is for the main app only. Verify prompt-bench uses separate pricing:

```bash
# Confirm prompt-bench doesn't depend on credit config
grep -r "creditEconomy" prompt-bench/
grep -r "getCreditsForResolution" prompt-bench/
```

**Expected result:** No matches (prompt-bench uses model pricing from TOML, not credit pricing)

## Acceptance Criteria

- [ ] All references to `creditsPerResolution` documented
- [ ] All calls to `getCreditsForResolution` documented
- [ ] All calls to `calculateBatchCredits` documented
- [ ] Confirmed prompt-bench doesn't use credit config
- [ ] Created checklist of files requiring updates
- [ ] No unexpected/undocumented usages found

## Dependencies

None - this is the foundation task before any implementation.

## Next Steps

After completing audit:
1. Review findings with checklist
2. Proceed to Task 01 if all usages are documented
3. If unexpected usages found, update plan to address them
