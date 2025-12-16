// src/components/generation-result.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useGenerationFeedback } from '@/hooks/use-generation-feedback';
import { FeedbackButtons } from '@/components/feedback/feedback-buttons';
import { NegativeFeedbackModal } from '@/components/feedback/negative-feedback-modal';

interface GenerationResultProps {
  imageUrl: string;
  imageId: string;
  onDownload: () => void;
  onRegenerate: () => void;
}

export function GenerationResult({
  imageUrl,
  imageId,
  onDownload,
  onRegenerate,
}: GenerationResultProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  const { feedbackProps } = useGenerationFeedback({ imageId });
  const {
    currentFeedback,
    isSubmitting,
    showNegativeModal,
    setShowNegativeModal,
    handleThumbsUp,
    handleThumbsDown,
    handleNegativeSubmit,
  } = feedbackProps;

  return (
    <div className="h-full flex flex-col p-6">
      <div className="relative w-full h-96">
        <Image
          src={imageUrl}
          alt="Generated product photo"
          fill
          className={`
            object-contain rounded-lg cursor-pointer transition-transform
            ${isZoomed ? 'scale-150 z-50' : 'hover:scale-105'}
          `}
          onClick={() => setIsZoomed(!isZoomed)}
        />

        {isZoomed && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsZoomed(false)}
          />
        )}
      </div>

      <div className="flex gap-3 mt-4">
        <Button onClick={onDownload} variant="default" className="flex-1">
          Download
        </Button>
        <Button onClick={onRegenerate} variant="outline" className="flex-1">
          Regenerate
        </Button>
      </div>

      <div className="mt-4">
        <FeedbackButtons
          imageId={imageId}
          currentFeedback={currentFeedback}
          onThumbsUp={handleThumbsUp}
          onThumbsDown={handleThumbsDown}
          disabled={isSubmitting}
        />
      </div>

      <NegativeFeedbackModal
        open={showNegativeModal}
        onOpenChange={setShowNegativeModal}
        onSubmit={handleNegativeSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
