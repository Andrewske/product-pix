'use client';

import { Button } from '@/components/ui/button';
import { POSITIVE_FEEDBACK_REASONS, POSITIVE_REASON_LABELS } from '@/types/feedback';
import type { PositiveFeedbackReason } from '@/types';

interface PositiveFeedbackToastProps {
  selectedReasons: PositiveFeedbackReason[];
  onReasonToggle: (reason: PositiveFeedbackReason) => void;
  onDismiss: () => void;
}

export function PositiveFeedbackToast({
  selectedReasons,
  onReasonToggle,
  onDismiss,
}: PositiveFeedbackToastProps) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">
        Thanks for the feedback! What did you like about this image?
      </div>

      <div className="flex flex-wrap gap-2">
        {POSITIVE_FEEDBACK_REASONS.map((reason) => {
          const isSelected = selectedReasons.includes(reason);
          return (
            <Button
              key={reason}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              onClick={() => onReasonToggle(reason)}
              className={`text-xs transition-colors ${
                isSelected
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'hover:bg-green-50'
              }`}
            >
              {POSITIVE_REASON_LABELS[reason]}
            </Button>
          );
        })}
      </div>

      <div className="text-xs text-muted-foreground">
        Select all that apply. This toast will close automatically.
      </div>
    </div>
  );
}