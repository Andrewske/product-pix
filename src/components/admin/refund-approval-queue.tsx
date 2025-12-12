'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logging';
import { RefundCard } from './refund-card';
import type { PendingRefundWithDetails } from '@/types';

export function RefundApprovalQueue() {
  const [requests, setRequests] = useState<PendingRefundWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingRequests();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPendingRequests = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch('/api/refunds/image');
      if (!response.ok) {
        throw new Error('Failed to fetch pending requests');
      }
      const data = await response.json();
      setRequests(data.refunds || []);
    } catch (error) {
      logger.error('Error fetching pending requests', { error });
      toast({
        title: 'Error',
        description: 'Failed to load pending refund requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (refundId: string): Promise<void> => {
    setProcessingIds(prev => new Set(prev).add(refundId));

    try {
      const response = await fetch(`/api/refunds/image/${refundId}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to approve refund');
      }

      // Remove from list
      setRequests(prev => prev.filter(req => req.id !== refundId));

      toast({
        title: 'Success',
        description: 'Refund request approved successfully',
      });
    } catch (error) {
      logger.error('Error approving refund', { error, refundId });
      toast({
        title: 'Error',
        description: 'Failed to approve refund request',
        variant: 'destructive',
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(refundId);
        return newSet;
      });
    }
  };



  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex gap-4">
              <Skeleton className="w-32 h-32 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No pending refund requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <RefundCard
          key={request.id}
          request={request}
          isProcessing={processingIds.has(request.id)}
          onApprove={handleApprove}
        />
      ))}
    </div>
  );
}