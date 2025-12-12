# Refund System - Phase 3: Cash Refund System

## Overview

Implement cash refund system allowing users to request Stripe refunds for unused credits within 30 days of purchase. Presents fun, equal-emphasis choice: 100% refund or 90% refund ("help cover costs").

**Dependencies**: Phase 1 (Database Foundation) and Phase 2 (Image Refunds) must be deployed first.

## Architecture Decisions

### Eligibility Rules
- **Credits**: Only unused credits eligible (users must refund images → credits first)
- **Time window**: 30 days from purchase date
- **Purchase type**: Credit packs only (no subscriptions)
- **Rationale**:
  - 30 days = industry standard, manageable accounting window
  - Unused only = prevents "use then refund" abuse
  - Packs only = subscriptions have different refund semantics

### Refund Percentage Choice
- **Choice**: User selects 100% or 90% at refund time
- **UI**: Equal emphasis, no pre-selection, fun tone
- **Rationale**:
  - Transparent choice empowers users
  - 90% option helps cover Stripe fees (~3%) + operational costs
  - Equal emphasis = no dark patterns, builds trust
  - Fun tone = aligns with ProductPix brand (not corporate/sterile)

### Credit Deduction Timing
- **Choice**: Deduct credits immediately when refund requested
- **Rationale**:
  - Prevents double-spending (user can't use credits after requesting refund)
  - Stripe refund takes 5-10 days, but credits gone immediately
  - Clear audit trail (credit balance always accurate)

## Implementation Tasks

### Phase 3.1: Backend API

- [ ] Create cash refund eligibility endpoint
  - Files: `src/app/api/refunds/cash/eligibility/route.ts` (new)
  - Exports: `GET`
  - Logic:
    1. Fetch user's purchases (pack_purchase only, within 30 days)
    2. Join with purchase_credit_ledger
    3. Calculate unused credits: `granted - consumed - refunded_image - refunded_cash`
    4. Filter to only purchases with `unused > 0`
    5. Calculate refund amounts (100% and 90% pro-rated)
    6. Return eligible purchases
  - Response format:
    ```typescript
    {
      eligiblePurchases: [
        {
          purchaseId: string;
          date: string;
          amountCents: number;
          creditsGranted: number;
          creditsUnused: number;
          refundAmount100Cents: number;
          refundAmount90Cents: number;
        }
      ]
    }
    ```
  - Tests: `src/app/api/refunds/cash/__tests__/eligibility.test.ts` (new)
    - Test calculation with fully unused pack
    - Test calculation with partially used pack
    - Test 30-day window filter
    - Test subscription purchases excluded
    - Test already-refunded purchases excluded
  - Acceptance:
    - Calculation accurate (pro-rated based on unused credits)
    - 30-day window enforced
    - Only credit packs shown

- [ ] Create cash refund request endpoint
  - Files: `src/app/api/refunds/cash/route.ts` (new)
  - Exports: `POST`
  - Request body:
    ```typescript
    {
      purchaseId: string;
      percentage: 90 | 100;
    }
    ```
  - Logic:
    1. Validate user authenticated
    2. Fetch purchase with ledger data
    3. Validate eligibility (unused credits > 0, within 30 days, no existing refund)
    4. Calculate refund amount based on percentage
    5. Create Stripe refund via `stripe.refunds.create()`
    6. Call `deduct_credits_for_cash_refund()` RPC
    7. Insert cash_refund_requests record (status = 'processing')
    8. Return success with refund details
  - Error handling:
    - Stripe API failure: Return 500, log error (TODO: rollback credit deduction)
    - Insufficient credits: Return 400
    - Already refunded: Return 400
  - Tests: `src/app/api/refunds/cash/__tests__/route.test.ts` (new)
    - Test successful 100% refund
    - Test successful 90% refund
    - Test insufficient credits error
    - Test duplicate refund error
    - Test 30-day window expired error
    - Test Stripe API error handling
  - Acceptance:
    - Stripe refund created successfully
    - Credits deducted from user balance
    - Refund request recorded in database
    - Errors handled gracefully

- [ ] Add cash refund utility functions
  - Files: `src/lib/db/refunds.ts` (modify)
  - Add exports:
    ```typescript
    export async function getEligibleCashRefunds(userId: string): Promise<EligiblePurchase[]>;
    export async function createCashRefundRequest(params: {
      userId: string;
      purchaseId: string;
      creditsRefunded: number;
      refundAmountCents: number;
      refundPercentage: 90 | 100;
      stripeRefundId: string;
    }): Promise<{ id: string }>;
    ```
  - Tests: `src/lib/db/__tests__/refunds.test.ts` (modify)
    - Test eligibility query
    - Test refund request creation
  - Acceptance: Functions work correctly

- [ ] Update Stripe webhook handler
  - Files: `src/app/api/webhooks/stripe/route.ts` (modify)
  - Changes:
    - Add `'charge.refunded'` to `ALLOWED_EVENTS` array
  - Files: `src/lib/stripe/webhook-handlers.ts` (modify)
  - Add case:
    ```typescript
    case 'charge.refunded':
      await handleChargeRefunded(event.data.object as Stripe.Charge);
      break;
    ```
  - Add function:
    ```typescript
    async function handleChargeRefunded(charge: Stripe.Charge) {
      const adminClient = createAdminClient();
      const refund = charge.refunds?.data[0];
      if (!refund) {
        logger.warn('Charge refunded but no refund object', { chargeId: charge.id });
        return;
      }

      const { error } = await adminClient
        .from('cash_refund_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('stripe_refund_id', refund.id);

      if (error) {
        logger.error('Failed to update cash refund status', { refundId: refund.id, error });
      } else {
        logger.info('Cash refund completed', { refundId: refund.id });
      }
    }
    ```
  - Tests: `src/lib/stripe/__tests__/webhook-handlers.test.ts` (modify)
    - Test charge.refunded updates status to completed
  - Acceptance: Webhook updates refund status correctly

### Phase 3.2: Frontend Components

- [ ] Create CashRefundSection component
  - Files: `src/components/refunds/cash-refund-section.tsx` (new)
  - Logic:
    1. `useEffect` → fetch `/api/refunds/cash/eligibility`
    2. Display eligible purchases as list
    3. Each item shows: date, credits granted, unused credits, "Request Refund" button
    4. Click button → open CashRefundModal
  - UI:
    - Card with title "Cash Refunds"
    - Description: "Request a refund for unused credits within 30 days of purchase"
    - Empty state: "No eligible purchases for cash refund"
    - Purchase list with borders, hover effects
  - Tests: `src/components/refunds/__tests__/cash-refund-section.test.tsx` (new)
    - Test fetches eligibility on mount
    - Test displays eligible purchases
    - Test empty state
    - Test opens modal on click
  - Acceptance:
    - Fetches eligibility correctly
    - Displays purchases clearly
    - Opens modal on click

- [ ] Create CashRefundModal component
  - Files: `src/components/refunds/cash-refund-modal.tsx` (new)
  - Props:
    ```typescript
    interface CashRefundModalProps {
      purchase: {
        purchaseId: string;
        creditsUnused: number;
        refundAmount100Cents: number;
        refundAmount90Cents: number;
      };
      isOpen: boolean;
      onClose: () => void;
      onSuccess: () => void; // Refresh eligibility list
    }
    ```
  - UI Elements:
    - Dialog with title "Choose Your Refund"
    - Description: "You have {N} unused credits available for refund"
    - Two equal-emphasis buttons (side-by-side or stacked):
      ```
      [DollarSign icon] $X.XX          100% back
      Get your full refund, no questions asked

      [Heart icon] $Y.YY               90% back
      Help cover costs & support ProductPix
      ```
    - Success state: "Refund Initiated!" with green checkmark
  - Logic:
    1. On button click: POST `/api/refunds/cash` with percentage
    2. Show loading state on clicked button
    3. On success: show success message, call `onSuccess()` after 3s, close modal
    4. On error: alert error message
  - Design:
    - Fun, playful tone (not corporate)
    - Equal visual weight for both options
    - No pre-selection
    - Icons: DollarSign (lucide-react), Heart (lucide-react)
    - Colors: Green accent for primary, Teal for secondary
  - Tests: `src/components/refunds/__tests__/cash-refund-modal.test.tsx` (new)
    - Test modal opens/closes
    - Test 100% option submits correctly
    - Test 90% option submits correctly
    - Test success callback triggered
  - Acceptance:
    - Modal displays correctly
    - Both options work
    - Success state shows

- [ ] Update BillingTab to add cash refund section
  - Files: `src/components/settings/billing-tab.tsx` (modify)
  - Changes:
    - Import CashRefundSection
    - Add after credit packs section:
      ```tsx
      <CashRefundSection />

      {/* Divider */}
      <div className="relative py-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/40" />
        </div>
      </div>
      ```
  - Tests: `src/components/settings/__tests__/billing-tab.test.tsx` (modify)
    - Test CashRefundSection renders
  - Acceptance: Cash refund section visible in billing tab

### Phase 3.3: Stripe Integration

- [ ] Add Stripe refund helper
  - Files: `src/lib/stripe/refunds.ts` (new)
  - Exports:
    ```typescript
    export async function createStripeRefund(params: {
      paymentIntentId: string;
      amountCents: number;
      metadata: {
        userId: string;
        purchaseId: string;
        creditsRefunded: string;
        percentage: string;
      };
    }): Promise<Stripe.Refund>;
    ```
  - Implementation:
    ```typescript
    import { stripe } from './client';

    export async function createStripeRefund(params) {
      return await stripe.refunds.create({
        payment_intent: params.paymentIntentId,
        amount: params.amountCents,
        metadata: params.metadata,
      });
    }
    ```
  - Tests: `src/lib/stripe/__tests__/refunds.test.ts` (new)
    - Test creates refund successfully (mock Stripe)
    - Test handles Stripe API errors
  - Acceptance: Stripe refund created with correct amount and metadata

## Deployment Steps

1. **Beta testing** (Week 1):
   ```bash
   # Set in Vercel environment variables
   NEXT_PUBLIC_ENABLE_CASH_REFUNDS=true

   # Deploy to staging
   vercel --prod

   # Invite beta testers (10-20 users)
   # Monitor Stripe dashboard for refunds
   ```

2. **Public launch** (Week 2):
   ```bash
   # Remove feature flag or set to true in production
   # Monitor refund volume and 100% vs 90% ratio
   # Alert if refund failure rate > 5%
   ```

## Acceptance Criteria

- [ ] Users can view eligible purchases for cash refund
- [ ] Eligibility calculation correct (unused credits, 30-day window)
- [ ] Users can choose 100% or 90% refund
- [ ] Stripe refund created successfully
- [ ] Credits deducted immediately from user balance
- [ ] Refund status updated when Stripe processes (5-10 days)
- [ ] Duplicate refund requests prevented
- [ ] Unit tests pass with ≥75% coverage
- [ ] No TypeScript errors

## Files to Create

**Backend**:
- `src/app/api/refunds/cash/eligibility/route.ts`
- `src/app/api/refunds/cash/route.ts`
- `src/lib/stripe/refunds.ts`

**Frontend**:
- `src/components/refunds/cash-refund-section.tsx`
- `src/components/refunds/cash-refund-modal.tsx`

**Tests**:
- `src/app/api/refunds/cash/__tests__/eligibility.test.ts`
- `src/app/api/refunds/cash/__tests__/route.test.ts`
- `src/lib/stripe/__tests__/refunds.test.ts`
- `src/components/refunds/__tests__/cash-refund-section.test.tsx`
- `src/components/refunds/__tests__/cash-refund-modal.test.tsx`

**Modified**:
- `src/lib/db/refunds.ts`
- `src/app/api/webhooks/stripe/route.ts`
- `src/lib/stripe/webhook-handlers.ts`
- `src/components/settings/billing-tab.tsx`

## Files to Export (Types)

- [ ] Add types to `src/types/index.ts`:
  ```typescript
  export type CashRefundStatus = 'pending' | 'processing' | 'completed' | 'failed';

  export interface CashRefundRequest {
    id: string;
    user_id: string;
    stripe_purchase_id: string;
    credits_refunded: number;
    refund_amount_cents: number;
    refund_percentage: 90 | 100;
    stripe_refund_id?: string;
    status: CashRefundStatus;
    requested_at: string;
    stripe_processed_at?: string;
    completed_at?: string;
    stripe_error?: string;
  }

  export interface EligiblePurchase {
    purchaseId: string;
    date: string;
    amountCents: number;
    creditsGranted: number;
    creditsUnused: number;
    refundAmount100Cents: number;
    refundAmount90Cents: number;
  }
  ```

## Dependencies

- Phase 1 (Database Foundation) deployed
- Phase 2 (Image Refunds) deployed
- Stripe Node SDK (`stripe` package)
- `src/lib/stripe/client.ts` (Stripe client)
- `src/components/ui/dialog.tsx`, `button.tsx`, `card.tsx` (shadcn/ui)
- `lucide-react` (icons)

## Monitoring

**Metrics to track**:
- Total cash refund requests (daily/weekly)
- 100% vs 90% selection ratio
- Total refund amount (USD)
- Stripe API failure rate
- Webhook delivery success rate

**Alerts**:
- Critical: Stripe refund API failure > 5%
- Warning: Refund amount > $1000 in single day

## User Experience Flow

1. User navigates to Settings → Billing tab
2. Scrolls past credit packs section
3. Sees "Cash Refunds" section with eligible purchases
4. **If eligible purchases exist**:
   - List shows: "Jan 15, 2025 - 200 credits | 150 unused credits available for refund"
   - User clicks "Request Refund" button
5. Modal opens: "Choose Your Refund"
6. Two equal-emphasis options displayed side-by-side:
   - Left: "$15.00 | 100% back | Get your full refund, no questions asked"
   - Right: "$13.50 | 90% back | Help cover costs & support ProductPix"
7. User clicks either option
8. Loading state on clicked button
9. Success:
   - Modal shows green checkmark
   - "Refund Initiated!"
   - "Your refund will be processed in 5-10 business days."
   - Modal closes after 3s
   - Credits deducted from balance
   - Purchase removed from eligible list
10. **If no eligible purchases**:
    - Shows: "No eligible purchases for cash refund. Refunds are available for unused credits within 30 days of purchase."

## Future Enhancements

- Email notification when refund completed
- Refund status tracking page
- Partial refunds (select specific number of credits)
- Analytics: 100% vs 90% selection by cohort
