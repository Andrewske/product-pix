# Hybrid Pricing Code Review Fixes Implementation Plan

## Overview
Address all action items from code review for commit `4036dabb` (hybrid pricing architecture). This includes critical server action fixes, UX regressions, dead code removal, and migration from API route to server actions.

## Architecture Decisions

- **Server Actions over API Routes**: Migrate checkout logic from `/api/stripe/checkout` to server actions for better type safety, reduced network overhead, and simpler code
- **Direct Stripe Calls**: Server actions call Stripe SDK directly instead of HTTP fetch to own API
- **Type Consolidation**: Remove duplicate type definitions in favor of single source of truth in `actions.ts`
- **Consistent Formatting**: Use `Intl.NumberFormat` across all pricing components

## Implementation Tasks

### Phase 1: Critical Server Action Fixes
These fixes are required for server actions to function correctly.

- [x] Add 'use server' directive to pricing actions
  - Files: `src/lib/pricing/actions.ts` (modify)
  - Tests: Existing tests should continue to pass
  - Acceptance: File starts with `'use server';` directive

- [x] Rewrite checkout-actions with direct Stripe calls
  - Files: `src/lib/stripe/checkout-actions.ts` (modify)
  - Tests: `src/lib/stripe/__tests__/checkout-actions.test.ts` (new)
  - Acceptance:
    - File starts with `'use server';` directive
    - `createPackCheckout(packId)` calls Stripe directly
    - `createSubscriptionCheckout(tier)` calls Stripe directly
    - No HTTP fetch to internal API routes
    - Proper error handling with descriptive messages
  - Implementation:
    ```typescript
    'use server';

    import { stripe } from '@/lib/stripe/client';
    import { getOrCreateStripeCustomer } from '@/lib/stripe/customer';
    import { CREDIT_PACKS, SUBSCRIPTION_TIERS } from '@/lib/stripe/products';
    import { requireAuth } from '@/lib/auth/server';
    import { getPricing, type PricingPack } from '@/lib/pricing/actions';

    export async function getPricingForModal(): Promise<Record<string, PricingPack>> {
      const pricing = await getPricing();
      return pricing.packs;
    }

    export async function createPackCheckout(packId: string): Promise<{ url: string }> {
      const user = await requireAuth();
      if (!user.email) {
        throw new Error('Email required for checkout');
      }

      const pack = CREDIT_PACKS[packId as keyof typeof CREDIT_PACKS];
      if (!pack) {
        throw new Error(`Invalid pack ID: ${packId}`);
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_APP_URL not configured');
      }

      const customerId = await getOrCreateStripeCustomer(user.id, user.email);

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        line_items: [{ price: pack.priceId, quantity: 1 }],
        payment_intent_data: {
          metadata: { userId: user.id, packId, credits: pack.credits },
        },
        success_url: `${baseUrl}/success`,
        cancel_url: `${baseUrl}/pricing`,
      });

      if (!session.url) {
        throw new Error('Failed to create checkout session');
      }

      return { url: session.url };
    }

    export async function createSubscriptionCheckout(tier: string): Promise<{ url: string }> {
      const user = await requireAuth();
      if (!user.email) {
        throw new Error('Email required for checkout');
      }

      const subscriptionTier = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];
      if (!subscriptionTier) {
        throw new Error(`Invalid subscription tier: ${tier}`);
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_APP_URL not configured');
      }

      const customerId = await getOrCreateStripeCustomer(user.id, user.email);

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [{ price: subscriptionTier.priceId, quantity: 1 }],
        subscription_data: {
          metadata: { userId: user.id, tier, credits: subscriptionTier.credits },
        },
        success_url: `${baseUrl}/success`,
        cancel_url: `${baseUrl}/pricing`,
      });

      if (!session.url) {
        throw new Error('Failed to create checkout session');
      }

      return { url: session.url };
    }
    ```

### Phase 2: Component Updates
Update components to use server actions instead of API fetch.

- [x] Update credit-packs.tsx to use server action
  - Files: `src/components/pricing/credit-packs.tsx` (modify)
  - Tests: Manual testing
  - Acceptance:
    - Imports `createPackCheckout` from `@/lib/stripe/checkout-actions`
    - No `fetch('/api/stripe/checkout')` calls
    - Checkout flow works correctly
  - Changes:
    - Add import: `import { createPackCheckout } from '@/lib/stripe/checkout-actions';`
    - Replace fetch call in `handlePurchase` with: `const { url } = await createPackCheckout(packId);`

