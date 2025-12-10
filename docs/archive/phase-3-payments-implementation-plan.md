# Phase 3: Payments & Credits Implementation Plan

## Overview

Implement Stripe integration for ProductPix with credit pack purchases and subscription tiers. Following the battle-tested Stripe philosophy from `docs/notes-on-stripe.md`: pre-create customers, single sync function, idempotent operations, Redis caching.

**Product Configuration:**
- Credit Packs: 50/$10, 200/$30, 500/$60
- Subscriptions: Pro ($20/mo, 200 credits), Business ($50/mo, 600 credits)
- Credit Policy: Credits never expire. Once paid, credits belong to user permanently.

## Architecture Decisions

### Decision 1: Single Sync Function Pattern
**Choice:** Implement `syncStripeDataToKV(customerId)` called from both webhook and `/success` route
**Rationale:** Prevents split-brain state, ensures consistency, follows proven pattern from notes-on-stripe.md

### Decision 2: Single Credit Pool (Simplified)
**Choice:** Use existing `credits` column for ALL credits (subscriptions and packs)
**Rationale:** Credits never expire once paid. Subscription credits and purchased credits behave identically. Keeps existing generation flow unchanged.

### Decision 3: Redis for Stripe State Cache
**Choice:** Cache Stripe customer/subscription data in existing Upstash Redis
**Rationale:** Fast reads, existing infrastructure, graceful fallback to Stripe API. Customer ID mapping uses longer TTL, subscription state uses shorter TTL for freshness.

### Decision 4: Existing Credit RPC Functions
**Choice:** Reuse existing `addCredits` RPC with payment-based idempotency keys
**Rationale:** Atomic operations with row locking already proven. No changes to generation flow or consume_credits needed.

### Decision 5: Stripe Customer Portal for Management
**Choice:** Use Stripe's hosted portal instead of custom subscription UI
**Rationale:** Production-ready, handles edge cases, PCI compliant, less code to maintain

### Decision 6: Race Condition Prevention
**Choice:** Use `INSERT ... ON CONFLICT DO NOTHING` for purchase records, only grant credits if insert succeeds
**Rationale:** Database-level atomicity prevents duplicate credit grants when webhook and /success route race.

### Decision 7: Credits Never Expire
**Choice:** Once credits are granted, they belong to the user permanently
**Rationale:** Simple mental model for users. Failed subscription payments simply don't grant new credits. Cancellation stops future credits but doesn't affect existing balance.

---

## Implementation Tasks

### Phase 1: Database & Infrastructure Setup

- [ ] Create Stripe tables migration
  - Files: `supabase/migrations/00020_create_stripe_tables.sql` (new)
  - Tests: Manual verification via `supabase db push`
  - Acceptance: Tables created with proper indexes, RLS enabled
  - Details:
    - Add `stripe_customer_id` column to `users` table (TEXT UNIQUE)
    - Create `stripe_subscriptions` table:
      ```sql
      CREATE TABLE stripe_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        stripe_subscription_id TEXT UNIQUE NOT NULL,
        stripe_customer_id TEXT NOT NULL,
        status TEXT NOT NULL, -- 'active', 'past_due', 'canceled', etc.
        price_id TEXT NOT NULL,
        tier TEXT NOT NULL, -- 'pro' or 'business'
        current_period_start TIMESTAMPTZ,
        current_period_end TIMESTAMPTZ,
        cancel_at_period_end BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      ```
    - Create `stripe_purchases` table with UNIQUE constraint for idempotency:
      ```sql
      CREATE TABLE stripe_purchases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        stripe_payment_intent_id TEXT UNIQUE NOT NULL, -- Prevents duplicate inserts
        stripe_customer_id TEXT NOT NULL,
        amount_cents INTEGER NOT NULL,
        credits_granted INTEGER NOT NULL,
        purchase_type TEXT NOT NULL, -- 'pack' or 'subscription_renewal'
        metadata JSONB, -- {packId, tier, periodStart, etc.}
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      ```
    - Create indexes on stripe_customer_id columns

- [ ] Add transaction types to enum
  - Files: `supabase/migrations/00020_create_stripe_tables.sql` (modify)
  - Tests: Enum values available in TypeScript types
  - Acceptance: ALTER TYPE succeeds, regenerate types
  - Details:
    ```sql
    ALTER TYPE transaction_type ADD VALUE 'pack_purchase';
    ALTER TYPE transaction_type ADD VALUE 'subscription_renewal';
    ALTER TYPE transaction_type ADD VALUE 'subscription_upgrade';
    ```

