-- supabase/migrations/00021_create_stripe_tables.sql
-- Stripe integration tables for payments and subscriptions

-- Add Stripe customer ID to users table
ALTER TABLE public.users 
ADD COLUMN stripe_customer_id TEXT UNIQUE;

-- Create stripe_subscriptions table
CREATE TABLE public.stripe_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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

-- Create stripe_purchases table for credit pack purchases and subscription renewals
CREATE TABLE public.stripe_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL, -- Prevents duplicate inserts
  stripe_customer_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  credits_granted INTEGER NOT NULL,
  purchase_type TEXT NOT NULL, -- 'pack' or 'subscription_renewal' or 'subscription_upgrade'
  metadata JSONB, -- {packId, tier, periodStart, etc.}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new transaction types for Stripe purchases
ALTER TYPE transaction_type ADD VALUE 'pack_purchase';
ALTER TYPE transaction_type ADD VALUE 'subscription_renewal';
ALTER TYPE transaction_type ADD VALUE 'subscription_upgrade';

-- Indexes for performance
CREATE INDEX idx_stripe_subscriptions_user_id ON public.stripe_subscriptions(user_id);
CREATE INDEX idx_stripe_subscriptions_stripe_customer_id ON public.stripe_subscriptions(stripe_customer_id);
CREATE INDEX idx_stripe_subscriptions_status ON public.stripe_subscriptions(status);
CREATE INDEX idx_stripe_purchases_user_id ON public.stripe_purchases(user_id);
CREATE INDEX idx_stripe_purchases_stripe_customer_id ON public.stripe_purchases(stripe_customer_id);
CREATE INDEX idx_stripe_purchases_payment_intent_id ON public.stripe_purchases(stripe_payment_intent_id);
CREATE INDEX idx_users_stripe_customer_id ON public.users(stripe_customer_id);

-- Enable RLS
ALTER TABLE public.stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only see their own data)
CREATE POLICY "Users can view own stripe subscriptions" ON public.stripe_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own stripe purchases" ON public.stripe_purchases
  FOR SELECT USING (auth.uid() = user_id);

-- Auto-update updated_at for stripe_subscriptions
CREATE TRIGGER stripe_subscriptions_updated_at
  BEFORE UPDATE ON public.stripe_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
