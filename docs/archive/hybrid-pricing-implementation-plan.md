# Hybrid Pricing Architecture Implementation Plan

## Overview

Replace hardcoded pricing with a hybrid approach where:
- **Stripe API** = source of truth for dollar amounts (what users pay)
- **Config file** = source of truth for credit economy (what users get)

This eliminates sync bugs where UI shows different prices than Stripe charges.

## Architecture Decisions

- **Stripe price fetching**: Use `unstable_cache` from Next.js with 1-hour TTL for Stripe API calls
- **Config location**: TypeScript file (`pricing.config.ts`) checked into repo, not env vars
- **Server action pattern**: Single `getPricing()` action returns merged data for all pricing needs
- **Type safety**: Zod schemas validate both Stripe responses and config structure
- **Backwards compatibility**: Keep existing `CREDIT_PACKS` and `SUBSCRIPTION_TIERS` exports working during transition

## Implementation Tasks

### Phase 1: Create Pricing Config

- [ ] Create credit economy configuration file
  - Files: `src/lib/pricing/config.ts` (new)
  - Tests: `src/lib/pricing/__tests__/config.test.ts` (new)
  - Acceptance:
    - Exports `creditEconomy` const with Zod validation
    - Contains `creditsPerResolution`, `freeCreditsOnSignup`, pack credits, subscription credits
    - TypeScript infers literal types correctly

```typescript
// Expected structure
export const creditEconomy = {
  creditsPerResolution: { '1k': 1, '2k': 2, '4k': 3 },
  freeCreditsOnSignup: 5,
  packs: {
    pack_50: { credits: 50, slug: 'pack_50' },
    pack_200: { credits: 200, slug: 'pack_200' },
    pack_500: { credits: 500, slug: 'pack_500' },
  },
  subscriptions: {
    pro: { creditsPerMonth: 200, slug: 'pro' },
    business: { creditsPerMonth: 600, slug: 'business' },
  },
} as const;
```

### Phase 2: Create Stripe Price Fetcher

- [ ] Create cached Stripe price fetching utility
  - Files: `src/lib/stripe/fetch-prices.ts` (new)
  - Tests: `src/lib/stripe/__tests__/fetch-prices.test.ts` (new)
  - Acceptance:
    - Fetches prices from Stripe API using price IDs from env vars
    - Uses `unstable_cache` with 1-hour revalidation
    - Returns typed price data (unit_amount, currency, recurring info)
    - Handles Stripe API errors gracefully

```typescript
// Expected interface
export async function fetchStripePrices(): Promise<StripePriceData> {
  // Returns { pack_50: { unitAmount: 1000, currency: 'usd' }, ... }
}
```

### Phase 3: Create Server Action

- [ ] Create unified pricing server action
  - Files: `src/lib/pricing/actions.ts` (new)
  - Tests: `src/lib/pricing/__tests__/actions.test.ts` (new)
  - Acceptance:
    - Exports `getPricing()` server action
    - Merges Stripe prices with credit economy config
    - Returns complete pricing data for frontend consumption
    - Type-safe return value

```typescript
// Expected usage
'use server'
export async function getPricing(): Promise<PricingData> {
  const stripePrices = await fetchStripePrices();
  return {
    packs: mergePacks(stripePrices, creditEconomy.packs),
    subscriptions: mergeSubscriptions(stripePrices, creditEconomy.subscriptions),
    economy: {
      creditsPerResolution: creditEconomy.creditsPerResolution,
      freeCreditsOnSignup: creditEconomy.freeCreditsOnSignup,
    },
  };
}
```

### Phase 4: Create Pricing Types

- [ ] Add comprehensive pricing types
  - Files: `src/lib/pricing/types.ts` (modify)
  - Tests: N/A (type-only changes)
  - Acceptance:
    - `PricingData` type for server action return
    - `CreditPack` type with credits + price info
    - `SubscriptionTier` type with credits + price info
    - `CreditEconomy` type for config

### Phase 5: Update Products File

