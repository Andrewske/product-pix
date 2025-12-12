'use client';

import React from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { PendingRefundWithDetails } from '@/types';
import { formatTimestamp, getReasonLabel } from '@/lib/utils/refunds';

interface RefundCardProps {
  request: PendingRefundWithDetails;
  isProcessing: boolean;
  onApprove: (id: string) => Promise<void>;
}

export function RefundCard({
  request,
  isProcessing,
  onApprove
}: RefundCardProps): React.JSX.Element {
  return (
    <Card className="p-6">
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
              <p className="text-xs text-muted-foreground">
                {request.users.email}
              </p>
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
                onClick={() => onApprove(request.id)}
                disabled={isProcessing}
              >
                {isProcessing ? 'Approving...' : 'Approve Refund'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}