- [ ] Add Stripe dependencies
  - Files: `package.json` (modify)
  - Tests: `bun install` succeeds
  - Acceptance: stripe@latest installed
  - Details: `bun add stripe` (no client-side SDK needed - all server-side)

- [ ] Add Stripe environment variables
  - Files: `src/lib/env.ts` (modify), `.env.example` (modify)
  - Tests: Environment validation passes with all required vars
  - Acceptance: Zod schema validates all Stripe env vars
  - Details:
    - STRIPE_SECRET_KEY (required)
    - STRIPE_WEBHOOK_SECRET (required)
    - STRIPE_PRICE_PACK_50, STRIPE_PRICE_PACK_200, STRIPE_PRICE_PACK_500
    - STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_BUSINESS_MONTHLY

### Phase 2: Stripe Core Integration

- [ ] Create Stripe client
  - Files: `src/lib/stripe/client.ts` (new), `src/lib/stripe/index.ts` (new barrel export)
  - Tests: Client initializes without error
  - Acceptance: Stripe SDK initialized with latest API version
  - Details:
    ```typescript
    import Stripe from 'stripe';
    import { env } from '@/lib/env';

    export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    });
    ```

- [ ] Create product configuration
  - Files: `src/lib/stripe/products.ts` (new)
  - Tests: `src/lib/stripe/__tests__/products.test.ts` (new)
  - Acceptance: CREDIT_PACKS and SUBSCRIPTION_TIERS exported with correct pricing
  - Details:
    ```typescript
    export const CREDIT_PACKS = {
      pack_50: { credits: 50, priceCents: 1000, priceId: env.STRIPE_PRICE_PACK_50 },
      pack_200: { credits: 200, priceCents: 3000, priceId: env.STRIPE_PRICE_PACK_200 },
      pack_500: { credits: 500, priceCents: 6000, priceId: env.STRIPE_PRICE_PACK_500 },
    } as const;

    export const SUBSCRIPTION_TIERS = {
      pro: { credits: 200, priceCents: 2000, priceId: env.STRIPE_PRICE_PRO_MONTHLY },
      business: { credits: 600, priceCents: 5000, priceId: env.STRIPE_PRICE_BUSINESS_MONTHLY },
    } as const;
    ```

- [ ] Implement getOrCreateStripeCustomer function
  - Files: `src/lib/stripe/customer.ts` (new)
  - Tests: `src/lib/stripe/__tests__/customer.test.ts` (new)
  - Acceptance: Customer created BEFORE checkout (per notes-on-stripe.md pattern)
  - Details:
    ```typescript
    export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
      // 1. Check Redis cache first (long TTL - customer ID rarely changes)
      const cached = await redis.get(`stripe:user:${userId}`);
      if (cached) return cached;

      // 2. Check database
      const user = await getUserStripeCustomerId(userId);
      if (user?.stripe_customer_id) {
        await redis.set(`stripe:user:${userId}`, user.stripe_customer_id, { ex: 86400 }); // 24h
        return user.stripe_customer_id;
      }

      // 3. Create new customer with userId in metadata (CRITICAL for reverse lookup)
      const customer = await stripe.customers.create({
        email,
        metadata: { userId }, // DO NOT FORGET THIS
      });

      // 4. Store in DB and cache
      await updateUserStripeCustomerId(userId, customer.id);
      await redis.set(`stripe:user:${userId}`, customer.id, { ex: 86400 });

      return customer.id;
    }
    ```

