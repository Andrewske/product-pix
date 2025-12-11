// src/components/batch/batch-actions.tsx
'use client';

import { useState } from 'react';
import { StudioButton } from '@/components/ui/studio-button';
import type { BatchJob } from '@/lib/db/batch';

interface BatchActionsProps {
  batch: BatchJob;
  onCancel?: () => void;
}

export function BatchActions({ batch, onCancel }: BatchActionsProps) {
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this batch? Pending items will be refunded.')) {
      return;
    }

    setCancelling(true);
    try {
      const response = await fetch(`/api/batch/${batch.id}/cancel`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel batch');
      }

      const data = await response.json();
      if (data.refundedCredits > 0) {
        alert(`Batch cancelled. ${data.refundedCredits} credits refunded.`);
      }

      onCancel?.();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to cancel batch');
    } finally {
      setCancelling(false);
    }
  };

  const canCancel = ['pending', 'processing'].includes(batch.status);

  return (
    <div className="flex gap-2">
      {canCancel && (
        <StudioButton
          studioVariant="secondary"
          onClick={handleCancel}
          disabled={cancelling}
        >
          {cancelling ? 'Cancelling...' : 'Cancel Batch'}
        </StudioButton>
      )}
      {/* Future: Download all button */}
    </div>
  );
}

