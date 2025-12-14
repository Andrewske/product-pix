'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  FeedbackType,
  PositiveFeedbackReason,
  NegativeFeedbackReason,
  ImageFeedback,
  SubmitFeedbackParams
} from '@/types';

interface UseImageFeedbackOptions {
  imageId: string;
}

interface UseImageFeedbackReturn {
  currentFeedback: FeedbackType | null;
  isLoading: boolean;
  isSubmitting: boolean;
  showNegativeModal: boolean;
  setShowNegativeModal: (show: boolean) => void;
  selectedPositiveReasons: PositiveFeedbackReason[];
  togglePositiveReason: (reason: PositiveFeedbackReason) => void;
  handleThumbsUp: () => void;
  handleThumbsDown: () => void;
  handleNegativeSubmit: (reasons: NegativeFeedbackReason[], comment: string) => Promise<void>;
  handlePositiveDismiss: () => void;
}

async function fetchFeedback(imageId: string): Promise<ImageFeedback | null> {
  const response = await fetch(`/api/images/${imageId}/feedback`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error('Failed to fetch feedback');
  }
  return response.json();
}

async function submitFeedbackApi(imageId: string, params: SubmitFeedbackParams): Promise<ImageFeedback> {
  const response = await fetch(`/api/images/${imageId}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Failed to submit feedback');
  }

  return response.json();
}

export function useImageFeedback({ imageId }: UseImageFeedbackOptions): UseImageFeedbackReturn {
  const queryClient = useQueryClient();
  const [showNegativeModal, setShowNegativeModal] = useState(false);
  const [selectedPositiveReasons, setSelectedPositiveReasons] = useState<PositiveFeedbackReason[]>([]);

  // Query for existing feedback
  const { data: feedback, isLoading } = useQuery({
    queryKey: ['feedback', imageId],
    queryFn: () => fetchFeedback(imageId),
  });

  // Mutation for submitting feedback
  const submitMutation = useMutation({
    mutationFn: (params: SubmitFeedbackParams) => submitFeedbackApi(imageId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback', imageId] });
    },
  });

  const currentFeedback = feedback?.feedbackType ?? null;
  const isSubmitting = submitMutation.isPending;

  const togglePositiveReason = (reason: PositiveFeedbackReason) => {
    setSelectedPositiveReasons(prev =>
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const handleThumbsUp = () => {
    // Submit positive feedback with empty reasons initially
    submitMutation.mutate({
      imageId,
      feedbackType: 'positive',
      reasons: [],
    });

    // Show toast
    toast.success('Thanks for the feedback!', {
      description: 'What did you like about this image?',
      action: {
        label: 'Add details',
        onClick: () => {
          // Toast will auto-dismiss, triggering handlePositiveDismiss
        },
      },
      duration: 5000,
    });
  };

  const handleThumbsDown = () => {
    setShowNegativeModal(true);
  };

  const handleNegativeSubmit = async (reasons: NegativeFeedbackReason[], comment: string) => {
    await submitMutation.mutateAsync({
      imageId,
      feedbackType: 'negative',
      reasons,
      comment,
    });

    setShowNegativeModal(false);
  };

  const handlePositiveDismiss = () => {
    // Update feedback with selected reasons if any were chosen
    if (selectedPositiveReasons.length > 0) {
      submitMutation.mutate({
        imageId,
        feedbackType: 'positive',
        reasons: selectedPositiveReasons,
      });
    }

    // Clear local state
    setSelectedPositiveReasons([]);
  };

  return {
    currentFeedback,
    isLoading,
    isSubmitting,
    showNegativeModal,
    setShowNegativeModal,
    selectedPositiveReasons,
    togglePositiveReason,
    handleThumbsUp,
    handleThumbsDown,
    handleNegativeSubmit,
    handlePositiveDismiss,
  };
}