- [ ] Implement syncStripeDataToKV function (CRITICAL)
  - Files: `src/lib/stripe/sync.ts` (new)
  - Tests: `src/lib/stripe/__tests__/sync.test.ts` (new)
  - Acceptance: Syncs subscription state, grants credits atomically with race protection
  - Details:
    ```typescript
    export async function syncStripeDataToKV(customerId: string): Promise<void> {
      // 1. Get userId from customer metadata (with fallback to DB lookup)
      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted) return;

      const userId = customer.metadata.userId ?? await getUserIdByStripeCustomerId(customerId);
      if (!userId) throw new Error(`No userId for customer ${customerId}`);

      // 2. Sync subscription state to Redis (short TTL for freshness)
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        limit: 1,
        status: 'all',
        expand: ['data.default_payment_method'],
      });

      const subData = subscriptions.data.length > 0
        ? formatSubscriptionData(subscriptions.data[0])
        : { status: 'none' };

      await redis.set(`stripe:customer:${customerId}`, JSON.stringify(subData), { ex: 300 }); // 5min

      // 3. Upsert subscription to DB if exists
      if (subscriptions.data.length > 0) {
        await upsertSubscription(userId, subscriptions.data[0]);
      }

      // Note: Credit grants handled separately via grantCreditsForPayment()
    }
    ```

- [ ] Implement grantCreditsForPayment function (race-safe)
  - Files: `src/lib/stripe/credits.ts` (new)
  - Tests: `src/lib/stripe/__tests__/credits.test.ts` (new)
  - Acceptance: Grants credits exactly once using database-level atomicity
  - Details:
    ```typescript
    export async function grantCreditsForPayment(params: {
      userId: string;
      paymentIntentId: string;
      customerId: string;
      credits: number;
      amountCents: number;
      purchaseType: 'pack' | 'subscription_renewal' | 'subscription_upgrade';
      metadata?: Record<string, unknown>;
    }): Promise<{ granted: boolean }> {
      // Use INSERT ... ON CONFLICT DO NOTHING for atomic idempotency
      // Only grant credits if the insert succeeded (returned a row)
      const result = await supabaseAdmin
        .from('stripe_purchases')
        .insert({
          user_id: params.userId,
          stripe_payment_intent_id: params.paymentIntentId,
          stripe_customer_id: params.customerId,
          amount_cents: params.amountCents,
          credits_granted: params.credits,
          purchase_type: params.purchaseType,
          metadata: params.metadata,
        })
        .select('id')
        .single();

      // If insert failed due to conflict, purchase already processed
      if (result.error?.code === '23505') { // unique_violation
        return { granted: false };
      }
      if (result.error) throw result.error;

      // Insert succeeded - this is a new purchase, grant credits
      // Idempotency key format: pi_{paymentIntentId} (PI IDs are globally unique)
      await addCredits({
        userId: params.userId,
        amount: params.credits,
        transactionType: params.purchaseType,
        idempotencyKey: `pi_${params.paymentIntentId}`,
        description: `${params.credits} credits from ${params.purchaseType}`,
      });

      return { granted: true };
    }
    ```

- [ ] Create checkout endpoint
  - Files: `src/app/api/stripe/checkout/route.ts` (new)
  - Tests: Integration test with Stripe test mode
  - Acceptance: Creates checkout sessions with metadata on PAYMENT INTENT (not just session)
  - Details:
    ```typescript
    // POST handler
    const schema = z.object({
      type: z.enum(['pack', 'subscription']),
      packId: z.enum(['pack_50', 'pack_200', 'pack_500']).optional(),
      tier: z.enum(['pro', 'business']).optional(),
    });

    // CRITICAL: Get or create customer BEFORE checkout
    const customerId = await getOrCreateStripeCustomer(user.id, user.email);

    // For packs: use payment_intent_data.metadata so PI has the data
    if (body.type === 'pack') {
      const pack = CREDIT_PACKS[body.packId];
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        line_items: [{ price: pack.priceId, quantity: 1 }],
        payment_intent_data: {
          metadata: { userId: user.id, packId: body.packId, credits: pack.credits },
        },
        success_url: `${baseUrl}/success`,
        cancel_url: `${baseUrl}/pricing`,
      });
    }

    // For subscriptions: metadata goes on subscription
    if (body.type === 'subscription') {
      const tier = SUBSCRIPTION_TIERS[body.tier];
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [{ price: tier.priceId, quantity: 1 }],
        subscription_data: {
          metadata: { userId: user.id, tier: body.tier, credits: tier.credits },
        },
        success_url: `${baseUrl}/success`,
        cancel_url: `${baseUrl}/pricing`,
      });
    }
    ```

