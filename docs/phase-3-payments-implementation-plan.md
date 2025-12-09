# Phase 3: Payments & Credits Implementation Plan

## Overview

Implement Stripe integration for ProductPix with credit pack purchases and subscription tiers. Following the battle-tested Stripe philosophy from `docs/notes-on-stripe.md`: pre-create customers, single sync function, idempotent operations, Redis caching.

**Product Configuration:**
- Credit Packs: 50/$10, 200/$30, 500/$60
- Subscriptions: Pro ($20/mo, 200 credits), Business ($50/mo, 600 credits)
- Credit Policy: Rollover with 2x cap, persist until period end on cancellation

## Architecture Decisions

### Decision 1: Single Sync Function Pattern
**Choice:** Implement `syncStripeDataToRedis(customerId)` called from both webhook and `/success` route
**Rationale:** Prevents race conditions, ensures consistency, follows proven pattern from notes-on-stripe.md

### Decision 2: Dual Credit Pools
**Choice:** Separate `subscription_credits` and `purchased_credits` columns
**Rationale:** Enables accurate expiration logic (subscription credits can expire/cap, purchased never expire)

### Decision 3: Redis for Stripe State Cache
**Choice:** Cache Stripe customer/subscription data in existing Upstash Redis (1-hour TTL)
**Rationale:** Fast reads, existing infrastructure, graceful fallback to Stripe API

### Decision 4: Supabase as Credit Source of Truth
**Choice:** Keep existing RPC functions for credits, add new `grant_subscription_credits` RPC
**Rationale:** Atomic operations with row locking, idempotency already proven, no changes to generation flow

### Decision 5: Stripe Customer Portal for Management
**Choice:** Use Stripe's hosted portal instead of custom subscription UI
**Rationale:** Production-ready, handles edge cases, PCI compliant, less code to maintain

---

## Implementation Tasks

### Phase 1: Database & Infrastructure Setup

- [ ] Create Stripe tables migration
  - Files: `supabase/migrations/00020_create_stripe_tables.sql` (new)
  - Tests: Manual verification via `supabase db push`
  - Acceptance: Tables created with proper indexes, RLS enabled
  - Details:
    - Add `stripe_customer_id` column to `users` table (TEXT UNIQUE)
    - Create `stripe_subscriptions` table (user_id, stripe_subscription_id, status, price_id, tier, periods, cancel flags)
    - Create `stripe_purchases` table (user_id, stripe_payment_intent_id, amount_paid, credits_granted, pack_id)
    - Add `subscription_credits` and `purchased_credits` columns to `users` table (both INTEGER DEFAULT 0)
    - Add subscription tracking columns to `credit_transactions` (subscription_period_start, subscription_period_end, is_subscription_credit)
    - Create indexes on new columns

- [ ] Add subscription_renewal to transaction_type enum
  - Files: `supabase/migrations/00020_create_stripe_tables.sql` (modify)
  - Tests: Enum value available in TypeScript types
  - Acceptance: `ALTER TYPE transaction_type ADD VALUE 'subscription_renewal'` succeeds
  - Details: Add to enum definition, regenerate Supabase types

- [ ] Create grant_subscription_credits RPC function
  - Files: `supabase/migrations/00020_create_stripe_tables.sql` (modify)
  - Tests: `src/lib/db/__tests__/credits.test.ts` (new test cases)
  - Acceptance: Function enforces 2x cap, uses idempotency keys, handles rollover
  - Details:
    - Parameters: p_user_id, p_subscription_id, p_credits, p_tier, p_period_start, p_period_end
    - Idempotency key: `sub_{subscriptionId}_{periodStart}`
    - Calculate max credits (2x monthly amount)
    - Only grant if under cap
    - Update subscription_credits separately from purchased_credits
    - Mark transaction with subscription metadata

- [ ] Add Stripe dependencies
  - Files: `package.json` (modify)
  - Tests: `bun install` succeeds
  - Acceptance: stripe@latest and @stripe/stripe-js@latest installed
  - Details: `bun add stripe @stripe/stripe-js`

