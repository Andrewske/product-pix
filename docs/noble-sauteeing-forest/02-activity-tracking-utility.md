# Activity Tracking Utility + Login Event

## Files to Modify/Create
- `src/lib/db/user-activity.ts` (new)
- `src/lib/db/index.ts` (modify - add export)
- `src/lib/auth/server.ts` or auth callback (modify - add login tracking)

## Implementation Details

### 1. Create tracking utility

**File:** `src/lib/db/user-activity.ts`

```typescript
export type ActivityEventType =
  | 'login' | 'logout'
  | 'image_download' | 'pricing_viewed' | 'insufficient_credits';

export async function trackActivity(
  userId: string,
  eventType: ActivityEventType,
  properties?: Record<string, unknown>
): Promise<void>
// Implementation must:
// 1. Insert into user_activity table
// 2. Update users.last_active_at = NOW()
// Use admin client (bypasses RLS)

export async function getUserActivity(
  userId: string,
  options: { limit: number; cursor?: string; eventTypes?: ActivityEventType[] }
): Promise<{ activities: UserActivity[]; nextCursor: string | null }>
// Cursor format: "{ISO_timestamp}_{uuid}"
```

### 2. Add login tracking

Hook into auth callback or `src/lib/auth/server.ts` to call:
```typescript
await trackActivity(userId, 'login');
```

This should fire on successful authentication.

## Acceptance Criteria
- [ ] `trackActivity()` inserts record and updates `last_active_at`
- [ ] `getUserActivity()` returns paginated results with compound cursor
- [ ] Login event fires on auth success
- [ ] Verify in DB: login events appear in `user_activity` table after signing in

## Dependencies
- Task 01 (database schema must exist)
