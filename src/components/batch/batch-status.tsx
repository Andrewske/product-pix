// src/components/batch/batch-status.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BatchJob } from '@/lib/db/batch';

interface BatchStatusProps {
  batchId: string;
  initialBatch?: BatchJob;
}

export function BatchStatus({ batchId, initialBatch }: BatchStatusProps) {
  const [batch, setBatch] = useState<BatchJob | null>(initialBatch || null);
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to batch_jobs changes
    const channel = supabase
      .channel(`batch-status-${batchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'batch_jobs',
          filter: `id=eq.${batchId}`,
        },
        (payload) => {
          setBatch(payload.new as BatchJob);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [batchId, supabase]);

  useEffect(() => {
    // Fetch initial state if not provided
    if (!initialBatch) {
      const fetchBatch = async () => {
        const response = await fetch(`/api/batch/${batchId}`);
        if (response.ok) {
          const data = await response.json();
          setBatch(data.batch);
        }
      };
      fetchBatch();
    }
  }, [batchId, initialBatch]);

  if (!batch) {
    return (
      <Card className="p-6">
          <div className="flex items-center justify-center">
          <div className="animate-spin h-6 w-6 border-2 border-accent border-t-transparent rounded-full" />
        </div>
      </Card>
    );
  }

  const progress =
    batch.total_items > 0
      ? ((batch.completed_items + batch.failed_items) / batch.total_items) * 100
      : 0;

  const statusVariants = {
    pending: 'info' as const,
    processing: 'default' as const,
    completed: 'success' as const,
    failed: 'destructive' as const,
    cancelled: 'outline' as const,
  };

  const statusLabels = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{batch.name}</h3>
          <Badge variant={statusVariants[batch.status]}>
            {statusLabels[batch.status]}
          </Badge>
        </div>

        {batch.status === 'processing' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {batch.completed_items + batch.failed_items} / {batch.total_items}
              </span>
            </div>
            <div className="w-full bg-accent/20 rounded-full h-2">
              <div
                className="bg-accent h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{batch.completed_items} completed</span>
              <span>{batch.failed_items} failed</span>
              <span>
                {batch.total_items - batch.completed_items - batch.failed_items}{' '}
                remaining
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Credits Charged</div>
            <div className="font-medium">{batch.credits_charged}</div>
          </div>
          {batch.credits_refunded > 0 && (
            <div>
              <div className="text-muted-foreground">Credits Refunded</div>
              <div className="font-medium text-accent">
                {batch.credits_refunded}
              </div>
            </div>
          )}
          <div>
            <div className="text-muted-foreground">Created</div>
            <div className="font-medium">
              {new Date(batch.created_at).toLocaleDateString()}
            </div>
          </div>
          {batch.completed_at && (
            <div>
              <div className="text-muted-foreground">Completed</div>
              <div className="font-medium">
                {new Date(batch.completed_at).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>

        {batch.status === 'processing' && (
          <div className="bg-info/10 border border-info/30 rounded p-3 text-sm text-info">
            Processing via Gemini Batch API. Results will be available when the batch completes.
          </div>
        )}

        {batch.error_message && (
          <div className="bg-destructive/10 border border-destructive/20 rounded p-3 text-sm text-destructive">
            {batch.error_message}
          </div>
        )}
      </div>
    </Card>
  );
}

