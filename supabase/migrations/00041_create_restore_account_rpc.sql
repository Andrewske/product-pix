-- supabase/migrations/00041_create_restore_account_rpc.sql
CREATE OR REPLACE FUNCTION restore_deleted_account(p_user_id UUID, p_admin_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_original_email TEXT;
  v_deleted_at TIMESTAMPTZ;
BEGIN
  -- Set transaction isolation to prevent race conditions
  SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

  -- Verify admin authorization
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_admin_id AND is_admin = true) THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized - admin access required'::TEXT;
    RETURN;
  END IF;

  -- Get deleted user info
  SELECT original_email, deleted_at INTO v_original_email, v_deleted_at
  FROM users WHERE id = p_user_id;

  IF v_deleted_at IS NULL THEN
    RETURN QUERY SELECT FALSE, 'User is not deleted'::TEXT;
    RETURN;
  END IF;

  -- Check 30-day window
  IF v_deleted_at < NOW() - INTERVAL '30 days' THEN
    RETURN QUERY SELECT FALSE, 'Deletion period expired (>30 days)'::TEXT;
    RETURN;
  END IF;

  -- Check email conflict
  IF v_original_email IS NOT NULL AND EXISTS (
    SELECT 1 FROM users WHERE email = v_original_email AND deleted_at IS NULL
  ) THEN
    RETURN QUERY SELECT FALSE, 'Original email is now used by another account'::TEXT;
    RETURN;
  END IF;

  -- Restore user (atomic transaction)
  UPDATE users SET
    email = original_email,
    deleted_at = NULL,
    original_email = NULL
  WHERE id = p_user_id;

  UPDATE uploads SET deleted_at = NULL WHERE user_id = p_user_id;
  UPDATE generated_images SET deleted_at = NULL WHERE user_id = p_user_id;

  RETURN QUERY SELECT TRUE, 'Account restored successfully'::TEXT;
END;
$$;