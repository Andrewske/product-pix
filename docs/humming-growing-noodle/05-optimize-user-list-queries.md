# Fix N+1 Query Problem in User List with SQL JOINs

## Files to Modify
- `src/lib/db/admin-stats.ts` (modify - replace getFilteredUserList function)

## Implementation Details

### Replace getFilteredUserList Function

**File:** `src/lib/db/admin-stats.ts`

Replace the `getFilteredUserList` function (lines 351-417) with optimized version:

```typescript
export const getFilteredUserList = async (
  filters: UserListFilters,
  options: { limit: number; cursor?: string }
): Promise<{ users: UserListItem[]; nextCursor: string | null }> => {
  const supabase = createAdminClient();

  try {
    // Build query with LEFT JOINs for counts
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        display_name,
        credit_balance,
        created_at,
        last_active_at,
        job_count:jobs(count),
        error_count:critical_errors!left(count).gte(created_at,${sevenDaysAgo}),
        message_count:user_messages!left(count).eq(is_from_admin,false)
      `);

    // Apply filters directly in SQL
    if (filters.search) {
      query = query.or(`email.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%`);
    }

    if (filters.minCredits !== undefined) {
      query = query.gte('credit_balance', filters.minCredits);
    }
    if (filters.maxCredits !== undefined) {
      query = query.lte('credit_balance', filters.maxCredits);
    }

    if (filters.createdAfter) {
      query = query.gte('created_at', filters.createdAfter);
    }
    if (filters.createdBefore) {
      query = query.lte('created_at', filters.createdBefore);
    }

    // Note: hasErrors and hasMessages must be post-query filters
    // because aggregate counts aren't available in WHERE clause
    // This is a known limitation - can't filter on aggregates in SQL WHERE clause efficiently

    // Apply sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder === 'asc';
    query = query.order(sortBy, { ascending: sortOrder });

    // Apply cursor pagination
    if (options.cursor) {
      query = query.lt('created_at', options.cursor);
    }

    // Fetch more than limit to account for post-query filtering
    const fetchLimit = Math.min(options.limit * 2, 200);
    query = query.limit(fetchLimit);

    const { data: usersData, error } = await query;

    if (error) {
      logger.error('Error fetching filtered users', { error: error.message });
      throw error;
    }

    if (!usersData || usersData.length === 0) {
      return { users: [], nextCursor: null };
    }

    // Map and apply post-query filters
    const users = usersData
      .map((user: any) => ({
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        creditBalance: user.credit_balance,
        createdAt: user.created_at,
        lastActiveAt: user.last_active_at,
        jobCount: user.job_count?.[0]?.count || 0,
        errorCount: user.error_count?.[0]?.count || 0,
        messageCount: user.message_count?.[0]?.count || 0,
      }))
      .filter((user) => {
        if (filters.hasErrors !== undefined && filters.hasErrors !== (user.errorCount > 0)) {
          return false;
        }
        if (filters.hasMessages !== undefined && filters.hasMessages !== (user.messageCount > 0)) {
          return false;
        }
        return true;
      })
      .slice(0, options.limit);

    // Determine next cursor
    const lastUser = users[users.length - 1];
    const nextCursor = lastUser && users.length === options.limit ? lastUser.createdAt : null;

    return { users, nextCursor };
  } catch (error) {
    logger.error('Error getting filtered user list', { error });
    throw error;
  }
};
```

### Performance Impact

**Before:**
- 1 query to fetch N users
- N × 3 = 3N additional queries (jobCount, errorCount, messageCount per user)
- For 20 users = **61 total queries**

**After:**
- 1 query with JOINs fetches users + all counts
- For 20 users = **1 total query**

**60-query reduction = ~90% performance improvement**

### Known Limitation

The `hasErrors` and `hasMessages` filters must remain post-query because PostgreSQL can't filter on aggregate counts in the WHERE clause without subqueries. This is documented in the code comments.

**Alternative (if needed):** Create a PostgreSQL function that handles this with subqueries, but current approach is acceptable for typical admin usage.

## Acceptance Criteria

- [ ] Function replaced with optimized version
- [ ] Single query with LEFT JOINs instead of N+1 pattern
- [ ] All existing filters work correctly
- [ ] Pagination works correctly
- [ ] Post-query filters (hasErrors/hasMessages) work correctly
- [ ] No TypeScript errors

## Testing Commands

```bash
# Type check
bun run typecheck

# Start dev server with database logging
bun run dev

# Open browser network tab and load admin users page
# Verify: Only 1 database query for user list (not 60+)

# Test filters
curl "http://localhost:3000/api/admin/users?search=test"
curl "http://localhost:3000/api/admin/users?minCredits=100"
curl "http://localhost:3000/api/admin/users?hasErrors=true"
curl "http://localhost:3000/api/admin/users?sortBy=credit_balance&sortOrder=asc"

# Test pagination
curl "http://localhost:3000/api/admin/users?limit=10"
# Note cursor from response, then:
curl "http://localhost:3000/api/admin/users?limit=10&cursor={timestamp}"
```

Expected: All filters work, pagination returns correct results, only 1 DB query per request

## Dependencies

- Task 02 (types regenerated) for proper type safety
