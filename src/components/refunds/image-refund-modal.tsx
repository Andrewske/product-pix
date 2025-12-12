'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CheckCircleIcon, ClockIcon } from 'lucide-react';
import type { RefundReason } from '@/types';

interface ImageRefundModalProps {
  imageId: string;
  jobId: string;
  creditsRefunded: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImageRefundModal({
  imageId,
  jobId,
  creditsRefunded,
  isOpen,
  onClose,
  onSuccess,
}: ImageRefundModalProps) {
  const [reason, setReason] = useState<RefundReason | ''>('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    status: 'approved' | 'pending_admin';
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      // Get the job ID for this image (we need this for the refund request)
      // For now, we'll assume we can get it from the image data or make an additional API call
      // In a real implementation, this would be passed as a prop or fetched

      const response = await fetch('/api/refunds/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId,
          jobId,
          reason,
          feedback: feedback.trim() || undefined,
          creditsRefunded,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit refund request');
      }

      setResult({
        status: data.status,
        message: data.message,
      });

      // If approved, call onSuccess after a delay and close modal
      if (data.status === 'approved') {
        setTimeout(() => {
          onSuccess();
          onClose();
          // Reset form
          setReason('');
          setFeedback('');
          setResult(null);
        }, 2000);
      }
    } catch (error) {
      console.error('Refund submission error:', error);
      setResult({
        status: 'pending_admin',
        message: 'Failed to submit refund request. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      // Reset form
      setReason('');
      setFeedback('');
      setResult(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Image Refund</DialogTitle>
          <DialogDescription>
            Tell us why you&apos;d like to request a refund for this image. We&apos;ll review your request and process it as quickly as possible.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for refund *</Label>
              <Select value={reason} onValueChange={(value) => setReason(value as RefundReason)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="poor_quality">Poor quality</SelectItem>
                  <SelectItem value="wrong_style">Wrong style</SelectItem>
                  <SelectItem value="technical_issue">Technical issue</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Additional feedback (optional)</Label>
              <Textarea
                id="feedback"
                placeholder="Tell us more about your experience..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!reason || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {result.status === 'approved' ? (
                <CheckCircleIcon className="w-8 h-8 text-green-500" />
              ) : (
                <ClockIcon className="w-8 h-8 text-blue-500" />
              )}
              <div>
                <h3 className="font-semibold">
                  {result.status === 'approved' ? 'Refund Approved!' : 'Under Review'}
                </h3>
                <p className="text-sm text-muted-foreground">{result.message}</p>
              </div>
            </div>

            {result.status === 'pending_admin' && (
              <DialogFooter>
                <Button onClick={handleClose}>Close</Button>
              </DialogFooter>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}