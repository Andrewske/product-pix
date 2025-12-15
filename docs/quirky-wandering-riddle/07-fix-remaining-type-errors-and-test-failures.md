# Fix Remaining Type Errors and Test Failures

## Files to Modify/Create
- All test files with "as any" casts or type errors
- Any failing test files (contact form validation, error boundary logging)
- TypeScript configuration files if needed
- Test utility files if additional helpers needed

## Implementation Details

### Part 1: Identify All Issues

Run comprehensive checks to identify remaining problems:

```bash
# Check for TypeScript errors
bunx tsc --noEmit

# Check for "as any" casts in tests
grep -r "as any" src/**/__tests__/

# Run tests to identify failures
bun test

# Check Bun globals recognition
grep -r "Bun" src/**/__tests__/**/*.ts
```

### Part 2: Fix TypeScript Errors in Test Files

Address Bun globals not being recognized:
- Ensure proper TypeScript configuration for Bun test environment
- Add type declarations if needed
- Fix any missing type imports

### Part 3: Fix Test Failures

Address specific failing tests:
- Contact form validation tests
- Error boundary logging tests
- Any other failing test cases

### Part 4: Eliminate "as any" Casts

Replace all 100+ "as any" casts in test files with proper type-safe alternatives:
- Use type-safe helpers from @/lib/test-utils
- Create additional helper functions if needed
- Ensure all mock objects are properly typed

### Part 5: Fix Mock Type Mismatches

Update all test mock type mismatches:
- Use the type-safe helpers from @/lib/test-utils
- Ensure proper typing for Supabase mocks
- Fix any remaining type assertion issues

## Acceptance Criteria

1. **TypeScript Compilation**: `bunx tsc --noEmit` reports 0 errors
2. **Test Suite**: `bun test` shows all tests passing
3. **No "as any" Casts**: `grep -r "as any" src/**/__tests__/` returns 0 matches (except legitimate cases with comments)
4. **Type Safety Rules**: All CLAUDE.md FP and type-safety rules followed
5. **Bun Globals**: All Bun test globals properly recognized without type errors

## Dependencies

**REQUIRED:** Task 06 (Verification and Documentation) must be complete and all previous tasks (01-05) verified.

## Impact

- Eliminates all remaining type errors preventing clean compilation
- Ensures test suite reliability with proper type safety
- Establishes complete type-safe testing patterns
- Enables confident development without TypeScript warnings

## Final Checklist

- [ ] `bunx tsc --noEmit` → 0 errors
- [ ] `bun test` → All tests pass
- [ ] `grep -r "as any" src/**/__tests__/` → 0 matches
- [ ] Bun globals properly typed in test files
- [ ] Contact form validation tests pass
- [ ] Error boundary logging tests pass
- [ ] All type safety rules followed
- [ ] Ready for commit

## Suggested Commit Message

```
fix(tests): eliminate all type errors and test failures

- Fix Bun globals recognition in test files
- Replace all "as any" casts with type-safe alternatives
- Fix contact form validation and error boundary test failures
- Ensure TypeScript compiles cleanly with 0 errors
- All tests pass with proper type safety

Resolves remaining issues from verification phase
```