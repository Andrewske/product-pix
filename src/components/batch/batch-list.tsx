// src/components/batch/batch-list.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { StudioCard } from '@/components/ui/studio-card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { BatchJob } from '@/lib/db/batch';

interface BatchListProps {
  initialBatches?: BatchJob[];
  statusFilter?: 'all' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'pending';
}

export function BatchList({
  initialBatches = [],
  statusFilter = 'all',
}: BatchListProps) {
  const router = useRouter();
  const [batches, setBatches] = useState<BatchJob[]>(initialBatches);
  const [filter, setFilter] = useState<'all' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'pending'>(statusFilter);
  const [loading, setLoading] = useState(!initialBatches.length);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL('/api/batch', window.location.origin);
      if (filter !== 'all') {
        url.searchParams.set('status', filter);
      }

      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        setBatches(data.batches || []);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (!initialBatches.length) {
      fetchBatches();
    }
  }, [fetchBatches, initialBatches.length]);

  const statusColors = {
    pending: 'bg-orange-500', // Electric Coral
    processing: 'bg-orange-500', // Electric Coral
    completed: 'bg-emerald-400', // Mint
    failed: 'bg-gray-900', // Deep Black
    cancelled: 'bg-gray-800', // Deep Black
  };

  const statusLabels = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
  };

  const filteredBatches = batches.filter(
    (batch) => filter === 'all' || batch.status === filter
  );

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-4 border-b">
        {(['all', 'pending', 'processing', 'completed', 'failed', 'cancelled'] as const).map((status) => (
          <Button
            key={status}
            variant="ghost"
            onClick={() => setFilter(status)}
            className={`rounded-none border-b-2 px-1 ${
              filter === status
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {status === 'all' ? 'All' : statusLabels[status]}
            {status !== 'all' && (
              <span className="ml-2">
                ({batches.filter((b) => b.status === status).length})
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Batch cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
        ) : filteredBatches.length === 0 ? (
          <StudioCard className="p-12 text-center">
            <h3 className="text-xl font-semibold mb-2">No batches found</h3>
            <p className="text-muted-foreground mb-6">
              Create your first batch to get started with AI-powered product photography.
            </p>
            <Button onClick={() => router.push('/generate')}>
              Create Batch
            </Button>
          </StudioCard>
       ) : (
        <div className="grid gap-4">
            {filteredBatches.map((batch) => {
             const progress =
               batch.total_items > 0
                 ? Math.max(0, Math.min(((batch.completed_items + batch.failed_items) / batch.total_items) * 100, 100))
                 : 0;


            return (
              <StudioCard
                key={batch.id}
                hover
                className="p-6 cursor-pointer"
                onClick={() => router.push(`/batch/${batch.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                     <div className="flex items-center gap-2">
                       <h3 className="font-semibold">{batch.name}</h3>
                        <Badge className={`${statusColors[batch.status]} text-white`}>
                          {statusLabels[batch.status]}
                        </Badge>
                     </div>
                    <div className="text-sm text-muted-foreground">
                      {batch.total_items} items • {batch.credits_charged} credits
                    </div>
                     {batch.status === 'processing' && (
                       <div className="space-y-1">
                         <div className="w-full bg-muted rounded-full h-1.5">
                           <div
                             className="bg-accent h-1.5 rounded-full transition-all duration-300"
                             style={{ width: `${progress}%` }}
                           />
                         </div>
                        <div className="text-xs text-muted-foreground">
                          {batch.completed_items} completed, {batch.failed_items} failed
                        </div>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Created {new Date(batch.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/batch/${batch.id}`);
                    }}
                  >
                    View
                  </Button>
                 </div>
               </StudioCard>
             );
            })}
          </div>
        )}
    </div>
  );
}

