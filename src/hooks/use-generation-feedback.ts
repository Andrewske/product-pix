// src/hooks/use-generation-feedback.ts
'use client';

import { useImageFeedback } from '@/hooks/use-image-feedback';
import type { FeedbackType, NegativeFeedbackReason } from '@/types';

interface UseGenerationFeedbackOptions {
  imageId: string;
}

interface UseGenerationFeedbackReturn {
  feedbackProps: {
    currentFeedback: FeedbackType | null;
    isSubmitting: boolean;
    showNegativeModal: boolean;
    setShowNegativeModal: (show: boolean) => void;
    handleThumbsUp: () => void;
    handleThumbsDown: () => void;
    handleNegativeSubmit: (reasons: NegativeFeedbackReason[], comment: string) => Promise<void>;
  };
}

export function useGenerationFeedback({
  imageId,
}: UseGenerationFeedbackOptions): UseGenerationFeedbackReturn {
  const {
    currentFeedback,
    isSubmitting,
    showNegativeModal,
    setShowNegativeModal,
    handleThumbsUp,
    handleThumbsDown,
    handleNegativeSubmit,
  } = useImageFeedback({ imageId });

  return {
    feedbackProps: {
      currentFeedback,
      isSubmitting,
      showNegativeModal,
      setShowNegativeModal,
      handleThumbsUp,
      handleThumbsDown,
      handleNegativeSubmit,
    },
  };
}