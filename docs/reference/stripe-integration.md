# Stripe Integration Reference

Consolidated guide for Stripe payments implementation in ProductPix.

## Core Philosophy

**Single source of truth**: Use one `syncStripeDataToKV(customerId)` function that syncs all Stripe data to your KV store. This avoids the "split-brain" problem where Stripe's state differs from your app's state.

**Key principle**: Customer creation BEFORE checkout (not after). This prevents race conditions and webhook processing failures.

## Critical Implementation Pattern

### 1. Checkout Flow

```typescript
// ALWAYS create customer first, store in KV, then create checkout
const stripeCustomerId = await kv.get(`stripe:user:${userId}`);
if (!stripeCustomerId) {
  const newCustomer = await stripe.customers.create({
    email: user.email,
    metadata: { userId: user.id }, // CRITICAL for webhooks
  });
  await kv.set(`stripe:user:${userId}`, newCustomer.id);
}

const checkout = await stripe.checkout.sessions.create({
  customer: stripeCustomerId, // Always include this
  success_url: "https://productpix.app/success",
  // ...
});
```

### 2. Single Sync Function

```typescript
export async function syncStripeDataToKV(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 1,
    status: "all",
    expand: ["data.default_payment_method"],
  });

  const subData = {
    subscriptionId: subscription.id,
    status: subscription.status,
    priceId: subscription.items.data[0].price.id,
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    // ... store everything needed
  };

  await kv.set(`stripe:customer:${customerId}`, subData);
  return subData;
}
```

### 3. Success Route

```typescript
// User redirects here after checkout
export async function GET(req: Request) {
  const user = auth(req);
  const stripeCustomerId = await kv.get(`stripe:user:${user.id}`);

  // Call sync BEFORE showing success page (prevents race condition)
  await syncStripeDataToKV(stripeCustomerId);
  return redirect("/");
}
```

### 4. Webhook Handler

```typescript
export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature");

  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  // Return 200 immediately, process async
  waitUntil(processEvent(event));
  return NextResponse.json({ received: true });
}

async function processEvent(event: Stripe.Event) {
  if (!allowedEvents.includes(event.type)) return;

  const { customer: customerId } = event.data.object;
  return await syncStripeDataToKV(customerId); // Single function
}
```

## ProductPix-Specific Setup

### Environment Variables

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PACK_50=price_...      # $10 → 50 credits
STRIPE_PRICE_PACK_200=price_...     # $30 → 200 credits
STRIPE_PRICE_PACK_500=price_...     # $60 → 500 credits
STRIPE_PRICE_PRO_MONTHLY=price_...  # $20/mo → 200 credits
STRIPE_PRICE_BUSINESS_MONTHLY=price_... # $50/mo → 600 credits
```

### Critical Webhook Events

Track only these events (don't over-subscribe):
```typescript
const allowedEvents = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
];
```

### Credit Transaction Pattern

**For credit packs** (one-time purchases):
- Metadata goes on `payment_intent_data` (not session)
- Use `INSERT ... ON CONFLICT DO NOTHING` for race-safe credit granting
- Idempotency key: `pi_${paymentIntentId}`

**For subscriptions**:
- Metadata goes on `subscription_data.metadata`
- Credits granted on `invoice.paid` events (not subscription.created)
- Renewal credits = new transaction, not balance update

### Database Atomicity

```sql
-- Use database-level uniqueness + application retry pattern
ALTER TABLE credit_transactions
ADD CONSTRAINT unique_payment_intent
UNIQUE (payment_intent_id);

-- Then in code:
INSERT INTO credit_transactions (user_id, amount, payment_intent_id)
VALUES ($1, $2, $3)
ON CONFLICT (payment_intent_id) DO NOTHING;
```

## Critical Settings

### Enable in Stripe Dashboard

1. **Customer Portal**: Settings → Billing → Customer portal
   - Enable: Cancel subscriptions, Update payment methods
   - Return URL: `https://productpix.app/settings/billing`

2. **Limit customers to one subscription**:
   - Prevents race conditions from double-checkout
   - Only way to prevent duplicate subscriptions

3. **DISABLE Cash App Pay**:
   - Over 90% of cancelled transactions use Cash App Pay
   - Likely fraud vector

### Local Development

```bash
# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy webhook signing secret to .env.local
# (printed by stripe listen command)
```

## Common Gotchas

1. **Customer creation timing**: Create BEFORE checkout session (not in webhook)
2. **Metadata placement**: `payment_intent_data.metadata` for one-time, `subscription_data.metadata` for recurring
3. **Webhook signature**: Must use raw request body (disable body parser in Next.js Pages Router)
4. **Event order**: Not guaranteed - design for idempotency with hash keys
5. **KV caching**: Long TTL (24h) for customer IDs, short TTL (5min) for subscription state
6. **Split-brain prevention**: Single sync function called from both success route and webhooks

## Testing

**Test cards**:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires auth: `4000 0025 0000 3155`

**Trigger webhooks**:
```bash
stripe trigger invoice.payment_succeeded
stripe trigger customer.subscription.deleted
```

## References

- Full implementation details: See `ai-learnings.md` → "Stripe Payments Integration"
- Original philosophy article: `docs/archive/notes-on-stripe.md`
- ProductPix setup details: `docs/archive/stripe-setup.md`
