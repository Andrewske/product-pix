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
  message_count BIGINT,
  next_cursor TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seven_days_ago TIMESTAMPTZ := NOW() - INTERVAL '7 days';
  v_sql TEXT;
BEGIN
  v_sql := '
    WITH user_stats AS (
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
      ORDER BY ';

  -- Add sorting logic
  IF p_sort_by = 'created_at' THEN
    v_sql := v_sql || 'u.created_at';
  ELSIF p_sort_by = 'last_active' THEN
    v_sql := v_sql || 'u.last_active_at';
  ELSIF p_sort_by = 'credit_balance' THEN
    v_sql := v_sql || 'u.credit_balance';
  ELSE
    v_sql := v_sql || 'u.created_at';
  END IF;

  IF p_sort_order = 'asc' THEN
    v_sql := v_sql || ' ASC';
  ELSE
    v_sql := v_sql || ' DESC';
  END IF;

  v_sql := v_sql || '
      LIMIT $10
    )
    SELECT
      us.id,
      us.email,
      us.display_name,
      us.credit_balance,
      us.created_at,
      us.last_active_at,
      us.job_count,
      us.error_count,
      us.message_count,
      LEAD(us.created_at) OVER (ORDER BY us.created_at DESC) as next_cursor
    FROM user_stats us
    ORDER BY ';

  -- Repeat sorting for the final ORDER BY
  IF p_sort_by = 'created_at' THEN
    v_sql := v_sql || 'us.created_at';
  ELSIF p_sort_by = 'last_active' THEN
    v_sql := v_sql || 'us.last_active_at';
  ELSIF p_sort_by = 'credit_balance' THEN
    v_sql := v_sql || 'us.credit_balance';
  ELSE
    v_sql := v_sql || 'us.created_at';
  END IF;

  IF p_sort_order = 'asc' THEN
    v_sql := v_sql || ' ASC';
  ELSE
    v_sql := v_sql || ' DESC';
  END IF;

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