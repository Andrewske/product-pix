-- Create cash refund requests table
-- Tracks user requests for cash refunds on entire purchases

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