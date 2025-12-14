# Migrate Critical API Routes to Use Error Classes

## Files to Modify/Create
- `src/app/api/generate/route.ts` (modify)
- `src/app/api/webhooks/stripe/route.ts` (modify)
- `src/app/api/refunds/image/[id]/approve/route.ts` (modify)
- `src/app/api/refunds/cash/[id]/approve/route.ts` (modify)

## Implementation Details

### Migration Pattern

**Current:**
```typescript
catch (error) {
  console.error('Error:', error);
  return NextResponse.json({ error: 'Failed' }, { status: 500 });
}
```

**New:**
```typescript
import { captureError } from '@/lib/observability/capture-error';
import { GenerationError } from '@/lib/errors/error-classes';

catch (error) {
  const generationError = new GenerationError(
    'Image generation failed',
    {
      severity: creditsConsumed ? 'critical' : 'high',
      templateSlug,
      creditsConsumed,
      userId: user.id,
      jobId: job?.id,
      creditAmount: 100,
      retryable: false,
    }
  );

  await captureError(generationError, { route: '/api/generate' });

  return NextResponse.json(
    { error: 'Generation failed', jobId: job?.id },
    { status: 500 }
  );
}
```

### Critical Routes

1. **src/app/api/generate/route.ts** → `GenerationError`
   - Severity: 'critical' if creditsConsumed, 'high' otherwise
   - Context: templateSlug, creditsConsumed, userId, jobId, creditAmount, retryable

2. **src/app/api/webhooks/stripe/route.ts** → `PaymentError`
   - Severity: 'critical'
   - Context: amount, currency, paymentIntentId, stripeErrorCode, userId

3. **src/app/api/refunds/image/[id]/approve/route.ts** → `CreditError`
   - Severity: 'critical'
   - Context: amount, operation: 'refund', balanceBefore, balanceAfter, userId

4. **src/app/api/refunds/cash/[id]/approve/route.ts** → `CreditError`
   - Severity: 'critical'
   - Context: amount, operation: 'refund', balanceBefore, balanceAfter, userId

**Keep existing `logger.error()` calls** - they complement PostHog tracking.

## Acceptance Criteria
- [ ] All 4 critical routes migrated
- [ ] Appropriate error classes used per domain
- [ ] Severity levels set correctly
- [ ] Required context fields provided
- [ ] captureError() called with route option
- [ ] User-facing error messages preserved
- [ ] Existing logger.error() calls kept

## Dependencies
- Task 02 (error classes)
- Task 08 (captureError handler)
