# Migrate console.error to Full Observability (Pattern B)

## Files to Modify
- `src/lib/db/refunds.ts` (14 instances) - **CRITICAL: highest priority**
- `src/lib/stripe/checkout-actions.ts` (2 instances)
- `src/lib/stripe/fetch-prices.ts` (1 instance)
- `src/lib/stripe/sync.ts` (1 instance)
- `src/lib/pricing/actions.ts` (1 instance)
- `src/lib/pricing/config.ts` (1 instance)
- `src/lib/toast/index.ts` (1 instance) - **SPECIAL CASE**

**Total:** 21 console.error calls in critical business logic (refunds, payments, pricing)

## Implementation Details

**Rule violation:** `no-console` - only `console.warn()` and `console.info()` allowed in lib/API code

**Pattern B** is for critical errors that need **three-tier observability**:
1. **Vercel logs** (structured JSON)
2. **Database** (critical severity only, full context + PII)
3. **PostHog** (analytics, sanitized/no PII)

### Migration Pattern:

**BEFORE:**
```typescript
if (fetchError || !refundRequest) {
  console.error('Error fetching refund request:', fetchError);
  return false;
}
```

**AFTER:**
```typescript
import { createCreditError } from '@/lib/errors/error-classes';
import { captureError } from '@/lib/observability/capture-error';
import { ErrorCodes } from '@/lib/errors/codes';

if (fetchError || !refundRequest) {
  const error = createCreditError(
    ErrorCodes.DATABASE_ERROR,
    'Failed to fetch refund request',
    {
      severity: 'high',
      refundId,
      dbError: fetchError?.message,
    }
  );
  await captureError(error);
  return false;
}
```

### Error Class Selection:

| File | Error Class | Typical Severity |
|------|-------------|------------------|
| refunds.ts | `createCreditError` | `high` or `critical` |
| stripe/*.ts | `createPaymentError` | `critical` |
| pricing/*.ts | `createPaymentError` or `createCreditError` | `medium` to `high` |

### Severity Guidelines:

- **critical**: Financial operations (refunds, payments), data loss risk
- **high**: Failed database writes, failed refund processing
- **medium**: Configuration errors, failed fetches that have fallbacks
- **low**: Non-blocking validation errors

## Implementation Steps

For each console.error:

1. **Add imports:**
   ```typescript
   import { createCreditError } from '@/lib/errors/error-classes';
   import { captureError } from '@/lib/observability/capture-error';
   import { ErrorCodes } from '@/lib/errors/codes';
   ```

2. **Create ProductPixError:**
   ```typescript
   const error = createCreditError(
     ErrorCodes.DATABASE_ERROR,  // Choose appropriate code
     'Human-readable error message',
     {
       severity: 'high',  // Choose appropriate severity
       // Add context: IDs, error details, relevant state
     }
   );
   ```

3. **Capture error:**
   ```typescript
   await captureError(error);
   ```

4. **Make function async if needed:**
   - If function isn't already async, add `async` keyword
   - Update return type to `Promise<T>`
   - Update call sites if necessary

## File-Specific Implementation

### refunds.ts (14 instances) - PRIORITY FILE

**Lines to fix:**
- Line 47: Create refund request failure
- Line 64: Get refund count failure
- Lines 85, 90: Approve refund validation/fetch failures
- Lines 107, 122, 129: Credit refund and image deletion failures
- Line 160: Pending refunds fetch failure
- Lines 191, 196, 211: Cash refund processing failures
- Lines 244, 256, 311: Cash refund queries and creation failures

**Pattern for each:**
1. Identify the error condition
2. Choose severity: `critical` for refund processing, `high` for queries
3. Add context: `refundId`, `userId`, `amount`, database error message
4. Make function async if not already
5. Call `await captureError(error)`

### stripe/checkout-actions.ts (2 instances)
- Severity: `critical` (payment flow)
- Context: `checkoutSessionId`, `userId`, `priceId`, Stripe error details

### stripe/fetch-prices.ts (1 instance)
- Severity: `medium` (configuration, has fallbacks)
- Context: Stripe error message, `priceIds` if applicable

### stripe/sync.ts (1 instance)
- Severity: `high` (sync failure impacts pricing)
- Context: Sync operation details, Stripe error

### pricing/actions.ts (1 instance)
- Severity: `medium` to `high` depending on operation
- Context: Pricing calculation details, user context

### pricing/config.ts (1 instance)
- Severity: `medium` (configuration validation)
- Context: Config validation error, invalid value

### toast/index.ts (1 instance) - SPECIAL CASE

**Current:**
```typescript
captureError(messageOrError).catch(console.error);
```

**Issue:** Meta-error - logging a failure in the observability system itself!

**Solution:** Use `logger.error()` as final fallback (writes directly to stderr):
```typescript
import { logger } from '@/lib/logging';

if (messageOrError instanceof ProductPixError) {
  captureError(messageOrError).catch((captureFailure) => {
    logger.error('OBSERVABILITY_FAILURE in toast handler', {
      originalError: messageOrError.name,
      captureError: captureFailure instanceof Error ? captureFailure.message : 'Unknown',
    });
  });
}
```

## Acceptance Criteria
- [ ] All 21 console.error calls replaced with structured error capture
- [ ] All files import necessary error classes and captureError
- [ ] Severity levels appropriate for each error type
- [ ] Context objects include debugging information (IDs, error messages)
- [ ] Async functions properly awaited at call sites
- [ ] No console.error violations: `bun run lint`
- [ ] All tests pass: `bun test`
- [ ] Critical errors appear in database when tested manually

## Dependencies
- `src/lib/errors/error-classes.ts` (already exists)
- `src/lib/errors/codes.ts` (already exists)
- `src/lib/observability/capture-error.ts` (already exists)
- No infrastructure changes needed

## Estimated Time
90 minutes
- refunds.ts: 45 min (14 instances, complex logic)
- Stripe files: 20 min (4 instances)
- Pricing files: 10 min (2 instances)
- toast.ts special case: 15 min
