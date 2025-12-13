'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TimelineFilters } from './timeline-filters';
import { TimelineEventCard } from './timeline-event-card';

export function UserTimeline({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<{
    severity?: string;
    domain?: string;
    resolved: 'all' | 'unresolved' | 'resolved';
    days: number;
  }>({
    resolved: 'all',
    days: 30,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['user-timeline', userId, filters],
      queryFn: ({ pageParam }) => {
        const params = new URLSearchParams();
        if (filters.severity) params.set('severity', filters.severity);
        if (filters.domain) params.set('domain', filters.domain);
        params.set('resolved', filters.resolved);
        params.set('days', filters.days.toString());
        if (pageParam) params.set('cursor', pageParam);
        return fetch(`/api/admin/users/${userId}/timeline?${params}`).then(r => r.json());
      },
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