- [ ] Add Stripe environment variables
  - Files: `src/lib/env.ts` (modify), `.env.example` (modify)
  - Tests: Environment validation passes with all required vars
  - Acceptance: Zod schema validates STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET, 5 price IDs
  - Details:
    - STRIPE_SECRET_KEY (required)
    - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (required)
    - STRIPE_WEBHOOK_SECRET (required)
    - STRIPE_PRICE_PACK_50, STRIPE_PRICE_PACK_200, STRIPE_PRICE_PACK_500
    - STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_BUSINESS_MONTHLY

### Phase 2: Stripe Core Integration

- [ ] Create Stripe client
  - Files: `src/lib/stripe/client.ts` (new), `src/lib/stripe/index.ts` (new barrel export)
  - Tests: Client initializes without error
  - Acceptance: Stripe SDK initialized with latest API version, TypeScript enabled
  - Details:
    - Import Stripe from 'stripe'
    - Validate STRIPE_SECRET_KEY exists
    - Export configured client with apiVersion: '2024-11-20.acacia', typescript: true

- [ ] Create product configuration
  - Files: `src/lib/stripe/products.ts` (new)
  - Tests: `src/lib/stripe/__tests__/products.test.ts` (new)
  - Acceptance: CREDIT_PACKS and SUBSCRIPTION_TIERS exported with correct pricing
  - Details:
    - Export CREDIT_PACKS object: pack_50 (50 credits, $10), pack_200 (200, $30), pack_500 (500, $60)
    - Export SUBSCRIPTION_TIERS object: pro (200 credits/mo, $20), business (600 credits/mo, $50)
    - Include priceId from env vars

- [ ] Implement getOrCreateStripeCustomer function
  - Files: `src/lib/stripe/customer.ts` (new)
  - Tests: `src/lib/stripe/__tests__/customer.test.ts` (new)
  - Acceptance: Customer created in Stripe, stored in DB, cached in Redis
  - Details:
    - Check Redis cache `stripe:user:{userId}` first
    - Check database `users.stripe_customer_id` second
    - Create new customer if missing (with userId in metadata)
    - Store in database and Redis cache (1-hour TTL)
    - Return customerId

- [ ] Implement syncStripeDataToRedis function (CRITICAL)
  - Files: `src/lib/stripe/sync.ts` (new)
  - Tests: `src/lib/stripe/__tests__/sync.test.ts` (new)
  - Acceptance: Syncs subscriptions, purchases, grants credits idempotently
  - Details:
    - Fetch latest subscription from Stripe (expand payment method)
    - Fetch recent payment intents (limit 10)
    - Extract userId from customer metadata
    - If subscription exists:
      - Cache in Redis `stripe:customer:{customerId}` (1-hour TTL)
      - Upsert to `stripe_subscriptions` table
    - For each succeeded payment intent:
      - Check if already recorded in `stripe_purchases`
      - If new, insert purchase record
      - Call `addCredits()` with payment intent ID as idempotency key
    - Return success status

- [ ] Create checkout endpoint
  - Files: `src/app/api/stripe/checkout/route.ts` (new)
  - Tests: Integration test with Stripe test mode
  - Acceptance: Creates checkout sessions for packs and subscriptions
  - Details:
    - POST handler with auth check
    - Rate limit with `rateLimiters.api`
    - Zod schema: { type: 'pack' | 'subscription', packId?, tier? }
    - Get or create Stripe customer
    - For packs: create payment mode session with line_items, metadata (userId, packId, credits)
    - For subscriptions: create subscription mode session with price, metadata (userId, tier)
    - success_url: /success?session_id={CHECKOUT_SESSION_ID}
    - cancel_url: /pricing
    - Return { url: session.url }

