'use client';

import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FeedbackType } from '@/types';

interface FeedbackButtonsProps {
  imageId: string;
  currentFeedback: FeedbackType | null;
  onThumbsUp: () => void;
  onThumbsDown: () => void;
  disabled?: boolean;
  size?: 'default' | 'sm';
}

export function FeedbackButtons({
  currentFeedback,
  onThumbsUp,
  onThumbsDown,
  disabled = false,
  size = 'default',
}: FeedbackButtonsProps) {
  const buttonSize = size === 'sm' ? 'sm' : 'default';

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={currentFeedback === 'positive' ? 'default' : 'outline'}
        size={buttonSize}
        onClick={onThumbsUp}
        disabled={disabled}
        aria-label="Like this image"
        className={cn(
          'transition-colors',
          currentFeedback === 'positive' && 'bg-primary hover:bg-primary/90'
        )}
      >
        <ThumbsUp className={cn('h-4 w-4', size === 'sm' && 'h-3 w-3')} />
      </Button>

      <Button
        variant={currentFeedback === 'negative' ? 'default' : 'outline'}
        size={buttonSize}
        onClick={onThumbsDown}
        disabled={disabled}
        aria-label="Dislike this image"
        className={cn(
          'transition-colors',
          currentFeedback === 'negative' && 'bg-red-600 hover:bg-red-700'
        )}
      >
        <ThumbsDown className={cn('h-4 w-4', size === 'sm' && 'h-3 w-3')} />
      </Button>
    </div>
  );
}