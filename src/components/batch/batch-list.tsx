// src/components/batch/batch-list.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { BatchJob } from '@/lib/db/batch';

interface BatchListProps {
  initialBatches?: BatchJob[];
  statusFilter?: 'all' | 'processing' | 'completed' | 'failed' | 'cancelled';
}

export function BatchList({
  initialBatches = [],
  statusFilter = 'all',
}: BatchListProps) {
  const router = useRouter();
  const [batches, setBatches] = useState<BatchJob[]>(initialBatches);
  const [filter, setFilter] = useState<'all' | 'processing' | 'completed' | 'failed' | 'cancelled'>(statusFilter);
  const [loading, setLoading] = useState(!initialBatches.length);

  useEffect(() => {
    if (!initialBatches.length) {
      fetchBatches();
    }
  }, [filter]);

  const fetchBatches = async () => {
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
  };

  const statusColors = {
    pending: 'bg-yellow-500',
    processing: 'bg-blue-500',
    completed: 'bg-green-500',
    failed: 'bg-red-500',
    cancelled: 'bg-gray-500',
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
        {(['all', 'processing', 'completed', 'failed'] as const).map((status) => (
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
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filteredBatches.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            No batches found. Create your first batch to get started.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredBatches.map((batch) => {
            const progress =
              batch.total_items > 0
                ? ((batch.completed_items + batch.failed_items) / batch.total_items) * 100
                : 0;

            return (
              <Card
                key={batch.id}
                className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/batch/${batch.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{batch.name}</h3>
                      <Badge
                        className={`${statusColors[batch.status]} text-white`}
                      >
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
                            className="bg-primary h-1.5 rounded-full transition-all duration-300"
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
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

