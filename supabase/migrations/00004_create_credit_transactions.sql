-- supabase/migrations/00004_create_credit_transactions.sql
-- Immutable credit transaction ledger

CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  transaction_type transaction_type NOT NULL,
  reference_id UUID,
  description TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);
CREATE INDEX idx_credit_transactions_type ON public.credit_transactions(transaction_type);

-- Enable RLS
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Atomic credit addition function
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type transaction_type,
  p_description TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, transaction_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Check idempotency
  IF p_idempotency_key IS NOT NULL THEN
    SELECT ct.id INTO v_transaction_id
    FROM public.credit_transactions ct
    WHERE ct.idempotency_key = p_idempotency_key;

    IF v_transaction_id IS NOT NULL THEN
      SELECT u.credit_balance INTO v_current_balance
      FROM public.users u WHERE u.id = p_user_id;

      RETURN QUERY SELECT TRUE, v_current_balance, v_transaction_id;
      RETURN;
    END IF;
  END IF;

  -- Lock user row for atomic update
  SELECT credit_balance INTO v_current_balance
  FROM public.users
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, NULL::UUID;
    RETURN;
  END IF;

  v_new_balance := v_current_balance + p_amount;

  -- Update balance
  UPDATE public.users
  SET credit_balance = v_new_balance
  WHERE id = p_user_id;

  -- Record transaction
  INSERT INTO public.credit_transactions (
    user_id, amount, balance_after, transaction_type,
    description, reference_id, idempotency_key
  )
  VALUES (
    p_user_id, p_amount, v_new_balance, p_type,
    p_description, p_reference_id, p_idempotency_key
  )
  RETURNING id INTO v_transaction_id;

  RETURN QUERY SELECT TRUE, v_new_balance, v_transaction_id;
END;
$$;

-- Atomic credit consumption function
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
BEGIN
  -- Lock user row
  SELECT credit_balance INTO v_current_balance
  FROM public.users
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
    RETURN QUERY SELECT FALSE, COALESCE(v_current_balance, 0);
    RETURN;
  END IF;

  v_new_balance := v_current_balance - p_amount;

  -- Update balance
  UPDATE public.users
  SET credit_balance = v_new_balance
  WHERE id = p_user_id;

  -- Record transaction
  INSERT INTO public.credit_transactions (
    user_id, amount, balance_after, transaction_type,
    description, reference_id
  )
  VALUES (
    p_user_id, -p_amount, v_new_balance, 'generation',
    p_description, p_job_id
  );

  RETURN QUERY SELECT TRUE, v_new_balance;
END;
$$;

-- Refund credits function
CREATE OR REPLACE FUNCTION refund_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_job_id UUID,
  p_description TEXT DEFAULT 'Refund for failed generation'
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result RECORD;
BEGIN
  SELECT * INTO v_result FROM add_credits(
    p_user_id,
    p_amount,
    'refund',
    p_description,
    p_job_id
  );

  RETURN QUERY SELECT v_result.success, v_result.new_balance;
END;
$$;