# Verification and Testing

## Purpose

Verify all 59 linting issues are resolved and that the implementation is production-ready.

## Files to Verify
All files modified in previous tasks (no new modifications in this task).

## Verification Steps

### Step 1: Linting Verification
```bash
bun run lint
```

**Expected output:**
```
✓ No ESLint warnings or errors
```

**Success criteria:**
- 0 errors
- 0 warnings
- All 59 original issues resolved:
  - 39 console.error violations fixed ✓
  - 16 unused error variable warnings fixed ✓
  - 3 Jest require-imports errors fixed ✓
  - 1 TypeScript any error fixed ✓

**If linting fails:**
- Review error output
- Identify remaining violations
- Fix issues before proceeding

### Step 2: Type Checking
```bash
bunx tsc --noEmit
```

**Expected output:**
```
No type errors found
```

**Success criteria:**
- No TypeScript compilation errors
- Type inference works correctly for all modified files

**If type checking fails:**
- Review type errors
- Ensure proper typing in catch blocks
- Verify ProductPixError context types are correct

### Step 3: Test Suite
```bash
bun test
```

**Expected output:**
```
All tests pass
```

**Success criteria:**
- All existing tests pass
- Migrated Bun test passes: `src/components/admin/__tests__/user-timeline.test.tsx`
- No test failures from refactored code

**If tests fail:**
- Check if async/await changes broke timing
- Verify mock implementations in migrated test
- Ensure error handling changes don't break test assertions

### Step 4: Manual Smoke Testing

**4.1 Verify Structured Logging:**
```bash
# Trigger an error condition in development
# Check logs for structured JSON output
```

**Expected:**
- Logs contain JSON with `requestId`, `timestamp`, `level`, `message`, `context`
- Error context includes original error messages
- No plain console.error output in lib/API code

**4.2 Verify Error Capture (if observability enabled):**
- Trigger a critical error (e.g., refund processing)
- Check database for critical error entry
- Check PostHog for error event (if configured)

**Success criteria:**
- Three-tier capture works for critical errors
- Database stores full context including stack traces
- PostHog receives sanitized error events

### Step 5: Code Review Checklist

- [ ] All console.error calls removed from lib/API code
- [ ] All catch blocks preserve original error context
- [ ] Logger imports added to all modified files
- [ ] Error classes imported where needed
- [ ] Async functions properly awaited
- [ ] Context objects include useful debugging info
- [ ] No Jest APIs remain in test files
- [ ] No `any` types in production code

## Acceptance Criteria

**Must pass ALL of the following:**
- [ ] `bun run lint` returns 0 errors, 0 warnings
- [ ] `bunx tsc --noEmit` returns no type errors
- [ ] `bun test` all tests pass
- [ ] Structured logs contain proper JSON format
- [ ] Error context includes original error messages
- [ ] Critical errors saved to database (for high/critical severity)
- [ ] Code review checklist complete

## Rollback Plan

If verification fails and issues can't be quickly resolved:

1. **Identify the problem scope:**
   - Single file issue → Fix that file
   - Pattern issue → Fix all instances of the pattern
   - Infrastructure issue → Revert entire change

2. **Revert if necessary:**
   ```bash
   git reset --hard HEAD~1  # If committed
   git restore .            # If uncommitted
   ```

3. **Document the issue:**
   - Add to project TODO.md
   - Note what failed and why
   - Plan resolution approach

## Next Steps After Verification

Once all checks pass:

1. **Commit the changes:**
   ```bash
   git add .
   git commit -m "fix: resolve 59 linting issues with centralized logging

   - Migrate 39 console.error calls to structured logging
   - Fix 23 catch blocks to preserve error context
   - Migrate Jest test to Bun framework
   - Remove TypeScript any type annotation

   Implements Pattern A (logger.error) for simple queries
   Implements Pattern B (ProductPixError + captureError) for critical operations
   Enables three-tier observability: Vercel logs → Database → PostHog"
   ```

2. **Update documentation:**
   - Add entry to `ai-learnings.md` about the logging patterns
   - Document the two-pattern approach for future reference

3. **Optional: Create PR:**
   ```bash
   git checkout -b fix/linting-issues
   git push -u origin fix/linting-issues
   gh pr create --title "Fix 59 linting issues with centralized logging"
   ```

## Estimated Time
30 minutes
