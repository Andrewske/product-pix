# Admin Dashboard Plan: User Profiles & Insights

## Overview

Comprehensive admin dashboard for operational support and business insights. Two main features:
1. **User List Page** (`/admin/users`) - Dashboard + searchable/filterable user table
2. **Enhanced User Profile** (`/admin/users/[userId]`) - Unified timeline of all user activity

## Architecture Decisions

- **No PostHog in timeline** - Remove dependency, self-track with `user_activity` table
- **No caching initially** - Optimize queries with indexes, add cache layer later if needed
- **TanStack Infinite Query** - Client-side pagination with cursor-based API
- **DB-first approach** - Query existing tables, merge by timestamp

---

## Phase 1: Database Schema

### 1.1 Create `user_activity` table

```sql
CREATE TABLE user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_activity_user_time ON user_activity(user_id, created_at DESC);
CREATE INDEX idx_user_activity_event_type ON user_activity(event_type);
```

**Event types to track:**
- `login` - User logged in
- `logout` - User logged out
- `page_view` - Page visited (properties: { path })
- `image_download` - Image downloaded (properties: { image_id })
- `pricing_viewed` - Viewed pricing page
- `insufficient_credits` - Hit credit wall (properties: { required, available })

**Files:**
- `supabase/migrations/YYYYMMDD_create_user_activity.sql`

### 1.2 Add indexes for timeline queries

Ensure indexes exist on all timeline source tables for `(user_id, created_at DESC)`:
- `jobs` - verify index exists
- `credit_transactions` - verify index exists
- `user_messages` - verify index exists
- `generated_images` - verify index exists
- `image_feedback` - verify index exists
- `critical_errors` - verify index exists
- `uploads` - verify index exists

---

## Phase 2: Activity Tracking

### 2.1 Create tracking utility

**File:** `src/lib/db/user-activity.ts`

```typescript
export type ActivityEventType =
  | 'login' | 'logout' | 'page_view'
  | 'image_download' | 'pricing_viewed' | 'insufficient_credits';

export async function trackActivity(
  userId: string,
  eventType: ActivityEventType,
  properties?: Record<string, unknown>
): Promise<void>

export async function getUserActivity(
  userId: string,
  options: { limit, cursor, eventTypes? }
): Promise<UserActivity[]>
```

### 2.2 Add tracking calls

| Location | Event | Properties |
|----------|-------|------------|
| `src/lib/auth/server.ts` or auth callback | `login` | - |
| Logout handler | `logout` | - |
| `src/app/(app)/layout.tsx` or middleware | `page_view` | `{ path }` |
| Image download API/handler | `image_download` | `{ imageId }` |
| `src/app/(marketing)/pricing/page.tsx` | `pricing_viewed` | - |
| Credit check failure points | `insufficient_credits` | `{ required, available }` |

---

## Phase 3: Unified Timeline API

### 3.1 Create timeline query module

**File:** `src/lib/db/admin-timeline.ts`

```typescript
export type TimelineEventType =
  | 'job' | 'transaction' | 'message' | 'image'
  | 'feedback' | 'error' | 'upload' | 'activity';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  subtype: string;        // e.g., 'generation', 'purchase', 'login'
  timestamp: string;
  title: string;          // Human-readable summary
  metadata: Record<string, unknown>;
}

export interface TimelineFilters {
  types?: TimelineEventType[];
  startDate?: string;
  endDate?: string;
}

export async function getUnifiedTimeline(
  userId: string,
  options: {
    limit: number;
    cursor?: string;
    filters?: TimelineFilters;
  }
): Promise<{ events: TimelineEvent[]; nextCursor: string | null }>
```

**Query strategy:**
1. Query all 8 tables in parallel with `Promise.all()`
2. Each query: `WHERE user_id = $1 AND created_at < $cursor ORDER BY created_at DESC LIMIT $limit`
3. Normalize each result to `TimelineEvent` format
4. Merge all results, sort by timestamp DESC
5. Slice to limit, compute next cursor

### 3.2 Update timeline API route

**File:** `src/app/api/admin/users/[userId]/timeline/route.ts`

- Remove PostHog integration entirely
- Call `getUnifiedTimeline()` instead
- Support filter query params: `types`, `startDate`, `endDate`
- Return cursor-based pagination response

### 3.3 Delete PostHog timeline code

