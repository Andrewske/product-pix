# Refund System - Phase 1: Database Foundation

## Overview

Implement FIFO (First-In-First-Out) credit attribution system to track which credits came from which purchase. This foundation enables cash refund eligibility checking without changing user-facing behavior.

**Goal**: Deploy schema changes and updated RPC functions that maintain current behavior while adding purchase-level credit tracking.

## Architecture Decisions

### FIFO Ledger System
- **Choice**: Add `purchase_credit_ledger` table with parallel tracking to fungible balance
- **Rationale**:
  - User balance remains fast (single integer query)
  - Ledger provides attribution for refund eligibility
  - No breaking changes to existing credit system
  - Credits consumed from oldest purchase first (FIFO = fair)

### Ledger Structure
- **Fields**: `credits_granted`, `credits_consumed`, `credits_refunded_image`, `credits_refunded_cash`
- **Constraint**: `consumed + refunded_image + refunded_cash ≤ granted`
- **Why**: Prevents over-allocation, provides audit trail

## Implementation Tasks

### Phase 1.1: Create Database Schema

- [ ] Create purchase credit ledger table
  - Files: `supabase/migrations/00023_create_purchase_credit_ledger.sql` (new)
  - SQL:
    ```sql
    CREATE TABLE public.purchase_credit_ledger (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      stripe_purchase_id UUID NOT NULL REFERENCES public.stripe_purchases(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      credits_granted INTEGER NOT NULL,
      credits_consumed INTEGER NOT NULL DEFAULT 0,
      credits_refunded_image INTEGER NOT NULL DEFAULT 0,
      credits_refunded_cash INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT valid_credit_allocation CHECK (
        credits_consumed + credits_refunded_image + credits_refunded_cash <= credits_granted
      )
    );

    CREATE UNIQUE INDEX idx_purchase_ledger_unique_purchase
      ON public.purchase_credit_ledger(stripe_purchase_id);
    CREATE INDEX idx_purchase_ledger_user_id
      ON public.purchase_credit_ledger(user_id);
    CREATE INDEX idx_purchase_ledger_created_at
      ON public.purchase_credit_ledger(created_at ASC);

    ALTER TABLE public.purchase_credit_ledger ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view own purchase ledger"
      ON public.purchase_credit_ledger FOR SELECT USING (auth.uid() = user_id);

    -- Backfill existing purchases
    INSERT INTO public.purchase_credit_ledger (stripe_purchase_id, user_id, credits_granted)
    SELECT id, user_id, credits_granted FROM public.stripe_purchases
    ON CONFLICT (stripe_purchase_id) DO NOTHING;
    ```
  - Tests: Manual verification after migration (check backfill count matches stripe_purchases count)
  - Acceptance:
    - Migration runs without errors
    - All existing purchases have ledger entries
    - UNIQUE constraint prevents duplicates

- [ ] Create refund type enums
  - Files: `supabase/migrations/00024_create_refund_types.sql` (new)
  - SQL:
    ```sql
    CREATE TYPE refund_reason AS ENUM (
      'poor_quality',
      'wrong_style',
      'technical_issue',
      'other'
    );

    CREATE TYPE refund_status AS ENUM (
      'pending_auto',
      'pending_admin',
      'approved',
      'rejected'
    );

    CREATE TYPE cash_refund_status AS ENUM (
      'pending',
      'processing',
      'completed',
      'failed'
    );
    ```
  - Acceptance: Types created successfully

- [ ] Create image refund requests table
  - Files: `supabase/migrations/00025_create_image_refund_requests.sql` (new)
  - SQL:
    ```sql
    CREATE TABLE public.image_refund_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      image_id UUID NOT NULL REFERENCES public.generated_images(id) ON DELETE CASCADE,
      job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
      status refund_status NOT NULL DEFAULT 'pending_auto',
      reason refund_reason NOT NULL,
      feedback TEXT,
      credits_refunded INTEGER NOT NULL,
      reviewed_by UUID REFERENCES public.users(id),
      admin_notes TEXT,
      requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      processed_at TIMESTAMPTZ,
      CONSTRAINT unique_image_refund UNIQUE(image_id)
    );

    CREATE INDEX idx_refund_requests_user_id
      ON public.image_refund_requests(user_id);
    CREATE INDEX idx_refund_requests_status
      ON public.image_refund_requests(status);
    CREATE INDEX idx_refund_requests_pending_admin
      ON public.image_refund_requests(requested_at DESC)
      WHERE status = 'pending_admin';

    ALTER TABLE public.image_refund_requests ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view own refund requests"
      ON public.image_refund_requests FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own refund requests"
      ON public.image_refund_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
    ```
  - Acceptance: Table created, RLS policies active, UNIQUE constraint on image_id works

