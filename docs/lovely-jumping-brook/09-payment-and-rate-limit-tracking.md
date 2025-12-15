# Payment and Rate Limit Event Tracking

## Files to Modify/Create
- `src/lib/stripe/webhook-handlers.ts` (modify)
- `src/app/api/generate/route.ts` (modify)
- `src/lib/stripe/__tests__/webhook-handlers.test.ts` (modify)
- `src/app/api/generate/__tests__/route.test.ts` (modify)

## Implementation Details

### Task 3.4: Track Credit Purchase Events (Server-Side Queue)

Modify `src/lib/stripe/webhook-handlers.ts`:

**Import:**
```typescript
import { trackServerEvent } from '@/lib/analytics/server';
```

**Events to Add (using trackServerEvent from queue):**

1. **credits_purchased** - On payment_intent.succeeded
   - Properties: pack_id, credits, amount_cents, payment_intent_id

2. **subscription_started** - On subscription activated
   - Properties: tier, credits

3. **subscription_cancelled** - On subscription canceled
   - Properties: tier

**Why Queue Pattern:**
Webhooks are critical path. Event queue completely decouples analytics from payment processing. Even if PostHog is down, credits are granted correctly.

**Example:**
```typescript
trackServerEvent(userId, {
  event: 'credits_purchased',
  properties: {
    pack_id: packId,
    credits: creditAmount,
    amount_cents: amountCents,
    payment_intent_id: paymentIntent.id,
  }
});
```

### Task 3.5: Track Rate Limit Events with User Context

Modify `src/app/api/generate/route.ts` and other rate-limited endpoints:

**Event:** rate_limit_hit - When rate limit exceeded

**Properties:**
- endpoint: string
- retry_after: number
- user_id: string
- user_tier: string
- ip_hash: string (hashed for privacy)

**Implementation:**
```typescript
import crypto from 'crypto';
import { trackServerEvent } from '@/lib/analytics/server';

// When rate limit hit
const ipHash = crypto
  .createHash('sha256')
  .update(request.headers.get('x-forwarded-for') || '')
  .digest('hex');

trackServerEvent(userId, {
  event: 'rate_limit_hit',
  properties: {
    endpoint: '/api/generate',
    retry_after: 60,
    user_id: userId,
    user_tier: user.tier,
    ip_hash: ipHash,
  }
});
```

## Acceptance Criteria
- Payment events tracked via queue (non-blocking)
- Events added to queue, not blocking webhook response
- Rate limit hits tracked with user context
- IP addresses hashed for privacy
- User tier included in rate limit events

## Tests Required

Update `src/lib/stripe/__tests__/webhook-handlers.test.ts`:
- Test: credits_purchased tracked on payment success
- Test: Events added to queue (non-blocking)
- Test: subscription_started tracked on activation
- Test: subscription_cancelled tracked on cancel

Update `src/app/api/generate/__tests__/route.test.ts`:
- Test: rate_limit_hit tracked when rate limit exceeded
- Test: Event includes user_id, tier, hashed IP

## Dependencies
- Task 04 (analytics utilities with queue) must be complete
