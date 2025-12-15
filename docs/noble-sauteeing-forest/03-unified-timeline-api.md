# Unified Timeline API

## Files to Modify/Create
- `src/lib/db/admin-timeline.ts` (new)
- `src/lib/db/index.ts` (modify - add export)
- `src/app/api/admin/users/[userId]/timeline/route.ts` (modify)
- `src/lib/posthog/api.ts` (modify - remove `getPostHogEvents()`)

## Implementation Details

### 1. Create timeline query module

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
    cursor?: string;       // Format: "{timestamp}_{id}"
    filters?: TimelineFilters;
  }
): Promise<{ events: TimelineEvent[]; nextCursor: string | null }>
```

**Query strategy:**
1. **Only query tables matching the type filter** - Skip irrelevant tables when filtering
2. Query selected tables in parallel with `Promise.all()`
3. Each query uses compound cursor: `WHERE user_id = $1 AND (created_at, id) < ($cursor_ts, $cursor_id) ORDER BY created_at DESC, id DESC LIMIT $limit`
4. Normalize each result to `TimelineEvent` format
5. Merge all results, sort by (timestamp, id) DESC
6. Slice to limit, compute next cursor as `{timestamp}_{id}` of last item

**Tables to query (8 total):**
- `jobs` → type: 'job'
- `credit_transactions` → type: 'transaction'
- `user_messages` → type: 'message'
- `generated_images` → type: 'image'
- `image_feedback` → type: 'feedback'
- `critical_errors` → type: 'error'
- `uploads` → type: 'upload'
- `user_activity` → type: 'activity'

### 2. Update timeline API route

**File:** `src/app/api/admin/users/[userId]/timeline/route.ts`

- Remove PostHog integration entirely
- Call `getUnifiedTimeline()` instead
- Support filter query params: `types` (comma-separated), `startDate`, `endDate`
- Return: `{ events: TimelineEvent[], nextCursor: string | null }`

### 3. Delete PostHog timeline code

Remove `getPostHogEvents()` function from `src/lib/posthog/api.ts`

## Acceptance Criteria
- [ ] `getUnifiedTimeline()` queries all 8 tables in parallel
- [ ] Filtering by type skips irrelevant table queries
- [ ] Compound cursor `{timestamp}_{id}` works correctly across pages
- [ ] API route returns proper paginated response
- [ ] `getPostHogEvents()` removed from posthog/api.ts
- [ ] Manual test: timeline shows events from multiple tables sorted by time

## Dependencies
- Task 01 (indexes must exist)
- Task 02 (user_activity table populated with login events)
