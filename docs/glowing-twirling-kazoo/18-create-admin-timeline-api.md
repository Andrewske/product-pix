# Create Admin Timeline API

## Files to Modify/Create
- `src/app/api/admin/users/[userId]/timeline/route.ts` (new)
- `src/lib/posthog/api.ts` (new)

## Implementation Details

### PostHog API Integration

Create `src/lib/posthog/api.ts`:

```typescript
import { posthogServer } from './server';

export async function getPostHogEvents(
  userId: string,
  options: {
    limit?: number;
    beforeDate?: string;
    afterDate?: string;
    severity?: string;
    domain?: string;
  }
): Promise<PostHogEvent[]> {
  // Fetch from PostHog API: /api/projects/{projectId}/events
  // Query: person_id={userId}&after={afterDate}&before={beforeDate}&limit={limit}
  // Filter by properties.severity and properties.domain client-side
  // Transform to PostHogEvent[] format
  // Return events with: id, event, timestamp, properties, distinct_id
}
```

### Timeline API Route

Create `src/app/api/admin/users/[userId]/timeline/route.ts`:

```typescript
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
): Promise<NextResponse> {
  // 1. Verify admin auth
  const user = await getUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse query params
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
  const cursor = searchParams.get('cursor');
  const days = Math.min(parseInt(searchParams.get('days') || '30'), 365);
  const severity = searchParams.get('severity') as 'critical' | 'high' | 'medium' | 'low' | null;
  const domain = searchParams.get('domain');
  const resolved = searchParams.get('resolved') || 'all';

  // 3. Calculate date range
  const endDate = cursor || new Date().toISOString();
  const startDate = new Date(
    Date.parse(endDate) - days * 24 * 60 * 60 * 1000
  ).toISOString();

  // 4. Fetch from both sources in parallel
  const [dbErrors, posthogEvents] = await Promise.all([
    getCriticalErrors(params.userId, {
      limit,
      beforeDate: endDate,
      afterDate: startDate,
      severity,
      domain,
      resolved
    }),
    getPostHogEvents(params.userId, {
      limit,
      beforeDate: endDate,
      afterDate: startDate,
      severity,
      domain
    }),
  ]);

  // 5. Merge and sort
  const merged = [...dbErrors, ...posthogEvents]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);

  // 6. Return paginated response
  return NextResponse.json({
    events: merged,
    nextCursor: merged.length === limit ? merged[merged.length - 1].timestamp : null,
    hasMore: merged.length === limit,
  });
}
```

## Acceptance Criteria
- [ ] getPostHogEvents() fetches from PostHog API
- [ ] PostHog events filtered by severity/domain
- [ ] Timeline API verifies admin auth
- [ ] Query params validated (limit max 200, days max 365)
- [ ] Date range calculated correctly
- [ ] DB and PostHog fetched in parallel
- [ ] Events merged and sorted by timestamp DESC
- [ ] Pagination with cursor (ISO timestamp)
- [ ] Returns events, nextCursor, hasMore

## Dependencies
- Task 06 (getCriticalErrors function)
- Task 07 (PostHog server)
