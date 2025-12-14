# Fix Catch Blocks to Preserve Error Context

## Files to Modify
- `src/app/api/batch/[batchId]/cancel/route.ts` (2 catch blocks)
- `src/app/api/batch/[batchId]/route.ts` (1 catch block)
- `src/app/api/batch/parse-csv/route.ts` (1 catch block)
- `src/app/api/batch/poll-gemini/route.ts` (3 catch blocks)
- `src/app/api/generate/route.ts` (1 catch block)
- `src/app/api/refunds/cash/[id]/approve/route.ts` (1 catch block)
- `src/app/api/refunds/cash/eligibility/route.ts` (1 catch block)
- `src/app/api/refunds/cash/route.ts` (1 catch block)
- `src/app/api/refunds/image/[id]/approve/route.ts` (1 catch block)
- `src/app/api/refunds/image/route.ts` (2 catch blocks)
- `src/app/api/upload/confirm/route.ts` (1 catch block)
- `src/app/api/upload/presign/route.ts` (1 catch block)
- Plus 7 additional API route files with similar patterns

**Total:** 23 catch blocks across API routes

## Implementation Details

**Rule violation:** `@typescript-eslint/no-unused-vars` (16 warnings)

**Root Issue:** Error variables are caught but not used - we're **losing the original error context** when creating ProductPixErrors. This is a BUG, not just a linting issue.

### Current Pattern (BROKEN):
```typescript
} catch (error) {  // ← error caught but IGNORED!
  const creditError = createCreditError(
    ErrorCodes.CREDIT_REFUND_FAILED,
    'Image refund approval failed',
    { severity: 'critical' }  // ← Missing original error details!
  );
  await captureError(creditError);
  return NextResponse.json({ error: 'Failed' }, { status: 500 });
}
```

### Fixed Pattern (Preserves Context):
```typescript
} catch (error) {  // ← NOW being used properly!
  const creditError = createCreditError(
    ErrorCodes.CREDIT_REFUND_FAILED,
    'Image refund approval failed',
    {
      severity: 'critical',
      originalError: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }
  );
  await captureError(creditError);
  return NextResponse.json({ error: 'Failed' }, { status: 500 });
}
```

### Why This Matters:

**Without original error (current):**
- "Database error" ❌ (useless for debugging)
- "Stripe error" ❌ (which Stripe error?)
- "Validation error" ❌ (which field failed?)

**With original error (fixed):**
- "Database error: unique constraint violation on user_email" ✅
- "Stripe error: rate_limit_error - too many requests" ✅
- "Validation error: Invalid email format for user@domain" ✅

## Implementation Strategy

For each catch block:
1. Locate the `ProductPixError` creation (createCreditError, createGenerationError, createValidationError, etc.)
2. Add to the context object:
   ```typescript
   originalError: error instanceof Error ? error.message : String(error),
   stack: error instanceof Error ? error.stack : undefined,
   ```
3. Verify the error variable is now used (linting warning will disappear)

## Acceptance Criteria
- [ ] All 23 catch blocks updated to include `originalError` in context
- [ ] All catch blocks include `stack` when error is an Error instance
- [ ] No unused error variable warnings: `bun run lint`
- [ ] All tests pass: `bun test`
- [ ] Error messages in logs now include original error details

## Dependencies
None - these are independent fixes across different API routes.

## Estimated Time
45 minutes (2 min per catch block × 23 blocks)