**Remove:** `src/lib/posthog/api.ts` `getPostHogEvents()` function (has SQL injection vulnerability)

---

## Phase 4: User List Page

### 4.1 Create admin stats queries

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

export interface UserListFilters {
  search?: string;           // Email or display_name
  hasErrors?: boolean;       // Has unresolved errors
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
  lastActiveAt: string | null;
  jobCount: number;
  errorCount: number;
  messageCount: number;
}

export async function getFilteredUserList(
  filters: UserListFilters,
  options: { limit: number; cursor?: string }
): Promise<{ users: UserListItem[]; nextCursor: string | null }>
```

### 4.2 Create Users List API

**File:** `src/app/api/admin/users/route.ts`

- `GET /api/admin/users` - Paginated, filtered user list
- `GET /api/admin/users/stats` - Dashboard stats (or combine in one endpoint)

### 4.3 Create Users List Page

**File:** `src/app/admin/users/page.tsx`

Server component that renders the client component with initial data.

### 4.4 Create Users List Client Component

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
- Debounced search input
- Filter dropdowns: Has Errors, Has Messages, Credit Range
- Sort by: Created, Last Active, Credits
- Click row -> navigate to `/admin/users/[userId]`

### 4.5 Enable nav item

**File:** `src/components/admin/admin-nav.tsx`

- Enable the Users nav item (currently disabled)

---

## Phase 5: Enhanced User Profile Page

### 5.1 Update User Timeline Component

**File:** `src/components/admin/user-timeline.tsx`

- Use TanStack Infinite Query
- Add filter bar for event types (checkboxes or multi-select)
- Add date range picker
- Render different event types with appropriate icons/colors
- Click event -> expand details or navigate to related item

### 5.2 Create Event Type Renderers

**File:** `src/components/admin/timeline-event-renderers.tsx`

Render functions for each event type:
- `JobEvent` - Show template, status, duration, credits charged
- `TransactionEvent` - Show type, amount, balance after
- `MessageEvent` - Show preview, sentiment, reply button
- `ImageEvent` - Show thumbnail, feedback status
- `FeedbackEvent` - Show rating, reasons
- `ErrorEvent` - Show severity, domain, resolved status
- `ActivityEvent` - Show event type, properties

### 5.3 Add Quick Actions

**File:** `src/components/admin/user-quick-actions.tsx`

- Refresh timeline button
- View all images button
- View all messages button
- Add credits button (if needed)
- Impersonate user button (future)

---

## Phase 6: Business Insights (Future)

Not in current scope, but for later:
- Generation cost tracking dashboard
- Revenue metrics
- Conversion funnel visualization
- PostHog integration for aggregate analytics (not per-user timeline)

---

## Files to Create/Modify

### New Files
- `supabase/migrations/YYYYMMDD_create_user_activity.sql`
- `src/lib/db/user-activity.ts`
- `src/lib/db/admin-timeline.ts`
- `src/lib/db/admin-stats.ts`
- `src/app/api/admin/users/route.ts`
- `src/app/admin/users/page.tsx`
- `src/components/admin/users-list-page-client.tsx`
- `src/components/admin/dashboard-stats.tsx`
- `src/components/admin/user-filters.tsx`
- `src/components/admin/timeline-event-renderers.tsx`
- `src/components/admin/user-quick-actions.tsx`

### Modified Files
- `src/app/api/admin/users/[userId]/timeline/route.ts` - Remove PostHog, use unified query
- `src/components/admin/user-timeline.tsx` - TanStack Query, filters
- `src/components/admin/admin-nav.tsx` - Enable Users link
- `src/lib/auth/server.ts` or callback - Add login tracking
- `src/app/(marketing)/pricing/page.tsx` - Add pricing_viewed tracking
- Various pages - Add page_view tracking

### Files to Remove/Clean
- `src/lib/posthog/api.ts` - Remove `getPostHogEvents()` (security vulnerability)

---

## Implementation Order

1. **Phase 1** - Database schema (user_activity table, verify indexes)
2. **Phase 3.1-3.3** - Unified timeline API (core functionality)
3. **Phase 4** - User list page with dashboard
4. **Phase 5** - Enhanced user profile timeline UI
5. **Phase 2** - Activity tracking calls (can be incremental)

**Estimated effort:** 3-4 days
