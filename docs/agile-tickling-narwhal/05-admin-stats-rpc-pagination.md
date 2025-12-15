# Fix Admin Stats RPC Pagination

## Priority
**MEDIUM** - Incorrect pagination logic and query optimization

## Files to Modify
- `supabase/migrations/20251215000007_create_get_filtered_user_list_rpc.sql` (modify)
- `src/lib/db/admin-stats.ts` (modify)

## Implementation Details

### Task 5.1: Remove LEAD Window Function from RPC

**File:** `supabase/migrations/20251215000007_create_get_filtered_user_list_rpc.sql`

**Issue:** Line 91 uses `LEAD(us.created_at) OVER (ORDER BY us.created_at DESC) as next_cursor` which returns the *next* row's created_at. For cursor-based pagination, we need the *last returned row's* created_at.

**Fix:**

**Line 25** - Remove `next_cursor` from RETURNS TABLE:
```sql
-- Before
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
  next_cursor TIMESTAMPTZ  -- REMOVE THIS LINE
)

-- After
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
```

**Line 91** - Remove LEAD from SELECT:
```sql
-- Before
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
  LEAD(us.created_at) OVER (ORDER BY us.created_at DESC) as next_cursor  -- REMOVE THIS
FROM user_stats us

-- After
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
```

### Task 5.2: Compute Cursor in Application Code

**File:** `src/lib/db/admin-stats.ts`

**Issue:** Currently expects `next_cursor` from RPC result (line 298). Need to compute it from last returned row instead.

**Fix:** Around lines 284-303, update the mapping logic:

```typescript
// Before (lines 284-303)
const users: UserListItem[] = data.map((user) => ({
  id: user.id,
  email: user.email,
  displayName: user.display_name,
  creditBalance: user.credit_balance,
  createdAt: user.created_at,
  lastActiveAt: user.last_active_at,
  jobCount: Number(user.job_count),
  errorCount: Number(user.error_count),
  messageCount: Number(user.message_count)
}));

// Get next cursor from the first result (since RPC returns it for each row)
const nextCursor = data[0]?.next_cursor || null;

// After
const users: UserListItem[] = data.map((user) => ({
  id: user.id,
  email: user.email,
  displayName: user.display_name,
  creditBalance: user.credit_balance,
  createdAt: user.created_at,
  lastActiveAt: user.last_active_at,
  jobCount: Number(user.job_count),
  errorCount: Number(user.error_count),
  messageCount: Number(user.message_count)
}));

// Compute next cursor from last returned row
const nextCursor = users.length === options.limit && users.length > 0
  ? users[users.length - 1].createdAt
  : null;
```

**Rationale:**
- Simpler logic (no window function needed)
- Application already has all the data it needs
- Matches pattern used in `admin-timeline.ts:101-102`
- More obvious cursor semantics

### Task 5.3: Fix Active Users Query

**File:** `src/lib/db/admin-stats.ts`

**Issue:** Lines 108-112 count all activity rows, not distinct users. If a user has 10 activities today, they're counted 10 times instead of once.

**Fix:** Lines 106-120, change query to count distinct users:

```typescript
// Before
const fetchActiveUsersToday = async (supabase: SupabaseClient<Database>): Promise<number> => {
  const { startOfDay, endOfDay } = getTodayRange();
  const { count, error } = await supabase
    .from('user_activity')
    .select('user_id', { count: 'exact', head: true })
    .gte('created_at', startOfDay)
    .lt('created_at', endOfDay);

  if (error) {
    logger.error('Error fetching active users today', { error: error.message });
    throw error;
  }

  return count || 0;
};

// After
const fetchActiveUsersToday = async (supabase: SupabaseClient<Database>): Promise<number> => {
  const { startOfDay, endOfDay } = getTodayRange();
  const { data, error } = await supabase
    .from('user_activity')
    .select('user_id', { count: 'exact', head: false })
    .gte('created_at', startOfDay)
    .lt('created_at', endOfDay);

  if (error) {
    logger.error('Error fetching active users today', { error: error.message });
    throw error;
  }

  // Count unique user_ids
  const uniqueUsers = new Set(data?.map(row => row.user_id) || []);
  return uniqueUsers.size;
};
```

## Acceptance Criteria
- [ ] RPC no longer returns `next_cursor` field
- [ ] Application computes cursor from last item in results
- [ ] Pagination works correctly (loads next page when clicking "Load More")
- [ ] Active users count shows distinct users, not total activity count
- [ ] User with 5 activities today counts as 1 active user, not 5

## Testing Steps
1. Apply RPC migration changes
2. Test pagination:
    - Load user list
    - Click "Load More"
    - Verify next page loads correctly
3. Test active users stat:
    - Insert multiple activities for same user today
    - Check dashboard stats
    - Verify user counted once

## Dependencies
None - these are isolated pagination fixes