- [ ] Create success route
  - Files: `src/app/success/page.tsx` (new)
  - Tests: Manual testing with Stripe checkout flow
  - Acceptance: Syncs Stripe data immediately, redirects to dashboard
  - Details:
    - Server Component (async)
    - Auth check, redirect to /login if not authenticated
    - Fetch user's stripe_customer_id from database
    - Call syncStripeDataToRedis(customerId) if exists
    - Redirect to /dashboard
    - Handle errors gracefully (log but don't fail)

- [ ] Create webhook handler
  - Files: `src/app/api/webhooks/stripe/route.ts` (new)
  - Tests: `src/app/api/webhooks/stripe/__tests__/route.test.ts` (new)
  - Acceptance: Verifies signatures, processes events, grants credits
  - Details:
    - POST handler with raw body text (NOT json)
    - Verify Stripe signature with STRIPE_WEBHOOK_SECRET
    - Define ALLOWED_EVENTS array (checkout.session.completed, subscription events, invoice.paid, payment_intent events)
    - Extract customerId from event.data.object
    - Special handling for invoice.paid: call grantSubscriptionCredits()
    - Call syncStripeDataToRedis(customerId) for all events
    - Return 200 immediately, process async
    - Log errors but don't fail webhook

- [ ] Implement grantSubscriptionCredits helper
  - Files: `src/app/api/webhooks/stripe/route.ts` (modify)
  - Tests: Unit test with mock Stripe subscription
  - Acceptance: Grants monthly credits via RPC, respects 2x cap
  - Details:
    - Fetch subscription from Stripe
    - Extract tier from metadata
    - Calculate credits (pro: 200, business: 600)
    - Get userId from customer metadata
    - Call `grant_subscription_credits` RPC with subscription_id, credits, tier, period dates
    - Handle errors gracefully

- [ ] Create Stripe portal redirect endpoint
  - Files: `src/app/api/stripe/portal/route.ts` (new)
  - Tests: Manual verification
  - Acceptance: Redirects authenticated users to Stripe portal
  - Details:
    - GET handler with auth check
    - Get stripe_customer_id from database
    - Create portal session with return_url
    - Return { url: session.url }

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

- [ ] Update credit balance display
  - Files: `src/components/credit-balance.tsx` (modify)
  - Tests: Component test with mock data
  - Acceptance: Shows total, breakdown on hover, renewal date
  - Details:
    - Fetch subscription_credits and purchased_credits separately
    - Display total: subscription + purchased
    - Tooltip: "200 subscription, 150 purchased"
    - If subscribed, show "Next renewal: {date}"
    - Link to /pricing for "Buy More Credits"

- [ ] Create billing settings page
  - Files: `src/app/settings/billing/page.tsx` (new), `src/components/billing/purchase-history.tsx` (new), `src/components/billing/subscription-status.tsx` (new)
  - Tests: Page and component tests
  - Acceptance: Shows subscription, purchases, portal link
  - Details:
    - SubscriptionStatus: fetch from stripe_subscriptions table, show tier/status/renewal/cancel date
    - "Manage Subscription" button → GET /api/stripe/portal → redirect
    - PurchaseHistory: fetch from stripe_purchases table, show date/pack/credits/amount in table
    - Handle loading and error states

- [ ] Create insufficient credits modal
  - Files: `src/components/generation/insufficient-credits-modal.tsx` (new)
  - Tests: Component test with various balance scenarios
  - Acceptance: Shows balance, cost, purchase options
  - Details:
    - Props: currentBalance, requiredCredits, onClose
    - Show deficit: "You need {required - current} more credits"
    - "Buy Credits" button → /pricing
    - If free tier, also show "Upgrade to Pro" → /pricing#subscriptions
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
  - Acceptance: Can subscribe, monthly credits granted, rollover works
  - Details:
    - Subscribe to Pro plan
    - Verify 200 credits granted immediately
    - Simulate invoice.paid event for next month
    - Verify rollover cap (can't exceed 400 total subscription credits)
    - Test cancellation, verify credits remain until period end

- [ ] Test webhook signature verification
  - Files: `src/app/api/webhooks/stripe/__tests__/route.test.ts` (modify)
  - Tests: Unit test with invalid signature
  - Acceptance: Rejects webhooks with bad signatures
  - Details:
    - Send webhook with no signature → 400
    - Send webhook with wrong signature → 400
    - Send webhook with valid signature → 200

- [ ] Test Redis cache fallback
  - Files: `src/lib/stripe/__tests__/customer.test.ts` (modify)
  - Tests: Unit test with Redis unavailable
  - Acceptance: Falls back to Stripe API when Redis fails
  - Details:
    - Mock Redis to throw error
    - Verify getOrCreateStripeCustomer still works
    - Verify syncStripeDataToRedis still syncs to DB

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
- [ ] Credits rollover with 2x cap enforced by RPC
- [ ] No double-charging (idempotency prevents duplicate credits)
- [ ] Webhook events process correctly (signature verified, events logged)
- [ ] Success page syncs immediately (no race condition with webhook)
- [ ] Credits persist until period end on cancellation
- [ ] Stripe Customer Portal works for subscription management

### Technical Requirements
- [ ] All tests pass (`bun test`)
- [ ] No TypeScript errors (`bun tsc`)
- [ ] Test coverage ≥70% for new code
- [ ] All migrations run successfully
- [ ] Redis cache hit rate >80% for customer lookups
- [ ] Webhook processing <500ms
- [ ] All transactions logged in credit_transactions table

### Security Requirements
- [ ] Webhook signatures verified (prevents spoofing)
- [ ] Rate limiting on checkout endpoint (prevents abuse)
- [ ] RLS policies on new tables (users can only see own data)
- [ ] STRIPE_SECRET_KEY never exposed to client
- [ ] Customer metadata includes userId (for reverse lookup)

---

## Files to Create

### Database
- `supabase/migrations/00020_create_stripe_tables.sql` - Tables, columns, RPC for Stripe

### Backend - Stripe Library
- `src/lib/stripe/index.ts` - Barrel exports
- `src/lib/stripe/client.ts` - Stripe SDK initialization
- `src/lib/stripe/customer.ts` - Customer creation and caching
- `src/lib/stripe/sync.ts` - Core sync function (Stripe → Redis → Supabase)
- `src/lib/stripe/products.ts` - Product configuration (packs, tiers, prices)

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
- `src/lib/stripe/__tests__/products.test.ts` - Product config tests
- `src/lib/db/__tests__/credits.test.ts` - Credit RPC tests (extend existing)
- `src/app/api/webhooks/stripe/__tests__/route.test.ts` - Webhook tests

### Documentation
- `docs/stripe-setup.md` - Production setup guide

## Files to Modify

### Backend
- `src/lib/env.ts` - Add Stripe environment variables
- `src/app/api/generate/route.ts` - Return 402 on insufficient credits
- `package.json` - Add stripe dependencies
- `.env.example` - Add Stripe vars

### Frontend
- `src/components/credit-balance.tsx` - Show subscription/purchased breakdown

---

## Dependencies

### External Dependencies
- `stripe@latest` - Stripe Node.js SDK
- `@stripe/stripe-js@latest` - Stripe client-side SDK

### Internal Dependencies
- Existing: `src/lib/db/credits.ts` - Credit RPC wrappers (no changes)
- Existing: `src/lib/rate-limit/index.ts` - Redis client (reused for Stripe cache)
- Existing: `src/lib/supabase/admin.ts` - Admin client for RLS bypass
- New: `src/lib/stripe/sync.ts` - Used by both webhook and success route

### Task Dependencies
1. Database migration must complete before any Stripe integration work
2. Stripe client must be created before customer/sync functions
3. Product configuration must exist before checkout endpoint
4. syncStripeDataToRedis must be implemented before webhook and success route
5. Frontend components depend on API routes being functional
6. Testing phase depends on all implementation phases

---

## Environment Setup Checklist

- [ ] Create Stripe account (test mode)
- [ ] Create products and prices in Stripe Dashboard
- [ ] Set up webhook endpoint (use Stripe CLI for local dev)
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

- Follow existing code style: kebab-case files, camelCase vars, PascalCase types
- Use Result type pattern from prompt-bench for Stripe operations
- Keep functions ≤20 lines where possible
- Add TODO comments for future enhancements
- Save learnings to ai-learnings.md during implementation
