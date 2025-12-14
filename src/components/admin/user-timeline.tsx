'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TimelineFilters } from './timeline-filters';
import { TimelineEventCard } from './timeline-event-card';
import { getUserTimeline, resolveError, unresolveError, type TimelineFilters as ApiFilters } from '@/lib/admin-api/client';

export function UserTimeline({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ApiFilters>({
    resolved: 'all',
    days: 30,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['user-timeline', userId, filters],
      queryFn: async ({ pageParam }: { pageParam?: string }) => {
        return getUserTimeline(userId, filters, pageParam);
      },
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: undefined as string | undefined,
    });

  const resolveErrorMutation = useMutation({
    mutationFn: (errorId: string) => resolveError(errorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-timeline', userId] });
    },
  });

  const unresolveErrorMutation = useMutation({
    mutationFn: (errorId: string) => unresolveError(errorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-timeline', userId] });
    },
  });

  const events = data?.pages.flatMap((page) => page.events) ?? [];

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