- [ ] Create cash refund requests table
  - Files: `supabase/migrations/00026_create_cash_refund_requests.sql` (new)
  - SQL:
    ```sql
    CREATE TABLE public.cash_refund_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      stripe_purchase_id UUID NOT NULL REFERENCES public.stripe_purchases(id) ON DELETE CASCADE,
      credits_refunded INTEGER NOT NULL,
      refund_amount_cents INTEGER NOT NULL,
      refund_percentage SMALLINT NOT NULL CHECK (refund_percentage IN (90, 100)),
      stripe_refund_id TEXT UNIQUE,
      status cash_refund_status NOT NULL DEFAULT 'pending',
      requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      stripe_processed_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      stripe_error TEXT,
      CONSTRAINT unique_purchase_cash_refund UNIQUE(stripe_purchase_id)
    );

    CREATE INDEX idx_cash_refunds_user_id ON public.cash_refund_requests(user_id);
    CREATE INDEX idx_cash_refunds_status ON public.cash_refund_requests(status);
    CREATE INDEX idx_cash_refunds_stripe_refund_id
      ON public.cash_refund_requests(stripe_refund_id)
      WHERE stripe_refund_id IS NOT NULL;

    ALTER TABLE public.cash_refund_requests ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view own cash refund requests"
      ON public.cash_refund_requests FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own cash refund requests"
      ON public.cash_refund_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
    ```
  - Acceptance: Table created, UNIQUE constraint on stripe_purchase_id works

- [ ] Add admin role to users table
  - Files: `supabase/migrations/00027_add_admin_role.sql` (new)
  - SQL:
    ```sql
    ALTER TABLE public.users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;
    CREATE INDEX idx_users_is_admin ON public.users(is_admin) WHERE is_admin = true;

    -- Admin policies for refund tables
    CREATE POLICY "Admins can view all image refund requests"
      ON public.image_refund_requests FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
      );

    CREATE POLICY "Admins can update image refund requests"
      ON public.image_refund_requests FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
      );

    CREATE POLICY "Admins can view all cash refund requests"
      ON public.cash_refund_requests FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
      );
    ```
  - Acceptance: Column added, policies created

- [ ] Add refund transaction types
  - Files: `supabase/migrations/00028_add_refund_transaction_types.sql` (new)
  - SQL:
    ```sql
    ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'image_refund';
    ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'cash_refund_reversal';
    ```
  - Acceptance: New enum values available

### Phase 1.2: Update RPC Functions

- [ ] Update consume_credits RPC to track FIFO ledger
  - Files: `supabase/migrations/00029_update_consume_credits_rpc.sql` (new)
  - SQL:
    ```sql
    CREATE OR REPLACE FUNCTION consume_credits(
      p_user_id UUID,
      p_amount INTEGER,
      p_job_id UUID,
      p_description TEXT DEFAULT 'Image generation'
    )
    RETURNS TABLE(success BOOLEAN, new_balance INTEGER)
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      v_current_balance INTEGER;
      v_new_balance INTEGER;
      v_remaining_to_consume INTEGER;
      v_ledger_entry RECORD;
      v_consume_from_entry INTEGER;
      v_available INTEGER;
    BEGIN
      -- Lock user row
      SELECT credit_balance INTO v_current_balance
      FROM public.users WHERE id = p_user_id FOR UPDATE;

      IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
        RETURN QUERY SELECT FALSE, COALESCE(v_current_balance, 0);
        RETURN;
      END IF;

      v_new_balance := v_current_balance - p_amount;
      v_remaining_to_consume := p_amount;

      -- Update balance
      UPDATE public.users SET credit_balance = v_new_balance WHERE id = p_user_id;

      -- Record transaction
      INSERT INTO public.credit_transactions (
        user_id, amount, balance_after, transaction_type, description, reference_id
      ) VALUES (
        p_user_id, -p_amount, v_new_balance, 'generation', p_description, p_job_id
      );

      -- FIFO: Consume from oldest purchases first
      FOR v_ledger_entry IN
        SELECT id, credits_granted, credits_consumed, credits_refunded_image, credits_refunded_cash
        FROM public.purchase_credit_ledger
        WHERE user_id = p_user_id
        ORDER BY created_at ASC
        FOR UPDATE
      LOOP
        v_available := v_ledger_entry.credits_granted
                     - v_ledger_entry.credits_consumed
                     - v_ledger_entry.credits_refunded_image
                     - v_ledger_entry.credits_refunded_cash;

        IF v_available > 0 THEN
          v_consume_from_entry := LEAST(v_available, v_remaining_to_consume);

          UPDATE public.purchase_credit_ledger
          SET credits_consumed = credits_consumed + v_consume_from_entry,
              updated_at = NOW()
          WHERE id = v_ledger_entry.id;

          v_remaining_to_consume := v_remaining_to_consume - v_consume_from_entry;

          IF v_remaining_to_consume = 0 THEN EXIT; END IF;
        END IF;
      END LOOP;

      -- Sanity check
      IF v_remaining_to_consume != 0 THEN
        RAISE EXCEPTION 'Ledger tracking failed: % credits not allocated', v_remaining_to_consume;
      END IF;

      RETURN QUERY SELECT TRUE, v_new_balance;
    END;
    $$;
    ```
  - Tests: `src/lib/db/__tests__/purchase-ledger.test.ts` (new)
    - Test single purchase consumption
    - Test multi-purchase FIFO consumption
    - Test partial consumption across purchases
    - Test ledger mismatch exception
  - Acceptance:
    - Existing credit consumption still works
    - Ledger updates correctly in FIFO order
    - No performance degradation (test with 100 purchases)

