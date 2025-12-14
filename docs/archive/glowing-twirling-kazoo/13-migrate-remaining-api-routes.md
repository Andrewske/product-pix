# Migrate Remaining API Routes

## Files to Modify/Create
- `src/app/api/upload/presign/route.ts` (modify)
- `src/app/api/upload/confirm/route.ts` (modify)
- All other API routes with `console.error` (find via grep)

## Implementation Details

### Find All Routes

```bash
grep -r "console\.error" src/app/api/**/*.ts
```

Expected ~13 files total. Priority 1-4 are already done in Task 12.

### Migration Priority

**Priority 2 - Remaining routes:**
5. `src/app/api/upload/presign/route.ts` → Use appropriate error class (ValidationError or GenerationError)
6. `src/app/api/upload/confirm/route.ts` → Use appropriate error class
7. All other API routes with console.error

### Choose Error Class by Domain

- **Validation failures** → `ValidationError` (severity: 'low')
- **Rate limiting** → `RateLimitError` (severity: 'low')
- **Upload/generation** → `GenerationError` (severity: 'medium' if no credits lost)
- **Auth** → `AuthError` (severity: 'critical')
- **Payment** → `PaymentError` (severity: 'critical')
- **Credit operations** → `CreditError` (severity: 'critical')

### Keep Existing Logger Calls

Existing `logger.error()` calls should be preserved - they complement PostHog tracking by providing structured logs to Vercel.

## Acceptance Criteria
- [ ] All API routes with console.error migrated
- [ ] Appropriate error classes chosen by domain
- [ ] Severity levels match error impact
- [ ] Required context fields provided per error type
- [ ] captureError() called with route
- [ ] Existing logger.error() calls preserved

## Dependencies
- Task 02 (error classes)
- Task 08 (captureError handler)
- Task 12 (critical routes done - provides pattern)
