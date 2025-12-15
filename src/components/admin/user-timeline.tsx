'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { TimelineFilters } from './timeline-filters';
import { TimelineEventRenderers } from './timeline-event-renderers';
import { UserQuickActions } from './user-quick-actions';
import { resolveError, unresolveError } from '@/lib/admin-api/client';
import type { TimelineEvent } from '@/lib/db/admin-timeline';

interface UserTimelineFilters {
  types: string[];
  startDate?: string;
  endDate?: string;
}

export function UserTimeline({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const observerRef = useRef<IntersectionObserver>();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<UserTimelineFilters>({
    types: ['job', 'transaction', 'message', 'image', 'feedback', 'error', 'activity'],
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useInfiniteQuery({
      queryKey: ['user-timeline', userId, filters],
      queryFn: async ({ pageParam }: { pageParam?: string }) => {
        const params = new URLSearchParams();
        if (filters.types.length > 0) {
          params.set('types', filters.types.join(','));
        }
        if (filters.startDate) params.set('startDate', filters.startDate);
        if (filters.endDate) params.set('endDate', filters.endDate);
        if (pageParam) params.set('cursor', pageParam);

        const response = await fetch(`/api/admin/users/${userId}/timeline?${params}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to fetch timeline: ${error}`);
        }

        return response.json();
      },
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: undefined as string | undefined,
    });

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <TimelineFilters filters={filters} onChange={setFilters} />
        <UserQuickActions userId={userId} onRefresh={() => refetch()} />
      </div>

      <div className="space-y-3">
        {events.map(event => (
          <TimelineEventRenderers
            key={event.id}
            event={event as TimelineEvent}
            onResolve={() => resolveErrorMutation.mutate(event.id)}
            onUnresolve={() => unresolveErrorMutation.mutate(event.id)}
          />
        ))}
      </div>

      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} className="flex justify-center py-4">
        {isFetchingNextPage && (
          <div className="text-sm text-muted-foreground">Loading more events...</div>
        )}
        {!hasNextPage && events.length > 0 && (
          <div className="text-sm text-muted-foreground">No more events to load</div>
        )}
      </div>
    </div>
  );
}