- [ ] Create refund_credits_for_image RPC
  - Files: `supabase/migrations/00030_create_refund_credits_for_image_rpc.sql` (new)
  - SQL:
    ```sql
    CREATE OR REPLACE FUNCTION refund_credits_for_image(
      p_user_id UUID,
      p_amount INTEGER,
      p_image_id UUID,
      p_refund_request_id UUID,
      p_description TEXT DEFAULT 'Image refund'
    )
    RETURNS TABLE(success BOOLEAN, new_balance INTEGER)
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      v_result RECORD;
      v_ledger_entry RECORD;
      v_remaining_to_refund INTEGER;
      v_refund_to_entry INTEGER;
    BEGIN
      -- Add credits back via existing add_credits function
      SELECT * INTO v_result FROM add_credits(
        p_user_id, p_amount, 'image_refund', p_description, p_refund_request_id
      );

      IF NOT v_result.success THEN
        RETURN QUERY SELECT FALSE, 0;
        RETURN;
      END IF;

      -- Reverse FIFO: Credit oldest purchases first
      v_remaining_to_refund := p_amount;

      FOR v_ledger_entry IN
        SELECT id, credits_consumed
        FROM public.purchase_credit_ledger
        WHERE user_id = p_user_id AND credits_consumed > 0
        ORDER BY created_at ASC
        FOR UPDATE
      LOOP
        v_refund_to_entry := LEAST(v_ledger_entry.credits_consumed, v_remaining_to_refund);

        UPDATE public.purchase_credit_ledger
        SET credits_refunded_image = credits_refunded_image + v_refund_to_entry,
            updated_at = NOW()
        WHERE id = v_ledger_entry.id;

        v_remaining_to_refund := v_remaining_to_refund - v_refund_to_entry;
        IF v_remaining_to_refund = 0 THEN EXIT; END IF;
      END LOOP;

      RETURN QUERY SELECT v_result.success, v_result.new_balance;
    END;
    $$;
    ```
  - Tests: `src/lib/db/__tests__/refund-credits.test.ts` (new)
    - Test refund updates ledger correctly
    - Test refund after consumption
    - Test multiple refunds from same purchase
  - Acceptance: Credits refunded and ledger updated correctly

