-- Create purchase credit ledger table for FIFO credit attribution
-- This enables tracking which credits came from which purchase for refund eligibility

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