- [ ] Create success route
  - Files: `src/app/success/page.tsx` (new)
  - Tests: Manual testing with Stripe checkout flow
  - Acceptance: Syncs immediately, doesn't use session_id (per notes-on-stripe.md)
  - Details:
    ```typescript
    // Server Component - sync eagerly to beat webhooks
    export default async function SuccessPage() {
      const user = await requireAuth();
      const customerId = await getUserStripeCustomerId(user.id);

      if (customerId) {
        await syncStripeDataToKV(customerId);
      }

      redirect('/dashboard');
    }
    ```
    Note: We don't use CHECKOUT_SESSION_ID. Single sync function handles everything.

- [ ] Create webhook handler
  - Files: `src/app/api/webhooks/stripe/route.ts` (new)
  - Tests: `src/app/api/webhooks/stripe/__tests__/route.test.ts` (new)
  - Acceptance: Verifies signatures, processes events, grants credits atomically
  - Details:
    ```typescript
    const ALLOWED_EVENTS: Stripe.Event.Type[] = [
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.paid',
      'invoice.payment_failed',
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
    ];

    export async function POST(req: Request) {
      const body = await req.text();
      const signature = req.headers.get('stripe-signature');
      if (!signature) return NextResponse.json({}, { status: 400 });

      const event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);

      if (!ALLOWED_EVENTS.includes(event.type)) {
        return NextResponse.json({ received: true });
      }

      // Process async but return 200 immediately
      waitUntil(processStripeEvent(event));

      return NextResponse.json({ received: true });
    }
    ```

- [ ] Implement processStripeEvent handler
  - Files: `src/lib/stripe/webhook-handlers.ts` (new)
  - Tests: Unit tests with mock events
  - Acceptance: Handles all event types, grants credits via atomic function
  - Details:
    - For `payment_intent.succeeded`: Extract metadata, call grantCreditsForPayment
    - For `invoice.paid` (subscription renewal): Get subscription metadata, call grantCreditsForPayment
    - For `customer.subscription.updated`: Handle tier upgrades with proration
    - For all events: Call syncStripeDataToKV to update cached state
    - Tier upgrade handling:
      ```typescript
      // On subscription update, check if tier changed
      const oldTier = previousAttributes?.metadata?.tier;
      const newTier = subscription.metadata.tier;
      if (oldTier && newTier && oldTier !== newTier) {
        // Calculate prorated credits
        const oldCredits = SUBSCRIPTION_TIERS[oldTier].credits;
        const newCredits = SUBSCRIPTION_TIERS[newTier].credits;
        const proratedCredits = calculateProratedCredits(newCredits - oldCredits, subscription);
        // Grant immediately
        await grantCreditsForPayment({..., purchaseType: 'subscription_upgrade'});
      }
      ```

