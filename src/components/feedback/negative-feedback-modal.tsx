'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NEGATIVE_FEEDBACK_REASONS, NEGATIVE_REASON_LABELS } from '@/types/feedback';
import type { NegativeFeedbackReason } from '@/types';

interface NegativeFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reasons: NegativeFeedbackReason[], comment: string) => void;
  isSubmitting?: boolean;
}

export function NegativeFeedbackModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: NegativeFeedbackModalProps) {
  const [selectedReasons, setSelectedReasons] = useState<NegativeFeedbackReason[]>([]);
  const [comment, setComment] = useState('');

  const handleReasonToggle = (reason: NegativeFeedbackReason, checked: boolean) => {
    setSelectedReasons(prev =>
      checked
        ? [...prev, reason]
        : prev.filter(r => r !== reason)
    );
  };

  const handleSubmit = () => {
    onSubmit(selectedReasons, comment);
  };

  const handleCancel = () => {
    setSelectedReasons([]);
    setComment('');
    onOpenChange(false);
  };

  const isOtherSelected = selectedReasons.includes('other');
  const canSubmit = selectedReasons.length > 0 &&
    (!isOtherSelected || (isOtherSelected && comment.trim().length > 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Help us improve</DialogTitle>
          <DialogDescription>
            What didn&apos;t you like about this image? Your feedback helps us create better results.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            {NEGATIVE_FEEDBACK_REASONS.map((reason) => (
              <div key={reason} className="flex items-center space-x-2">
                <Checkbox
                  id={reason}
                  checked={selectedReasons.includes(reason)}
                  onCheckedChange={(checked) =>
                    handleReasonToggle(reason, checked as boolean)
                  }
                />
                <label
                  htmlFor={reason}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {NEGATIVE_REASON_LABELS[reason]}
                </label>
              </div>
            ))}
          </div>

          {isOtherSelected && (
            <div className="space-y-2">
              <label htmlFor="comment" className="text-sm font-medium">
                Please tell us more
              </label>
              <Textarea
                id="comment"
                placeholder="Describe what didn't work for you..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}