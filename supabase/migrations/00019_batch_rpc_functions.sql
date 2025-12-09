-- Migration: Create batch RPC functions
-- Atomic credit consumption, batch progress updates, and refunds

-- create_batch_job: Atomic credit consumption + batch creation
CREATE OR REPLACE FUNCTION create_batch_job(
  p_user_id UUID,
  p_name TEXT,
  p_total_items INTEGER,
  p_credits_to_charge INTEGER,
  p_default_prompt TEXT DEFAULT NULL,
  p_parameters JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_batch_id UUID;
  v_current_credits INTEGER;
BEGIN
  -- Check credits
  SELECT credit_balance INTO v_current_credits
  FROM users WHERE id = p_user_id FOR UPDATE;

  IF v_current_credits IS NULL OR v_current_credits < p_credits_to_charge THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Consume credits
  UPDATE users
  SET credit_balance = credit_balance - p_credits_to_charge
  WHERE id = p_user_id;

  -- Create credit transaction
  INSERT INTO credit_transactions (user_id, amount, balance_after, transaction_type, description)
  VALUES (
    p_user_id,
    -p_credits_to_charge,
    v_current_credits - p_credits_to_charge,
    'generation',
    'Batch generation: ' || p_name
  );

  -- Create batch job
  INSERT INTO batch_jobs (
    user_id, name, total_items, credits_charged,
    default_prompt, parameters
  ) VALUES (
    p_user_id, p_name, p_total_items, p_credits_to_charge,
    p_default_prompt, p_parameters
  ) RETURNING id INTO v_batch_id;

  RETURN v_batch_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- update_batch_progress: Update counters and status
CREATE OR REPLACE FUNCTION update_batch_progress(
  p_batch_id UUID,
  p_completed INTEGER,
  p_failed INTEGER
) RETURNS VOID AS $$
DECLARE
  v_total INTEGER;
  v_new_status batch_job_status;
BEGIN
  SELECT total_items INTO v_total FROM batch_jobs WHERE id = p_batch_id;

  -- Determine status
  IF (p_completed + p_failed) >= v_total THEN
    v_new_status := 'completed';
  ELSE
    v_new_status := 'processing';
  END IF;

  UPDATE batch_jobs
  SET
    completed_items = p_completed,
    failed_items = p_failed,
    status = v_new_status,
    completed_at = CASE WHEN v_new_status = 'completed' THEN NOW() ELSE NULL END
  WHERE id = p_batch_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- refund_batch_failures: Refund for failed items
CREATE OR REPLACE FUNCTION refund_batch_failures(
  p_batch_id UUID,
  p_credits_per_item INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_user_id UUID;
  v_failed_count INTEGER;
  v_refund_amount INTEGER;
  v_current_balance INTEGER;
BEGIN
  SELECT user_id, failed_items INTO v_user_id, v_failed_count
  FROM batch_jobs WHERE id = p_batch_id;

  v_refund_amount := v_failed_count * p_credits_per_item;

  IF v_refund_amount > 0 THEN
    -- Get current balance
    SELECT credit_balance INTO v_current_balance
    FROM users WHERE id = v_user_id FOR UPDATE;

    -- Add credits back
    UPDATE users
    SET credit_balance = credit_balance + v_refund_amount
    WHERE id = v_user_id;

    -- Create credit transaction
    INSERT INTO credit_transactions (user_id, amount, balance_after, transaction_type, description)
    VALUES (
      v_user_id,
      v_refund_amount,
      COALESCE(v_current_balance, 0) + v_refund_amount,
      'refund',
      'Batch refund: failed items'
    );

    -- Update batch
    UPDATE batch_jobs
    SET credits_refunded = v_refund_amount
    WHERE id = p_batch_id;
  END IF;

  RETURN v_refund_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

