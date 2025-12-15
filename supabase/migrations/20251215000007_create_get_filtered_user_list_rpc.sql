-- Create RPC function for efficient user list query with JOINs
CREATE OR REPLACE FUNCTION get_filtered_user_list(
  p_search TEXT DEFAULT NULL,
  p_has_errors BOOLEAN DEFAULT NULL,
  p_has_messages BOOLEAN DEFAULT NULL,
  p_min_credits INTEGER DEFAULT NULL,
  p_max_credits INTEGER DEFAULT NULL,
  p_created_after TIMESTAMPTZ DEFAULT NULL,
  p_created_before TIMESTAMPTZ DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc',
  p_limit INTEGER DEFAULT 20,
  p_cursor TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  display_name TEXT,
  credit_balance INTEGER,
  created_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  job_count BIGINT,
  error_count BIGINT,
  message_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seven_days_ago TIMESTAMPTZ := NOW() - INTERVAL '7 days';
  v_sql TEXT;
  v_order_clause TEXT;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  -- Build ORDER BY clause once
  v_order_clause := CASE
    WHEN p_sort_by = 'last_active' THEN 'last_active_at'
    WHEN p_sort_by = 'credit_balance' THEN 'credit_balance'
    ELSE 'created_at'
  END;

  IF p_sort_order = 'asc' THEN
    v_order_clause := v_order_clause || ' ASC';
  ELSE
    v_order_clause := v_order_clause || ' DESC';
  END IF;

  v_sql := '
    SELECT
      u.id,
      u.email,
      u.display_name,
      u.credit_balance,
      u.created_at,
      u.last_active_at,
      COALESCE(j.job_count, 0) as job_count,
      COALESCE(e.error_count, 0) as error_count,
      COALESCE(m.message_count, 0) as message_count
    FROM users u
    LEFT JOIN (SELECT user_id, COUNT(*) as job_count FROM jobs GROUP BY user_id) j ON j.user_id = u.id
    LEFT JOIN (SELECT user_id, COUNT(*) as error_count FROM critical_errors WHERE created_at >= $1 GROUP BY user_id) e ON e.user_id = u.id
    LEFT JOIN (SELECT user_id, COUNT(*) as message_count FROM user_messages WHERE is_from_admin = false GROUP BY user_id) m ON m.user_id = u.id
    WHERE
      ($2 IS NULL OR u.email ILIKE ''%%'' || $2 || ''%%'' OR u.display_name ILIKE ''%%'' || $2 || ''%%'')
      AND ($3 IS NULL OR u.credit_balance >= $3)
      AND ($4 IS NULL OR u.credit_balance <= $4)
      AND ($5 IS NULL OR u.created_at >= $5)
      AND ($6 IS NULL OR u.created_at <= $6)
      AND ($7 IS NULL OR u.created_at < $7)
      AND ($8 IS NULL OR ($8 = (COALESCE(e.error_count, 0) > 0)))
      AND ($9 IS NULL OR ($9 = (COALESCE(m.message_count, 0) > 0)))
    ORDER BY u.' || v_order_clause || '
    LIMIT $10
  ';

  RETURN QUERY EXECUTE v_sql
  USING
    v_seven_days_ago,
    p_search,
    p_min_credits,
    p_max_credits,
    p_created_after,
    p_created_before,
    p_cursor,
    p_has_errors,
    p_has_messages,
    p_limit;
END;
$$;