- [ ] Create deduct_credits_for_cash_refund RPC
  - Files: `supabase/migrations/00031_create_deduct_credits_for_cash_refund_rpc.sql` (new)
  - SQL:
    ```sql
    CREATE OR REPLACE FUNCTION deduct_credits_for_cash_refund(
      p_user_id UUID,
      p_stripe_purchase_id UUID,
      p_amount INTEGER,
      p_cash_refund_id UUID
    )
    RETURNS TABLE(success BOOLEAN, new_balance INTEGER)
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      v_current_balance INTEGER;
      v_new_balance INTEGER;
    BEGIN
      -- Lock user row
      SELECT credit_balance INTO v_current_balance
      FROM public.users WHERE id = p_user_id FOR UPDATE;

      IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
        RETURN QUERY SELECT FALSE, COALESCE(v_current_balance, 0);
        RETURN;
      END IF;

      v_new_balance := v_current_balance - p_amount;

      -- Update balance
      UPDATE public.users SET credit_balance = v_new_balance WHERE id = p_user_id;

      -- Record negative transaction
      INSERT INTO public.credit_transactions (
        user_id, amount, balance_after, transaction_type, description, reference_id
      ) VALUES (
        p_user_id, -p_amount, v_new_balance, 'cash_refund_reversal',
        'Credits deducted for cash refund', p_cash_refund_id
      );

      -- Update specific purchase ledger entry
      UPDATE public.purchase_credit_ledger
      SET credits_refunded_cash = credits_refunded_cash + p_amount,
          updated_at = NOW()
      WHERE stripe_purchase_id = p_stripe_purchase_id;

      RETURN QUERY SELECT TRUE, v_new_balance;
    END;
    $$;
    ```
  - Tests: Test cash refund deduction updates ledger correctly
  - Acceptance: Credits deducted and ledger updated for specific purchase

### Phase 1.3: Update Application Code

- [ ] Update grantCreditsForPayment to populate ledger
  - Files: `src/lib/stripe/credits.ts` (modify)
  - Changes:
    ```typescript
    // After successful addCredits() call, add:
    const { data: purchase } = await supabase
      .from('stripe_purchases')
      .select('id')
      .eq('stripe_payment_intent_id', params.paymentIntentId)
      .single();

    if (purchase) {
      await supabase.from('purchase_credit_ledger').insert({
        stripe_purchase_id: purchase.id,
        user_id: params.userId,
        credits_granted: params.credits,
      });
    }
    ```
  - Tests: `src/lib/stripe/__tests__/credits.test.ts` (modify)
    - Test ledger entry created on credit grant
    - Test duplicate payment doesn't create duplicate ledger entry
  - Acceptance: Every new purchase creates ledger entry

## Deployment Steps

1. **Staging deployment**:
   ```bash
   # Apply migrations
   npx supabase db push

   # Verify backfill count
   # Run in Supabase SQL editor:
   SELECT COUNT(*) FROM stripe_purchases;
   SELECT COUNT(*) FROM purchase_credit_ledger;
   # Counts should match

   # Test credit consumption (check logs for errors)
   # Generate test image, verify ledger updated
   ```

2. **Production deployment**:
   ```bash
   npx supabase db push

   # Monitor error logs for 24 hours
   # Check ledger balance vs user balance alignment
   ```

## Acceptance Criteria

- [ ] All migrations run successfully in staging and production
- [ ] Backfill creates ledger entries for all existing purchases
- [ ] Credit consumption still works identically (no user-facing changes)
- [ ] Ledger updates correctly in FIFO order on consumption
- [ ] New purchases create ledger entries automatically
- [ ] No performance degradation (< 50ms for credit consumption with 100 purchases)
- [ ] Unit tests pass with ≥75% coverage for RPC functions

## Files to Create

**Migrations**:
- `supabase/migrations/00023_create_purchase_credit_ledger.sql`
- `supabase/migrations/00024_create_refund_types.sql`
- `supabase/migrations/00025_create_image_refund_requests.sql`
- `supabase/migrations/00026_create_cash_refund_requests.sql`
- `supabase/migrations/00027_add_admin_role.sql`
- `supabase/migrations/00028_add_refund_transaction_types.sql`
- `supabase/migrations/00029_update_consume_credits_rpc.sql`
- `supabase/migrations/00030_create_refund_credits_for_image_rpc.sql`
- `supabase/migrations/00031_create_deduct_credits_for_cash_refund_rpc.sql`

**Tests**:
- `src/lib/db/__tests__/purchase-ledger.test.ts`
- `src/lib/db/__tests__/refund-credits.test.ts`

**Modified**:
- `src/lib/stripe/credits.ts`
- `src/lib/stripe/__tests__/credits.test.ts`

## Dependencies

- Existing Stripe integration (`src/lib/stripe/`)
- Existing credit system (`src/lib/db/credits.ts`)
- Supabase admin client
- PostgreSQL 14+ (for `ALTER TYPE ADD VALUE IF NOT EXISTS`)

## Rollback Plan

If issues arise after deployment:

1. **RPC functions**: Can revert to previous version without data loss
2. **Tables**: Cannot drop (would lose data), but can stop using them
3. **Ledger tracking**: Can disable in `consume_credits()` by removing FIFO loop (data preserved)

**Safe rollback**: Revert `consume_credits()` RPC to previous version. Ledger data preserved for future use.
