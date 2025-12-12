# Delete Proxy Files and Cleanup

## Files to Delete
- `proxy.ts` (delete)
- `src/proxy.ts` (delete)
- `src/__tests__/middleware.test.ts` (delete)

## CRITICAL: Prerequisites
**DO NOT execute this task until ALL previous tasks are complete and verified.**

## Implementation Details

### 4.1: Verify Auth Coverage

Run verification commands BEFORE any deletions:

```bash
# Check all protected pages have requireAuth
grep -r "requireAuth" src/app/dashboard/page.tsx src/app/generate/page.tsx src/app/settings/page.tsx src/app/batch/page.tsx src/app/batch/new/page.tsx

# Expected: All 5 files should match

# Run tests to ensure nothing broke
bun test
```

**STOP if verification fails.** Fix issues in previous tasks first.

---

### 4.2: Delete Root Proxy

```bash
rm proxy.ts
```

---

### 4.3: Delete Admin Proxy

First verify admin routes still use `requireAdmin`:

```bash
grep -r "requireAdmin" src/app/admin/
```

Then delete:

```bash
rm src/proxy.ts
```

---

### 4.4: Delete Orphaned Middleware Test

**Reason:** Imports `@/middleware` which doesn't exist (orphaned from old architecture).

```bash
rm src/__tests__/middleware.test.ts
```

---

### 4.5: Final Verification

```bash
# All tests still pass
bun test

# TypeScript compiles
bun run tsc --noEmit

# No references to deleted files
grep -r "from.*proxy" src/ --exclude-dir=node_modules
grep -r "from.*middleware" src/ --exclude-dir=node_modules
```

## Acceptance Criteria
- [ ] All 3 files deleted
- [ ] No imports reference deleted files
- [ ] All tests pass
- [ ] TypeScript compiles without errors

## Dependencies
- Task 01: Convert /generate page (MUST complete first)
- Task 02: Convert /batch/new page (MUST complete first)
- Task 03: Standardize protected pages (MUST complete first)

## Rollback Strategy

If issues arise after deletion:

```bash
git restore proxy.ts src/proxy.ts src/__tests__/middleware.test.ts
```

Pages still have explicit auth (defense in depth), so investigate before retrying.
