# Stripe Integration Fixes Implementation Plan

## Overview

Fix critical bugs, security vulnerabilities, and type safety issues introduced in the Stripe payments commit (5a222ef9). The generate page has syntax corruption preventing app build, and billing components expose admin database access to the browser.

## Architecture Decisions

- **Server Actions for Billing Data**: Replace direct `createAdminClient()` calls in client components with Next.js server actions. This maintains RLS protection and keeps admin credentials server-side.
- **Centralized Billing Queries**: Create `src/lib/db/billing.ts` to house all billing-related database queries, following existing pattern in `src/lib/db/`.
- **Type Safety**: Use Stripe SDK types instead of `any` to catch integration errors at compile time.

## Implementation Tasks

### Phase 1: Fix Generate Page (Critical - Blocks Build)

- [x] Rewrite `src/app/generate/page.tsx` to fix syntax corruption
  - Files: `src/app/generate/page.tsx` (modify)
  - Changes:
    - Add import: `import { InsufficientCreditsModal } from '@/components/generation/insufficient-credits-modal';`
    - Add state: `const [showCreditsModal, setShowCreditsModal] = useState(false);`
    - Add state: `const [creditsNeeded, setCreditsNeeded] = useState(0);`
    - Fix double `response.json()` bug - use already-parsed `data` for 402 status check
    - Remove all duplicated modal snippets (lines 131-279 are corrupted)
    - Add single modal render before closing `</div>` of root element
  - Tests: Manual verification - app should build and generate page should render
  - Acceptance: `bun build` succeeds, generate page loads without errors

### Phase 2: Create Billing Server Actions (Critical - Security)

- [x] Create billing database queries with server actions
  - Files: `src/lib/db/billing.ts` (new)
  - Implementation:
    ```typescript
    'use server';

    import { createClient } from '@/lib/supabase/server';

    export interface SubscriptionData {
      status: string;
      tier: string;
      current_period_end: string;
      cancel_at_period_end: boolean;
    }

    export interface PurchaseData {
      id: string;
      amount_cents: number;
      credits_granted: number;
      purchase_type: string;
      created_at: string;
    }

    export async function fetchUserSubscription(): Promise<SubscriptionData | null> {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('stripe_subscriptions')
        .select('status, tier, current_period_end, cancel_at_period_end')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;
      return data;
    }

    export async function fetchUserPurchases(): Promise<PurchaseData[]> {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('stripe_purchases')
        .select('id, amount_cents, credits_granted, purchase_type, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data;
    }
    ```
  - Tests: `src/lib/db/__tests__/billing.test.ts` (new) - mock Supabase client
  - Acceptance: Functions return typed data, no admin client usage

- [x] Update billing index export
  - Files: `src/lib/db/index.ts` (modify)
  - Changes: Add `export * from './billing';`
  - Acceptance: Billing functions accessible via `@/lib/db`

### Phase 3: Fix Billing Components (Critical - Security)

- [x] Fix `subscription-status.tsx` security and useState bug
  - Files: `src/components/billing/subscription-status.tsx` (modify)
  - Changes:
    - Remove `import { createAdminClient }`
    - Add `import { fetchUserSubscription, type SubscriptionData } from '@/lib/db/billing';`
    - Replace `useState(() => { ... })` with proper `useEffect`:
      ```typescript
      const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);

      useEffect(() => {
        fetchUserSubscription()
          .then(setSubscription)
          .catch((err) => setError(err.message))
          .finally(() => setLoading(false));
      }, []);
      ```
    - Add error state display to UI
  - Tests: Component renders without admin client, shows loading/error states
  - Acceptance: No `createAdminClient` import, proper useEffect pattern

- [x] Fix `purchase-history.tsx` security vulnerability
  - Files: `src/components/billing/purchase-history.tsx` (modify)
  - Changes:
    - Remove `import { createAdminClient }`
    - Add `import { fetchUserPurchases, type PurchaseData } from '@/lib/db/billing';`
    - Replace `createAdminClient()` call with `fetchUserPurchases()`
    - Add error state: `const [error, setError] = useState<string | null>(null);`
    - Display error message to user when fetch fails
  - Tests: Component renders without admin client, shows error states
  - Acceptance: No `createAdminClient` import, user-visible errors