- [ ] Create Stripe portal redirect endpoint
  - Files: `src/app/api/stripe/portal/route.ts` (new)
  - Tests: Manual verification
  - Acceptance: Redirects authenticated users to Stripe portal
  - Details:
    ```typescript
    export async function POST(req: Request) {
      const user = await requireAuth();
      const customerId = await getUserStripeCustomerId(user.id);
      if (!customerId) return NextResponse.json({ error: 'No subscription' }, { status: 400 });

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${baseUrl}/settings/billing`,
      });

      return NextResponse.json({ url: session.url });
    }
    ```

### Phase 3: Frontend Integration

- [ ] Create pricing page
  - Files: `src/app/pricing/page.tsx` (new), `src/components/pricing/credit-packs.tsx` (new), `src/components/pricing/subscription-tiers.tsx` (new)
  - Tests: Component tests with MSW for checkout API
  - Acceptance: Displays packs and tiers, initiates checkout
  - Details:
    - CreditPacks component: map over CREDIT_PACKS, show name/credits/price, "Buy Now" button
    - SubscriptionTiers component: map over SUBSCRIPTION_TIERS, highlight features, "Subscribe" button
    - onClick: POST to /api/stripe/checkout, redirect to session.url
    - Show loading state during checkout creation
    - Handle errors (rate limit, auth, network)
    - Show current subscription status if subscribed (with "Manage" link to portal)

- [ ] Update credit balance display
  - Files: `src/components/credit-balance.tsx` (modify)
  - Tests: Component test with mock data
  - Acceptance: Shows single credit balance (simplified - no dual pools)
  - Details:
    - Fetch existing `credits` column (single pool)
    - Display total credits
    - If subscribed, show subscription badge with tier name
    - Link to /pricing for "Buy More Credits"
    - No breakdown needed - all credits are equivalent

- [ ] Create billing settings page
  - Files: `src/app/settings/billing/page.tsx` (new), `src/components/billing/purchase-history.tsx` (new), `src/components/billing/subscription-status.tsx` (new)
  - Tests: Page and component tests
  - Acceptance: Shows subscription, purchases, portal link
  - Details:
    - SubscriptionStatus: fetch from stripe_subscriptions table, show tier/status/next renewal
    - "Manage Subscription" button → POST /api/stripe/portal → redirect to portal URL
    - PurchaseHistory: fetch from stripe_purchases table, show date/type/credits/amount in table
    - Handle loading and error states

- [ ] Create insufficient credits modal
  - Files: `src/components/generation/insufficient-credits-modal.tsx` (new)
  - Tests: Component test with various balance scenarios
  - Acceptance: Shows balance, cost, purchase options
  - Details:
    - Props: currentBalance, requiredCredits, onClose
    - Show deficit: "You need {required - current} more credits"
    - Quick buy options: Show smallest pack that covers deficit
    - "View All Options" button → /pricing
    - Close on backdrop click or X button

- [ ] Update generation error handling
  - Files: `src/app/api/generate/route.ts` (modify)
  - Tests: Integration test for insufficient credits flow
  - Acceptance: Returns 402 with insufficient credits error
  - Details:
    - When createGenerationJob fails with "Insufficient credits"
    - Return { error: 'Insufficient credits', balance, required } with 402 status
    - Frontend shows InsufficientCreditsModal

### Phase 4: Testing & Polish

- [ ] Create Stripe test products and prices
  - Files: Manual setup in Stripe Dashboard
  - Tests: Verify test mode price IDs in env
  - Acceptance: All 5 price IDs created and added to .env.local
  - Details:
    - Create products in test mode: "50 Credits", "200 Credits", "500 Credits", "Pro Plan", "Business Plan"
    - Create prices for each
    - Copy price IDs to .env.local

- [ ] Test credit pack purchase flow
  - Files: N/A (integration test)
  - Tests: Manual E2E test
  - Acceptance: Can purchase pack, credits added, no duplicates
  - Details:
    - Use test card 4242 4242 4242 4242
    - Complete checkout, verify redirect to /success
    - Check credits added to balance
    - Reload /success page, verify no double-credit
    - Trigger webhook manually, verify idempotency

- [ ] Test subscription flow
  - Files: N/A (integration test)
  - Tests: Manual E2E test
  - Acceptance: Can subscribe, monthly credits granted, accumulate without limit
  - Details:
    - Subscribe to Pro plan
    - Verify 200 credits granted immediately
    - Simulate invoice.paid event for next month
    - Verify credits accumulate (no cap - credits never expire)
    - Test cancellation: verify existing credits remain, no new credits on next cycle

- [ ] Test tier upgrade with proration
  - Files: N/A (integration test)
  - Tests: Manual E2E test
  - Acceptance: Upgrading tier grants prorated credits immediately
  - Details:
    - Subscribe to Pro plan (200 credits/mo)
    - Upgrade to Business plan mid-cycle via Stripe portal
    - Verify prorated credits granted immediately (difference * remaining days / total days)
    - Verify subscription.updated webhook processed correctly

- [ ] Test webhook signature verification
  - Files: `src/app/api/webhooks/stripe/__tests__/route.test.ts` (modify)
  - Tests: Unit test with invalid signature
  - Acceptance: Rejects webhooks with bad signatures
  - Details:
    - Send webhook with no signature → 400
    - Send webhook with wrong signature → 400
    - Send webhook with valid signature → 200

- [ ] Test race condition protection
  - Files: `src/lib/stripe/__tests__/credits.test.ts` (new)
  - Tests: Unit test with concurrent calls
  - Acceptance: Only one credit grant succeeds
  - Details:
    - Simulate concurrent calls to grantCreditsForPayment with same paymentIntentId
    - Verify only one insert succeeds (ON CONFLICT DO NOTHING)
    - Verify credits granted exactly once
    - Verify second call returns { granted: false }

- [ ] Test Redis cache fallback
  - Files: `src/lib/stripe/__tests__/customer.test.ts` (modify)
  - Tests: Unit test with Redis unavailable
  - Acceptance: Falls back to Stripe API/DB when Redis fails
  - Details:
    - Mock Redis to throw error
    - Verify getOrCreateStripeCustomer still works (falls back to DB)
    - Verify syncStripeDataToKV still syncs to DB even if Redis cache fails

- [ ] Test idempotency of credit grants
  - Files: `src/lib/db/__tests__/credits.test.ts` (modify)
  - Tests: Unit test for duplicate idempotency keys
  - Acceptance: Same key returns existing transaction, no duplicate credits
  - Details:
    - Call addCredits with same idempotency key twice
    - Verify balance only increased once
    - Verify same transaction_id returned

- [ ] Add error monitoring
  - Files: `src/lib/stripe/sync.ts` (modify), `src/app/api/webhooks/stripe/route.ts` (modify)
  - Tests: Verify console.error called on failures
  - Acceptance: All Stripe errors logged with context
  - Details:
    - Add try/catch to all Stripe API calls
    - Log with context: '[Stripe Sync]', '[Stripe Webhook]'
    - Include customer ID, event type, error message

- [ ] Document Stripe setup process
  - Files: `docs/stripe-setup.md` (new)
  - Tests: N/A
  - Acceptance: Clear instructions for production setup
  - Details:
    - How to create products and prices
    - How to configure webhook endpoint
    - How to test with Stripe CLI
    - Environment variable checklist
    - Migration steps for production

---

## Acceptance Criteria

### Functional Requirements
- [ ] Users can purchase credit packs (50, 200, 500)
- [ ] Users can subscribe to Pro or Business tier
- [ ] Monthly credits granted automatically on renewal (via invoice.paid webhook)
- [ ] Credits never expire - once paid, they belong to user permanently
- [ ] No double-charging (INSERT ON CONFLICT + idempotency keys prevent duplicates)
- [ ] Webhook events process correctly (signature verified, events logged)
- [ ] Success page syncs immediately (beats webhook race condition)
- [ ] Tier upgrades grant prorated credits immediately
- [ ] Cancellation stops future credits but existing credits remain
- [ ] Stripe Customer Portal works for subscription management

### Technical Requirements
- [ ] All tests pass (`bun test`)
- [ ] No TypeScript errors (`bun tsc`)
- [ ] Test coverage ≥70% for new code
- [ ] All migrations run successfully
- [ ] Customer created BEFORE checkout (per notes-on-stripe.md)
- [ ] Single syncStripeDataToKV function used everywhere
- [ ] Webhook processing <500ms (async with waitUntil)
- [ ] All purchases logged in stripe_purchases table
- [ ] All credits logged in credit_transactions table

### Security Requirements
- [ ] Webhook signatures verified (prevents spoofing)
- [ ] Rate limiting on checkout endpoint (prevents abuse)
- [ ] RLS policies on new tables (users can only see own data)
- [ ] STRIPE_SECRET_KEY never exposed to client
- [ ] Customer metadata includes userId (for reverse lookup)
- [ ] Fallback lookup if customer metadata missing

---

## Files to Create

### Database
- `supabase/migrations/00020_create_stripe_tables.sql` - Tables and indexes (no new RPC needed)

### Backend - Stripe Library
- `src/lib/stripe/index.ts` - Barrel exports
- `src/lib/stripe/client.ts` - Stripe SDK initialization
- `src/lib/stripe/customer.ts` - Customer creation and caching
- `src/lib/stripe/sync.ts` - Core sync function (Stripe → Redis → Supabase)
- `src/lib/stripe/products.ts` - Product configuration (packs, tiers, prices)
- `src/lib/stripe/credits.ts` - grantCreditsForPayment (race-safe credit granting)
- `src/lib/stripe/webhook-handlers.ts` - Event-specific handlers

### Backend - API Routes
- `src/app/api/stripe/checkout/route.ts` - Create checkout sessions
- `src/app/api/stripe/portal/route.ts` - Redirect to customer portal
- `src/app/api/webhooks/stripe/route.ts` - Webhook handler

### Frontend - Pages
- `src/app/pricing/page.tsx` - Pricing page with packs and tiers
- `src/app/success/page.tsx` - Post-checkout sync and redirect
- `src/app/settings/billing/page.tsx` - Billing management

### Frontend - Components
- `src/components/pricing/credit-packs.tsx` - Credit pack cards
- `src/components/pricing/subscription-tiers.tsx` - Subscription tier cards
- `src/components/billing/purchase-history.tsx` - Purchase history table
- `src/components/billing/subscription-status.tsx` - Subscription status display
- `src/components/generation/insufficient-credits-modal.tsx` - Insufficient credits modal

### Tests
- `src/lib/stripe/__tests__/customer.test.ts` - Customer creation tests
- `src/lib/stripe/__tests__/sync.test.ts` - Sync function tests
- `src/lib/stripe/__tests__/credits.test.ts` - Credit granting tests (race conditions)
- `src/lib/stripe/__tests__/products.test.ts` - Product config tests
- `src/app/api/webhooks/stripe/__tests__/route.test.ts` - Webhook tests

### Documentation
- `docs/stripe-setup.md` - Production setup guide

## Files to Modify

### Backend
- `src/lib/env.ts` - Add Stripe environment variables
- `src/app/api/generate/route.ts` - Return 402 on insufficient credits
- `package.json` - Add stripe dependency
- `.env.example` - Add Stripe vars

### Frontend
- `src/components/credit-balance.tsx` - Add subscription badge if subscribed

---

## Dependencies

### External Dependencies
- `stripe@latest` - Stripe Node.js SDK (server-side only, no client SDK needed)

### Internal Dependencies
- Existing: `src/lib/db/credits.ts` - Credit RPC wrappers (no changes needed)
- Existing: `src/lib/rate-limit/index.ts` - Redis client (reused for Stripe cache)
- Existing: `src/lib/supabase/admin.ts` - Admin client for RLS bypass
- New: `src/lib/stripe/sync.ts` - Used by both webhook and success route
- New: `src/lib/stripe/credits.ts` - Race-safe credit granting

### Task Dependencies
1. Database migration must complete before any Stripe integration work
2. Stripe client must be created before customer/sync functions
3. Product configuration must exist before checkout endpoint
4. grantCreditsForPayment must be implemented before webhook handlers
5. syncStripeDataToKV must be implemented before webhook and success route
6. Frontend components depend on API routes being functional
7. Testing phase depends on all implementation phases

---

## Environment Setup Checklist

- [ ] Create Stripe account (test mode)
- [ ] Create products and prices in Stripe Dashboard
- [ ] Enable "Limit customers to one subscription" in Stripe settings (prevents duplicate subscriptions)
- [ ] Disable Cash App Pay (high fraud rate per notes-on-stripe.md)
- [ ] Set up webhook endpoint (use Stripe CLI for local dev: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`)
- [ ] Configure Customer Portal in Stripe Dashboard (enable cancellation, plan switching)
- [ ] Add all env vars to `.env.local`
- [ ] Run `bun install` to get dependencies
- [ ] Run `supabase db push` to apply migration
- [ ] Generate Supabase types: `npx supabase gen types typescript`

