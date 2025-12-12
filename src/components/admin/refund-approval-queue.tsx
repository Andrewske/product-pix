'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logging';
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

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  const getReasonLabel = (reason: string): string => {
    const labels = {
      poor_quality: 'Poor Quality',
      wrong_style: 'Wrong Style',
      technical_issue: 'Technical Issue',
      other: 'Other',
    };
    return labels[reason as keyof typeof labels] || reason;
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
        <Card key={request.id} className="p-6">
          <div className="flex gap-4">
            {/* Image Preview */}
            <div className="flex-shrink-0">
              <Image
                src={request.generated_images.public_url}
                alt={request.generated_images.title || 'Refund request image'}
                width={128}
                height={128}
                className="rounded object-cover"
              />
            </div>

            {/* Request Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-sm">
                    {request.users.display_name || request.users.email}
                  </h3>
                  <p className="text-xs text-muted-foreground">{request.users.email}</p>
                </div>
                <Badge variant="secondary" className="ml-2">
                  {getReasonLabel(request.reason)}
                </Badge>
              </div>

              {request.feedback && (
                <p className="text-sm text-muted-foreground mb-2">
                  &ldquo;{request.feedback}&rdquo;
                </p>
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Requested {formatTimestamp(request.requested_at)}
                </p>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(request.id)}
                    disabled={processingIds.has(request.id)}
                  >
                    {processingIds.has(request.id) ? 'Approving...' : 'Approve Refund'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}