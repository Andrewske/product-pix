-- Update consume_credits RPC to track FIFO ledger
-- Credits are consumed from oldest purchases first

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