---

## Rollback Plan

If issues arise in production:

1. **Immediate**: Disable webhook processing (comment out processEvent call, return 200)
2. **Short-term**: Revert migration 00020 (will lose Stripe tables but preserve existing credits)
3. **Long-term**: Fix issues, re-enable webhook, backfill any missed events from Stripe logs

---

## Monitoring & Alerts

Track these metrics post-deployment:

- Webhook event processing time (p95 < 500ms)
- Webhook failure rate (< 1%)
- Credit grant failures (should be 0)
- Checkout abandonment rate
- Redis cache hit rate (> 80%)
- Stripe API error rate

---

## Notes

### Code Style
- Follow existing code style: kebab-case files, camelCase vars, PascalCase types
- Use Result type pattern from prompt-bench for Stripe operations
- Keep functions ≤20 lines where possible
- Add TODO comments for future enhancements
- Save learnings to ai-learnings.md during implementation

### Key Architecture Principles (from notes-on-stripe.md)
1. **Always create customer BEFORE checkout** - Store binding between userId and stripeCustomerId
2. **Single syncStripeDataToKV function** - Called from both webhook AND success route
3. **Don't use CHECKOUT_SESSION_ID** - Single sync function handles everything
4. **Metadata on the right object** - payment_intent_data.metadata for packs, subscription_data.metadata for subscriptions
5. **Return 200 immediately from webhooks** - Process events async with waitUntil

### Simplifications Made
- Single credit pool (no subscription_credits vs purchased_credits)
- Credits never expire once granted
- No 2x cap logic needed
- No subscription status checks for credit usage
- Existing consume_credits RPC unchanged
