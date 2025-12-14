# Write Unit Tests

## Files to Modify/Create
- `src/lib/errors/__tests__/error-classes.test.ts` (new)
- `src/lib/errors/__tests__/schemas.test.ts` (new)
- `src/lib/request/__tests__/context.test.ts` (new)
- `src/lib/logging/__tests__/index.test.ts` (modify - update existing)
- `src/lib/posthog/__tests__/sanitize.test.ts` (new)
- `src/lib/observability/__tests__/capture-error.test.ts` (new)

## Implementation Details

### Error Classes Tests

Test Zod validation, defaults, error code generation:

```typescript
describe('PaymentError', () => {
  it('validates required fields', () => {
    expect(() => new PaymentError('test', {})).toThrow(); // Missing amount
  });

  it('sets default severity to critical', () => {
    const error = new PaymentError('test', { amount: 100 });
    expect(error.severity).toBe('critical');
  });

  it('allows severity override', () => {
    const error = new PaymentError('test', { amount: 100, severity: 'high' });
    expect(error.severity).toBe('high');
  });

  it('generates error code from message', () => {
    const error = new PaymentError('Payment failed', { amount: 100 });
    expect(error.errorCode).toBe('PAYMENT_PAYMENT_FAILED');
  });
});
```

### Schema Tests

Test Zod schema validation and defaults:

```typescript
describe('PaymentErrorContextSchema', () => {
  it('requires amount field', () => {
    expect(() => PaymentErrorContextSchema.parse({})).toThrow();
  });

  it('sets default currency to usd', () => {
    const result = PaymentErrorContextSchema.parse({ amount: 100 });
    expect(result.currency).toBe('usd');
  });
});
```

### Request Context Tests

Test AsyncLocalStorage behavior:

```typescript
describe('requestContext', () => {
  it('returns undefined outside context', () => {
    expect(getRequestContext()).toBeUndefined();
  });

  it('returns context inside run()', () => {
    requestContext.run({ requestId: 'test-id' }, () => {
      expect(getRequestContext()?.requestId).toBe('test-id');
    });
  });

  it('setUserId updates context', () => {
    requestContext.run({ requestId: 'test-id' }, () => {
      setUserId('user-123');
      expect(getRequestContext()?.userId).toBe('user-123');
    });
  });
});
```

### Logger Tests

Update existing tests to verify context injection:

```typescript
it('includes requestId from context', () => {
  requestContext.run({ requestId: 'req-123' }, () => {
    logger.error('test');
    const output = JSON.parse(stderrSpy.mock.calls[0][0]);
    expect(output.requestId).toBe('req-123');
  });
});
```

### Sanitization Tests

Test PII removal:

```typescript
describe('sanitizeForPostHog', () => {
  it('removes email fields', () => {
    const result = sanitizeForPostHog({ email: 'test@example.com' });
    expect(result.email).toBeUndefined();
  });

  it('keeps safe fields like amount', () => {
    const result = sanitizeForPostHog({ amount: 100 });
    expect(result.amount).toBe(100);
  });

  it('redacts email in string values', () => {
    const result = sanitizeForPostHog({ userId: 'user test@example.com' });
    expect(result.userId).toBe('user [EMAIL]');
  });
});
```

### Capture Error Tests

Test three-tier fallback:

```typescript
describe('captureError', () => {
  it('always calls logger.error', async () => {
    const spy = spyOn(logger, 'error');
    await captureError(new PaymentError('test', { amount: 100 }));
    expect(spy).toHaveBeenCalled();
  });

  it('saves critical errors to database', async () => {
    const spy = spyOn(dbModule, 'saveCriticalError');
    await captureError(new PaymentError('test', { amount: 100 }));
    expect(spy).toHaveBeenCalled();
  });

  it('queues all errors to PostHog', async () => {
    const spy = spyOn(queueModule, 'enqueuePostHogEvent');
    await captureError(new ValidationError('test', { field: 'email' }));
    expect(spy).toHaveBeenCalled();
  });
});
```

**Follow existing test patterns:**
- Use Bun test (`describe`, `it`, `expect`, `beforeEach`)
- Mock with `mock()` and `mock.module()`
- No custom matchers - native Bun only
- Target 70-80% coverage

## Acceptance Criteria
- [ ] All 6 test files created/updated
- [ ] Error class validation tests pass
- [ ] Schema validation tests pass
- [ ] AsyncLocalStorage tests pass
- [ ] Logger context injection tests pass
- [ ] PII sanitization tests pass
- [ ] Capture error three-tier tests pass
- [ ] All tests follow Bun test patterns
- [ ] 70-80% coverage achieved

## Dependencies
- All core infrastructure tasks (02-08)