- [ ] Refactor products.ts to remove hardcoded prices
  - Files: `src/lib/stripe/products.ts` (modify)
  - Tests: `src/lib/stripe/__tests__/products.test.ts` (modify if exists)
  - Acceptance:
    - Remove `priceCents` from `CREDIT_PACKS` and `SUBSCRIPTION_TIERS`
    - Keep Stripe price ID references (needed for checkout)
    - Export only checkout-related data (price IDs, product metadata)
    - Deprecation comments on old exports if needed for transition

### Phase 6: Update Credits Utility

- [ ] Make credits.ts read from config
  - Files: `src/lib/pricing/credits.ts` (modify)
  - Tests: `src/lib/pricing/__tests__/credits.test.ts` (modify)
  - Acceptance:
    - Import `creditsPerResolution` from config instead of hardcoding
    - `getCreditsForResolution()` uses config values
    - Existing tests pass with new implementation

### Phase 7: Update Frontend Components

- [ ] Update credit-packs.tsx to use server action
  - Files: `src/components/pricing/credit-packs.tsx` (modify)
  - Tests: Manual testing (component renders correctly)
  - Acceptance:
    - Fetches pricing via `getPricing()` server action
    - Displays Stripe prices (not hardcoded)
    - Shows per-credit cost calculation
    - Loading state while fetching

- [ ] Update subscription-tiers.tsx to use server action
  - Files: `src/components/pricing/subscription-tiers.tsx` (modify)
  - Tests: Manual testing (component renders correctly)
  - Acceptance:
    - Fetches pricing via `getPricing()` server action
    - Displays Stripe subscription prices
    - Shows monthly credits from config

- [ ] Update insufficient-credits-modal.tsx to use server action
  - Files: `src/components/generation/insufficient-credits-modal.tsx` (modify)
  - Tests: Manual testing (modal shows correct recommendations)
  - Acceptance:
    - Uses fetched pack data for recommendations
    - Calculates smallest pack covering deficit using real prices

### Phase 8: Create Pricing Page Server Component

- [ ] Create pricing data provider for page
  - Files: `src/app/pricing/page.tsx` (modify if exists, or create wrapper)
  - Tests: Manual testing
  - Acceptance:
    - Server component fetches pricing data
    - Passes to client components as props
    - Single fetch per page load (not per component)

## Acceptance Criteria

- [ ] All unit tests pass (`bun test`)
- [ ] No TypeScript errors (`bun lint`)
- [ ] Prices displayed in UI match Stripe dashboard
- [ ] Checkout still works correctly (creates session with right price)
- [ ] Credit consumption still works (deducts correct credits per resolution)
- [ ] Insufficient credits modal recommends correct pack
- [ ] Cache works (Stripe API called once per hour, not per request)

## Files to Create/Modify

### New Files
- `src/lib/pricing/config.ts`
- `src/lib/pricing/actions.ts`
- `src/lib/stripe/fetch-prices.ts`
- `src/lib/pricing/__tests__/config.test.ts`
- `src/lib/pricing/__tests__/actions.test.ts`
- `src/lib/stripe/__tests__/fetch-prices.test.ts`

### Modified Files
- `src/lib/pricing/types.ts`
- `src/lib/pricing/credits.ts`
- `src/lib/stripe/products.ts`
- `src/components/pricing/credit-packs.tsx`
- `src/components/pricing/subscription-tiers.tsx`
- `src/components/generation/insufficient-credits-modal.tsx`
- `src/app/pricing/page.tsx` (if exists)

## Dependencies

### External
- `stripe` package (already installed)
- Next.js `unstable_cache` (built-in)

### Internal
- Stripe price IDs in env vars (already configured)
- Existing checkout flow (must remain working)
- Credit consumption RPC (reads from same source)

## Environment Variables Required

No new env vars needed. Existing ones used:
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_PACK_50`
- `STRIPE_PRICE_PACK_200`
- `STRIPE_PRICE_PACK_500`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_BUSINESS_MONTHLY`

## Rollback Plan

If issues arise:
1. Revert frontend components to import from `products.ts`
2. Restore hardcoded `priceCents` in `products.ts`
3. Keep new server action/config for future use

## Notes

- `unstable_cache` is stable enough for production despite the name
- Consider adding cache invalidation webhook from Stripe for instant price updates (future enhancement)
- Free credits on signup is configured but implementation location TBD (likely auth callback)