### Phase 4: Fix Type Safety Issues (Important)

- [x] Replace `any` types in `sync.ts` with Stripe types
  - Files: `src/lib/stripe/sync.ts` (modify)
  - Changes:
    - Add import: `import type Stripe from 'stripe';`
    - Change line 45: `function formatSubscriptionData(subscription: Stripe.Subscription)`
    - Change line 58: `async function upsertSubscription(userId: string, subscription: Stripe.Subscription)`
  - Tests: TypeScript compilation succeeds
  - Acceptance: No `any` types in file

- [x] Extract PostgreSQL error code constant
  - Files: `src/lib/stripe/credits.ts` (modify)
  - Changes:
    - Add constant: `const POSTGRES_UNIQUE_VIOLATION = '23505';`
    - Replace line 37: `if (error?.code === POSTGRES_UNIQUE_VIOLATION)`
  - Acceptance: Magic string removed, constant is self-documenting

### Phase 5: Fix API Compatibility (Important)

- [x] Await `headers()` for Next.js 15+ compatibility
  - Files: `src/app/api/webhooks/stripe/route.ts` (modify)
  - Changes:
    - Line 21 change from: `const sig = headers().get('stripe-signature');`
    - To: `const headersList = await headers(); const sig = headersList.get('stripe-signature');`
  - Tests: Webhook endpoint handles requests without deprecation warnings
  - Acceptance: No Next.js 15 compatibility warnings

### Phase 6: Implement Suggestions

- [x] Add TODO comment for tier upgrade handler
  - Files: `src/lib/stripe/webhook-handlers.ts` (modify)
  - Changes:
    - Replace empty function body at lines 158-163 with:
      ```typescript
      async function handleSubscriptionTierUpgrade(subscription: Stripe.Subscription): Promise<void> {
        // TODO: Implement subscription tier upgrade with prorated credits
        // Business logic needed: How to handle mid-cycle upgrades?
        // Options: Immediate full credit grant vs prorated amount
        console.log(`[Stripe] Tier upgrade detected for subscription ${subscription.id}`);
      }
      ```
  - Acceptance: Clear TODO with context, no empty function

## Acceptance Criteria

- [ ] `bun build` succeeds without errors
- [ ] `bun lint` passes (no ESLint errors)
- [ ] `bun test` passes (no test failures)
- [x] No `createAdminClient` usage in any file under `src/components/`
- [x] No `any` types in `src/lib/stripe/` files
- [x] Generate page renders and shows credits modal on 402 response
- [x] Billing settings page loads subscription and purchase history

## Files to Create/Modify

| File | Action | Priority |
|------|--------|----------|
| `src/app/generate/page.tsx` | Modify (rewrite) | Critical |
| `src/lib/db/billing.ts` | Create | Critical |
| `src/lib/db/index.ts` | Modify | Critical |
| `src/components/billing/subscription-status.tsx` | Modify | Critical |
| `src/components/billing/purchase-history.tsx` | Modify | Critical |
| `src/lib/stripe/sync.ts` | Modify | Important |
| `src/lib/stripe/credits.ts` | Modify | Suggestion |
| `src/app/api/webhooks/stripe/route.ts` | Modify | Important |
| `src/lib/stripe/webhook-handlers.ts` | Modify | Suggestion |

## Dependencies

- **External**: None (all dependencies already in package.json)
- **Internal Task Dependencies**:
  - Phase 2 must complete before Phase 3 (billing components depend on server actions)
  - Phase 1 can run in parallel with Phases 2-6
  - Phases 4-6 have no dependencies and can run in parallel

## Verification Commands

```bash
# After all changes
bun build          # Must succeed
bun lint           # Must pass
bun test           # Must pass

# Manual verification
bun dev            # Start dev server
# Visit /generate - should render without errors
# Visit /settings/billing - should load subscription/purchase data
```
