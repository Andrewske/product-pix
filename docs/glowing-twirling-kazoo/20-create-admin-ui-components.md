# Create Admin Dashboard UI Components

## Files to Modify/Create
- `src/components/admin/user-timeline.tsx` (new)
- `src/components/admin/timeline-filters.tsx` (new)
- `src/components/admin/timeline-event-card.tsx` (new)
- `src/components/admin/user-stats.tsx` (new)
- `src/app/admin/users/[userId]/page.tsx` (new)

## Implementation Details

### User Timeline Component

Create `src/components/admin/user-timeline.tsx` with TanStack Query infinite scroll:

```typescript
'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export function UserTimeline({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    severity: undefined,
    domain: undefined,
    resolved: 'all',
    days: 30,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['user-timeline', userId, filters],
      queryFn: ({ pageParam }) =>
        fetch(`/api/admin/users/${userId}/timeline?${new URLSearchParams({
          ...filters,
          cursor: pageParam || '',
        })}`).then(r => r.json()),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: undefined,
    });

  const resolveErrorMutation = useMutation({
    mutationFn: (errorId: string) =>
      fetch(`/api/admin/errors/${errorId}/resolve`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-timeline', userId] });
    },
  });

  const unresolveErrorMutation = useMutation({
    mutationFn: (errorId: string) =>
      fetch(`/api/admin/errors/${errorId}/resolve`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-timeline', userId] });
    },
  });

  const events = data?.pages.flatMap(page => page.events) ?? [];

  return (
    <div className="space-y-4">
      <TimelineFilters filters={filters} onChange={setFilters} />

      <div className="space-y-2">
        {events.map(event => (
          <TimelineEventCard
            key={event.id}
            event={event}
            onResolve={() => resolveErrorMutation.mutate(event.id)}
            onUnresolve={() => unresolveErrorMutation.mutate(event.id)}
          />
        ))}
      </div>

      {hasNextPage && (
        <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </Button>
      )}
    </div>
  );
}
```

### Timeline Filters Component

Create `src/components/admin/timeline-filters.tsx`:

Dropdown selects for:
- Severity: critical, high, medium, low
- Domain: payment, credit, generation, auth, validation, rate-limit
- Resolution status: all | unresolved only | resolved only
- Date range: last 7/30/90 days

### Timeline Event Card Component

Create `src/components/admin/timeline-event-card.tsx`:

```typescript
export function TimelineEventCard({ event, onResolve, onUnresolve }) {
  const [expanded, setExpanded] = useState(false);

  const severityColors = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <div className={`border rounded-lg p-4 ${severityColors[event.severity]}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex gap-2 items-center">
            <Badge variant="outline">{event.domain}</Badge>
            <Badge variant="outline">{event.severity}</Badge>
            {event.source === 'database' && <Badge>DB</Badge>}
          </div>
          <h4 className="font-medium mt-2">{event.title}</h4>
          <p className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(event.timestamp))} ago
          </p>
        </div>

        {event.source === 'database' && (
          event.resolvedAt ? (
            <div className="flex gap-2 items-center">
              <Badge variant="success">✓ Resolved</Badge>
              <Button size="sm" variant="ghost" onClick={onUnresolve}>
                Unresolve
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={onResolve}>
              Resolve
            </Button>
          )
        )}
      </div>

      {event.description && (
        <p className="mt-2 text-sm">{event.description}</p>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        className="mt-2"
      >
        {expanded ? 'Hide' : 'Show'} Details
      </Button>

      {expanded && (
        <pre className="mt-2 text-xs bg-black/5 p-2 rounded overflow-auto max-h-96">
          {JSON.stringify(event.metadata, null, 2)}
        </pre>
      )}
    </div>
  );
}
```

### User Stats Component

Create `src/components/admin/user-stats.tsx`:

Display:
- Email, tier, credits
- Account created date
- Total generations count
- Unresolved critical errors count (red badge if > 0)
- Unresolved high severity errors count
- Total errors last 30 days

### User Detail Page

Create `src/app/admin/users/[userId]/page.tsx`:

```typescript
import { UserTimeline } from '@/components/admin/user-timeline';
import { getUserById } from '@/lib/db/users';
import { getUser } from '@/lib/auth';
import { isAdmin } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';

export default async function UserDetailPage({
  params
}: {
  params: { userId: string }
}) {
  const currentUser = await getUser();
  if (!currentUser || !isAdmin(currentUser)) {
    redirect('/');
  }

  const user = await getUserById(params.userId);
  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div>
          <h1 className="text-2xl font-bold mb-4">User Details</h1>
          <UserStats user={user} />
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Activity Timeline</h2>
          <UserTimeline userId={params.userId} />
        </div>
      </div>
    </div>
  );
}
```

## Acceptance Criteria
- [ ] UserTimeline with infinite scroll created
- [ ] TimelineFilters with all filter options
- [ ] TimelineEventCard with severity colors, expand/collapse
- [ ] Resolution workflow (resolve/unresolve buttons)
- [ ] UserStats with error counts
- [ ] User detail page with grid layout
- [ ] Admin auth verification on page
- [ ] All components follow existing admin patterns

## Dependencies
- Task 17 (TanStack Query in layout)
- Task 18 (timeline API)
- Task 19 (resolution API)
