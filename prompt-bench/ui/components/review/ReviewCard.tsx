import * as React from 'react';
import { Button, ShadcnCard, CardContent, cn } from '../primitives';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../shadcn';
import { ChevronDown, Eye, Loader2 } from 'lucide-react';
import { RatingScale } from './RatingScale';
import { ScoreComparison } from './ScoreComparison';

interface ReviewCardProps {
  testId: string;
  imageUrl: string;
  imageUrls?: string[];
  prompt: string;
  llmScore: number;
  llmDetails: Record<string, unknown>;
  sourceImageUrl?: string | null;
  onRatingSubmit: (testId: string, rating: number, imageIndex?: number) => Promise<void>;
  isRated: boolean;
  humanScore?: number;
}

export function ReviewCard({
  testId,
  imageUrl,
  imageUrls,
  prompt,
  llmScore,
  llmDetails,
  sourceImageUrl,
  onRatingSubmit,
  isRated,
  humanScore,
}: ReviewCardProps): React.ReactElement {
  const [showPrompt, setShowPrompt] = React.useState(false);
  const [showSource, setShowSource] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedRating, setSelectedRating] = React.useState<number | null>(humanScore || null);

  const displayImages = imageUrls && imageUrls.length > 0 ? imageUrls : [imageUrl];
  const hasMultipleImages = displayImages.length > 1;

  const handleRatingChange = async (rating: number) => {
    setSelectedRating(rating);
    setIsSubmitting(true);
    try {
      await onRatingSubmit(testId, rating);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ShadcnCard className="overflow-hidden">
      <CardContent className="p-6 space-y-4">
        {/* Generated Images */}
        <div className={cn(
          'grid gap-4',
          hasMultipleImages ? 'grid-cols-2' : 'grid-cols-1'
        )}>
          {displayImages.map((imgUrl, idx) => (
            <div key={idx} className="relative group">
              <img
                src={imgUrl}
                alt={`Generated image ${idx + 1}`}
                className="w-full h-auto rounded-lg border border-border"
              />
              {hasMultipleImages && (
                <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium">
                  {idx + 1}/{displayImages.length}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Source Image Toggle */}
        {sourceImageUrl && (
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSource(!showSource)}
              className="w-full"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showSource ? 'Hide Original' : 'Show Original'}
            </Button>
            {showSource && (
              <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                <img
                  src={sourceImageUrl}
                  alt="Source image"
                  className="w-full h-auto rounded border border-border"
                />
              </div>
            )}
          </div>
        )}

        {/* Prompt (Collapsible) */}
        <Collapsible open={showPrompt} onOpenChange={setShowPrompt}>
          <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium hover:text-foreground">
            <span>Generation Prompt</span>
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', showPrompt && 'rotate-180')}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="bg-muted/30 p-3 rounded-md text-sm font-mono leading-relaxed whitespace-pre-wrap">
              {prompt}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Rating or Comparison */}
        {!isRated ? (
          <div className="space-y-3 pt-4 border-t">
            <p className="text-sm font-medium">Rate this image (1-10):</p>
            <RatingScale
              value={selectedRating}
              onChange={handleRatingChange}
              disabled={isSubmitting}
            />
            {isSubmitting && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving your rating...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="pt-4 border-t">
            <ScoreComparison
              humanScore={humanScore!}
              llmScore={llmScore}
              llmDetails={llmDetails}
            />
          </div>
        )}
      </CardContent>
    </ShadcnCard>
  );
}