- [x] Update subscription-tiers.tsx to use server action + Intl formatting
  - Files: `src/components/pricing/subscription-tiers.tsx` (modify)
  - Tests: Manual testing
  - Acceptance:
    - Imports `createSubscriptionCheckout` from `@/lib/stripe/checkout-actions`
    - No `fetch('/api/stripe/checkout')` calls
    - Uses `Intl.NumberFormat` for price formatting (consistent with credit-packs.tsx)
    - Checkout flow works correctly
  - Changes:
    - Add import: `import { createSubscriptionCheckout } from '@/lib/stripe/checkout-actions';`
    - Replace fetch call in `handleSubscribe` with: `const { url } = await createSubscriptionCheckout(tier);`
    - Add `formatPrice` helper using `Intl.NumberFormat`

- [x] Restore price display in insufficient-credits-modal
  - Files: `src/components/generation/insufficient-credits-modal.tsx` (modify)
  - Tests: Manual testing
  - Acceptance:
    - Recommended pack shows price to user (was removed in refactor)
    - Price formatted consistently with other components
  - Changes: Add price span in recommended pack section around line 88:
    ```tsx
    <span className="text-lg font-bold">
      ${(recommendedPack[1].priceCents / 100).toFixed(2)}
    </span>
    ```

### Phase 3: Cleanup
Remove dead code and fix formatting.

- [x] Remove orphaned type definitions
  - Files: `src/lib/pricing/types.ts` (modify)
  - Tests: `bun lint` passes
  - Acceptance:
    - Lines 30-64 removed (unused `CreditPack`, `SubscriptionTier`, `CreditEconomy`, `PricingData`)
    - Only model pricing types remain (Provider, ModelPricing, PricingConfig, etc.)
    - No TypeScript errors

- [x] Fix formatting in pricing page
  - Files: `src/app/pricing/page.tsx` (modify)
  - Tests: `bun lint` passes
  - Acceptance: Remove leading spaces on import lines 1-6

- [x] Delete checkout API route
  - Files: `src/app/api/stripe/checkout/route.ts` (delete)
  - Tests: `bun lint` passes, no import errors
  - Acceptance:
    - File is deleted
    - No remaining references to `/api/stripe/checkout` in codebase
    - All checkout flows use server actions

### Phase 4: Update Barrel Export
Ensure new exports are available.

- [x] Update stripe index exports
  - Files: `src/lib/stripe/index.ts` (modify)
  - Tests: Import works from other files
  - Acceptance: Exports `createPackCheckout`, `createSubscriptionCheckout`, `getPricingForModal`

## Acceptance Criteria
- [x] All tests pass (`bun test`)
- [x] No TypeScript errors (`bun lint`)
- [x] Pricing page loads correctly
- [x] Credit packs checkout works
- [x] Subscription checkout works
- [x] Insufficient credits modal shows prices
- [x] No references to deleted API route

## Files to Create/Modify

### New Files
- `src/lib/stripe/__tests__/checkout-actions.test.ts`

### Modified Files
- `src/lib/pricing/actions.ts` - Add 'use server'
- `src/lib/stripe/checkout-actions.ts` - Full rewrite
- `src/components/pricing/credit-packs.tsx` - Use server action
- `src/components/pricing/subscription-tiers.tsx` - Use server action + Intl format
- `src/lib/pricing/types.ts` - Remove dead types
- `src/components/generation/insufficient-credits-modal.tsx` - Restore price
- `src/app/pricing/page.tsx` - Fix formatting
- `src/lib/stripe/index.ts` - Update exports

### Deleted Files
- `src/app/api/stripe/checkout/route.ts`

## Dependencies

### Internal Dependencies
- `src/lib/stripe/client.ts` - Stripe SDK instance
- `src/lib/stripe/customer.ts` - `getOrCreateStripeCustomer()`
- `src/lib/stripe/products.ts` - `CREDIT_PACKS`, `SUBSCRIPTION_TIERS`
- `src/lib/auth/server.ts` - `requireAuth()`
- `src/lib/pricing/actions.ts` - `getPricing()`

### External Dependencies
- `stripe` - Already installed
- `next` - Server actions built-in

### Task Dependencies
1. Phase 1 must complete before Phase 2 (components depend on server actions)
2. Phase 2 must complete before Phase 3 task "Delete checkout API route"
3. Phase 4 can run in parallel with Phase 3

## Verification Commands
```bash
# TypeScript check
bun lint

# Run tests
bun test

# Manual verification
bun dev
# Visit /pricing, test checkout flows
```
