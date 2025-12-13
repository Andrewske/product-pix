# Fix Database Function Return Types

## Files to Modify
- `src/lib/db/contacts.ts` (2 violations)
- `src/lib/stripe/webhook-handlers.ts` (6 violations)

## Implementation Details

Add explicit return types to database query functions and webhook handlers. These are primarily async functions that perform side effects.

### Common Pattern
Most of these functions are async operations that either:
1. Perform side effects and return nothing → `Promise<void>`
2. Use Result type pattern → `Promise<Result<void>>` or `Promise<Result<T>>`
3. Return data → `Promise<T>` where T is the data type

### Example Transformations

**Void-returning handlers:**
```typescript
// Before
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  // ... perform operations
}

// After
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.userId
  // ... perform operations
}
```

**Result-returning functions:**
```typescript
// Before
async function createContact(data: ContactData) {
  return ok({ id: insertedId })
}

// After
async function createContact(data: ContactData): Promise<Result<{ id: string }>> {
  return ok({ id: insertedId })
}
```

### Implementation Steps

1. **Read `src/lib/db/contacts.ts`**
   - Identify the 2 functions missing return types
   - Check if they use Result type pattern (import from prompt-bench/core)
   - Add appropriate return types

2. **Read `src/lib/stripe/webhook-handlers.ts`**
   - Identify all 6 webhook handler functions
   - Determine if they return void or have return values
   - Add `Promise<void>` or appropriate type

3. **Verify consistency**
   - Ensure all similar functions have consistent type patterns
   - If using Result type, ensure proper error handling is typed

4. **Run validation**
   - `bun lint` to verify violation count
   - `bun typecheck` to ensure no type errors

## Acceptance Criteria
- [ ] All 2 violations in `contacts.ts` fixed
- [ ] All 6 violations in `webhook-handlers.ts` fixed
- [ ] Return types match actual return statements
- [ ] Result type usage is consistent (if applicable)
- [ ] Async functions properly typed as `Promise<T>`
- [ ] `bun lint` shows violations reduced by ~8
- [ ] `bun typecheck` passes
- [ ] `bun test` passes

## Expected Progression
Violations: ~46 → ~38

## Dependencies
- Task 01 (ESLint configuration must be updated first)

## Notes
- Check for Result type imports: `import { ok, err, Result } from '@bench/core'`
- Webhook handlers typically don't return values (void pattern)
- Database functions may return inserted IDs or query results
