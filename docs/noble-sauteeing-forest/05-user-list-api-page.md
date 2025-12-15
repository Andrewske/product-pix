# User List API & Page

## Files to Modify/Create
- `src/app/api/admin/users/route.ts` (new)
- `src/app/admin/users/page.tsx` (new)
- `src/components/admin/users-list-page-client.tsx` (new)
- `src/components/admin/dashboard-stats.tsx` (new)
- `src/components/admin/user-filters.tsx` (new)
- `src/components/admin/admin-nav.tsx` (modify - enable Users link)

## Implementation Details

### 1. Create Users List API

**File:** `src/app/api/admin/users/route.ts`

Endpoints:
- `GET /api/admin/users` - Paginated, filtered user list
  - Query params: `search`, `hasErrors`, `hasMessages`, `minCredits`, `maxCredits`, `createdAfter`, `createdBefore`, `sortBy`, `sortOrder`, `cursor`, `limit`
  - Response: `{ users: UserListItem[], nextCursor: string | null }`

- `GET /api/admin/users/stats` - Dashboard stats
  - Response: `AdminDashboardStats`

### 2. Create Users List Page (Server Component)

**File:** `src/app/admin/users/page.tsx`

Server component that:
- Fetches initial user list and stats
- Renders `UsersListPageClient` with initial data

### 3. Create Users List Client Component

**File:** `src/components/admin/users-list-page-client.tsx`

**Layout:**
```
+-----------------------------------------------------+
|  Dashboard Stats (cards)                            |
|  +-----+ +-----+ +-----+ +-----+ +-----+ +-----+   |
|  |Users| |Active| |Gens | |Errors| |Msgs | |Refund| |
|  |Today| |Today | |Today| |Today | |Pend | |Pend |  |
|  +-----+ +-----+ +-----+ +-----+ +-----+ +-----+   |
+----------------------------------------------------|
|  Search: [________________] Filters: [v] [v] [v]   |
+----------------------------------------------------+
|  Email          | Name    | Credits | Jobs | Errors |
|  user@email.com | John    | 50      | 12   | 0      |
|  ...            | ...     | ...     | ...  | ...    |
|  [Load More]                                        |
+-----------------------------------------------------+
```

**Features:**
- TanStack Infinite Query for user list
- Debounced search input (300ms)
- Filter dropdowns: Has Errors (last 7 days), Has Messages, Credit Range
- Sort by: Created, Last Active, Credits
- Click row → navigate to `/admin/users/[userId]`

### 4. Create Dashboard Stats Component

**File:** `src/components/admin/dashboard-stats.tsx`

Grid of stat cards showing:
- Users Today / This Week
- Active Users Today
- Generations Today
- Errors Today
- Pending Messages
- Pending Refunds

### 5. Create User Filters Component

**File:** `src/components/admin/user-filters.tsx`

Filter bar with:
- Search input (debounced)
- Has Errors toggle
- Has Messages toggle
- Credit range inputs
- Sort dropdown

### 6. Enable nav item

**File:** `src/components/admin/admin-nav.tsx`

Enable the Users nav item (currently disabled)

## Acceptance Criteria
- [ ] API returns paginated user list with all filters working
- [ ] Stats endpoint returns accurate counts
- [ ] TanStack Infinite Query loads more on scroll/button
- [ ] Search is debounced and filters results
- [ ] All filter combinations work correctly
- [ ] Row click navigates to user profile
- [ ] Users nav item is visible and active

## Dependencies
- Task 04 (admin-stats.ts queries)
