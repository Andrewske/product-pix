# Admin Stats & User List Queries

## Files to Modify/Create
- `src/lib/db/admin-stats.ts` (new)
- `src/lib/db/index.ts` (modify - add export)

## Implementation Details

### 1. Create admin stats query module

**File:** `src/lib/db/admin-stats.ts`

```typescript
export interface AdminDashboardStats {
  usersToday: number;
  usersThisWeek: number;
  activeUsersToday: number;    // Users with activity today
  generationsToday: number;
  errorsToday: number;
  pendingMessages: number;     // Unread user messages
  pendingRefunds: number;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats>
```

### 2. Create user list filters and query

```typescript
export interface UserListFilters {
  search?: string;           // Email or display_name
  hasErrors?: boolean;       // Has errors in last 7 days
  hasMessages?: boolean;     // Has unread messages
  minCredits?: number;
  maxCredits?: number;
  createdAfter?: string;
  createdBefore?: string;
  sortBy?: 'created_at' | 'last_active' | 'credit_balance';
  sortOrder?: 'asc' | 'desc';
}

export interface UserListItem {
  id: string;
  email: string;
  displayName: string | null;
  creditBalance: number;
  createdAt: string;
  lastActiveAt: string | null;  // From users.last_active_at column
  jobCount: number;
  errorCount: number;           // Errors in last 7 days
  messageCount: number;
}

export async function getFilteredUserList(
  filters: UserListFilters,
  options: { limit: number; cursor?: string }
): Promise<{ users: UserListItem[]; nextCursor: string | null }>
```

**Key implementation notes:**
- `errorCount`: `COUNT(*) FROM critical_errors WHERE user_id = $1 AND created_at > NOW() - INTERVAL '7 days'`
- `lastActiveAt`: Read directly from `users.last_active_at` column
- Use admin Supabase client for all queries

## Acceptance Criteria
- [ ] `getAdminDashboardStats()` returns all 7 metrics
- [ ] `getFilteredUserList()` supports all filter options
- [ ] Search works on email and display_name (case-insensitive)
- [ ] `hasErrors` filter checks last 7 days only
- [ ] Pagination uses cursor-based approach
- [ ] All queries use admin client

## Dependencies
- Task 01 (database schema with indexes)
- Task 02 (user_activity for activeUsersToday metric)
