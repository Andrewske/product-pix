-- Create deduct_credits_for_cash_refund RPC
-- Deducts credits from specific purchase for cash refund processing

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