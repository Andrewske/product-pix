import * as React from 'react';
import { Alert, AlertDescription } from '../primitives';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { ReviewCard } from './ReviewCard';
import type { UnreviewedImage } from '../../types';

export function ReviewView(): React.ReactElement {
  const [pendingImages, setPendingImages] = React.useState<UnreviewedImage[]>([]);
  const [ratedImages, setRatedImages] = React.useState<Map<string, number>>(new Map());
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchPendingImages();
  }, []);

  const fetchPendingImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/review/pending');
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setPendingImages(data.pending || []);
      }
    } catch (err) {
      setError(`Failed to load images: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async (testId: string, rating: number, imageIndex?: number) => {
    try {
      const res = await fetch('/api/review/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId, score: rating, imageIndex }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        // Update local state
        setRatedImages(new Map(ratedImages.set(testId, rating)));
        // Remove from pending list
        setPendingImages(pendingImages.filter(img => img.id !== testId));
      }
    } catch (err) {
      setError(`Failed to save rating: ${(err as Error).message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading images to review...</p>
        </div>
      </div>
    );
  }

  const unratedImages = pendingImages.filter(img => !ratedImages.has(img.id));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Human Review</h1>
          <p className="text-muted-foreground">
            Rate generated images and compare your scores with AI evaluations
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{unratedImages.length}</span>
            <span className="text-muted-foreground">images to review</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {unratedImages.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <h2 className="text-2xl font-semibold">All caught up!</h2>
            <p className="text-muted-foreground">No pending images to review at the moment.</p>
          </div>
        )}

        {/* Image Grid */}
        {unratedImages.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {unratedImages.map((image) => (
              <ReviewCard
                key={image.id}
                testId={image.id}
                imageUrl={image.imageUrl}
                imageUrls={image.imageUrls}
                prompt={image.finalPrompt}
                llmScore={image.llmScore}
                llmDetails={image.llmDetails}
                sourceImageUrl={image.sourceImageUrl}
                onRatingSubmit={handleRatingSubmit}
                isRated={ratedImages.has(image.id)}
                humanScore={ratedImages.get(image.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
