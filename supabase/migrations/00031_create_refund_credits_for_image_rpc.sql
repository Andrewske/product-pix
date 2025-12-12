-- Create refund_credits_for_image RPC
-- Credits refunded to oldest purchases first (reverse FIFO)

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