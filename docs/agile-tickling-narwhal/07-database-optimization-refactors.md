# Database Optimization Refactors

## Priority
**LOW** - Code quality improvements, no functional changes

## Files to Modify
- `supabase/migrations/20251215000007_create_get_filtered_user_list_rpc.sql` (modify)
- `supabase/migrations/20251215000006_create_unified_timeline_view.sql` (modify)

## Implementation Details

### Task 7.1: Refactor Duplicated ORDER BY Logic in RPC

**File:** `supabase/migrations/20251215000007_create_get_filtered_user_list_rpc.sql`

**Issue:** Lines 62-76 and 96-110 contain identical ORDER BY building logic. DRY violation makes maintenance harder.

**Fix:** Build ORDER BY clause once and reuse it:

```sql
DECLARE
  v_seven_days_ago TIMESTAMPTZ := NOW() - INTERVAL '7 days';
  v_order_clause TEXT;  -- ADD THIS
  v_sql TEXT;
BEGIN
  -- ADD ADMIN CHECK HERE (from Task 1.1)

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

  -- Use v_order_clause in query building
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
      ORDER BY u.' || v_order_clause || '
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
      us.message_count
    FROM user_stats us
    ORDER BY us.' || v_order_clause;

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
```

**Benefits:**
- Single source of truth for ORDER BY logic
- Easier to add new sort options
- Less error-prone maintenance

### Task 7.2: Add Materialized View TODO Comment

**File:** `supabase/migrations/20251215000006_create_unified_timeline_view.sql`

**Issue:** Current implementation uses regular VIEW (UNION ALL across 8 tables on every query). This will be slow for users with lots of activity.

**Fix:** Add TODO comment after line 3:

```sql
-- Drop existing view if recreating
DROP VIEW IF EXISTS public.user_timeline_view;

-- TODO: Convert to MATERIALIZED VIEW for better performance with large datasets
-- Will require refresh strategy (manual, trigger-based, or scheduled)
-- Example: CREATE MATERIALIZED VIEW user_timeline_view AS ...
-- Then: REFRESH MATERIALIZED VIEW user_timeline_view;

-- Unified timeline view (UNION ALL of 8 tables)
CREATE VIEW public.user_timeline_view AS
```

**Note:** This is documentation only. Implementing materialized view requires:
- Deciding refresh strategy (real-time triggers vs scheduled job)
- Setting up refresh mechanism
- Testing performance impact
- Beyond scope of this fix

## Acceptance Criteria
- [ ] RPC function uses single v_order_clause variable
- [ ] ORDER BY logic appears only once in RPC
- [ ] TODO comment added to timeline view migration
- [ ] All existing functionality still works

## Testing Steps
1. Apply migration changes
2. Test user list sorting:
   - Sort by created_at (asc/desc)
   - Sort by last_active (asc/desc)
   - Sort by credit_balance (asc/desc)
3. Verify all sort options work correctly
4. Check migration file has TODO comment

## Dependencies
- Should be done after Task 5.1 (remove LEAD from RPC)
- Can be done independently of other tasks
