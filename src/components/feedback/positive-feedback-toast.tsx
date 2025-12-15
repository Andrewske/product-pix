'use client';

import { Toggle } from '@/components/ui/toggle';
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
  onDismiss: _onDismiss,
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
            <Toggle
              key={reason}
              pressed={isSelected}
              onPressedChange={() => onReasonToggle(reason)}
              variant="outline"
              size="sm"
              className="text-xs transition-colors data-[state=on]:bg-green-600 data-[state=on]:text-white data-[state=on]:hover:bg-green-700 data-[state=off]:hover:bg-green-50"
            >
              {POSITIVE_REASON_LABELS[reason]}
            </Toggle>
          );
        })}
      </div>

      <div className="text-xs text-muted-foreground">
        Select all that apply. This toast will close automatically.
      </div>
    </div>
  );
}