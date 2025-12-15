'use client';
// src/app/generate/page.tsx

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { UploadForm } from '@/components/forms/upload-form';
import { TemplateSelector } from '@/components/forms/template-selector';
import { AspectRatioSelector, type AspectRatio } from '@/components/forms/aspect-ratio-selector';
import { GenerationResult } from '@/components/generation-result';
import { GenerationLoading } from '@/components/generation-loading';
import { InsufficientCreditsModal } from '@/components/generation/insufficient-credits-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertBox } from '@/components/ui/alert-box';
import { SectionLabel } from '@/components/ui/section-label';
import { PageContainer } from '@/components/layout/page-container';
import { useCredits, useUserProfile } from '@/lib/auth';
import { trackEvent } from '@/lib/analytics';
import { trackActivity } from '@/lib/db';

export default function GeneratePage() {
  const { credits } = useCredits();
  const { user } = useUserProfile();

  const [uploadId, setUploadId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [templateSlug, setTemplateSlug] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ imageUrl: string; jobId: string; imageId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [creditsNeeded, setCreditsNeeded] = useState(0);
  const [resetUploadForm, setResetUploadForm] = useState(false);

  const handleUploadComplete = (id: string, preview: string) => {
    setUploadId(id);
    setPreviewUrl(preview);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!templateSlug) {
      setError('Please select a template');
      return;
    }

    if (credits < 1) {
      setError('Insufficient credits. Please purchase more credits.');
      return;
    }

    setGenerating(true);
    setError(null);
    setResult(null);

    const startTime = Date.now();
    const jobId = crypto.randomUUID();

    trackEvent({
      event: 'generation_started',
      properties: {
        job_id: jobId,
        user_id: user?.id || '',
        template_slug: templateSlug,
        aspect_ratio: aspectRatio,
        resolution: '1k',
        has_source_image: !!uploadId,
      },
    });

    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId: uploadId || undefined,
          templateSlug,
          aspectRatio,
          resolution: '1k',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.status === 402) {
        trackEvent({
          event: 'insufficient_credits',
          properties: {
            user_id: user?.id || '',
            required_credits: data.required,
            available_credits: credits,
            operation_type: 'generation',
          },
        });

        setCreditsNeeded(data.required);
        setShowCreditsModal(true);
        setGenerating(false);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setResult({
        imageUrl: data.imageUrl,
        jobId: data.jobId,
        imageId: data.imageId,
      });

      trackEvent({
        event: 'generation_completed',
        properties: {
          job_id: data.jobId,
          user_id: user?.id || '',
          template_slug: templateSlug,
          image_count: 1,
          processing_time_seconds: (Date.now() - startTime) / 1000,
          credits_consumed: 1,
        },
      });
    } catch (err) {
      console.error('Generation error:', err);

      trackEvent({
        event: 'generation_failed',
        properties: {
          job_id: jobId,
          user_id: user?.id || '',
          template_slug: templateSlug,
          error_type: 'api_error',
          error_message: err instanceof Error ? err.message : 'Generation failed',
          credits_consumed: 0,
        },
      });

      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Generation failed');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!result) return;

    trackEvent({
      event: 'image_downloaded',
      properties: {
        image_id: result.imageId,
        user_id: user?.id || '',
        job_id: result.jobId,
        template_slug: templateSlug,
        download_format: 'png',
      },
    });

    await trackActivity(user!.id, 'image_download', { imageId: result.imageId });

    try {
      // Fetch the image as a blob to ensure proper download
      const response = await fetch(result.imageUrl);
      const blob = await response.blob();

      // Create object URL for download
      const objectUrl = URL.createObjectURL(blob);

      // Create and trigger download
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = 'product-photo.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up object URL
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to opening in new tab if download fails
      window.open(result.imageUrl, '_blank');
    }
  };

  const handleRegenerate = () => {
    setResult(null);
    handleGenerate();
  };

  const handleReset = () => {
    setUploadId(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setResetUploadForm(true);
    // Reset the flag after a short delay to allow re-triggering
    setTimeout(() => setResetUploadForm(false), 100);
  };

  return (
    <PageContainer narrow>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold font-display">Generate Product Photo</h1>
        <Badge variant="teal">
          AI studio for ecommerce sellers
        </Badge>
      </div>

      <div className="grid md:grid-cols-[1fr_1.2fr] gap-8">
        {/* Left Column: Controls */}
        <div className="space-y-6">
          {/* Upload Section */}
          <div>
            <SectionLabel>UPLOAD PRODUCT IMAGE</SectionLabel>
            <UploadForm onUploadComplete={handleUploadComplete} onError={setError} reset={resetUploadForm} />
            {previewUrl && (
              <Button onClick={handleReset} variant="link" className="mt-2 text-sm text-destructive px-0">
                Remove image
              </Button>
            )}
          </div>

          {/* Style Section */}
          <div>
            <SectionLabel>CHOOSE STYLE</SectionLabel>
            <TemplateSelector value={templateSlug} onChange={setTemplateSlug} disabled={generating} />
          </div>

          {/* Aspect Ratio Section */}
          <div>
            <SectionLabel>ASPECT RATIO</SectionLabel>
            <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} disabled={generating} />
          </div>

          {/* Error Display */}
          {error && (
            <AlertBox variant="error">{error}</AlertBox>
          )}

          {/* Generate Button */}
          <Button onClick={handleGenerate} disabled={generating || credits < 1} variant="accent" className="w-full border-none shadow-2xl !text-black bg-green-600 opacity-90 hover:opacity-100 hover:scale-105 transition-all" size="lg">
            {generating ? 'Generating...' : 'Generate (1 credit)'}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            You have <span className="font-semibold">{credits} credits</span> remaining
          </p>
        </div>

        {/* Right Column: Result */}
        <div>
          <SectionLabel>RESULT</SectionLabel>
          <Card variant="hero" className="min-h-[500px] flex flex-col">
            {generating ? (
              <div className="flex items-center justify-center h-full">
                <GenerationLoading />
              </div>
            ) : result ? (
              <GenerationResult
                imageUrl={result.imageUrl}
                imageId={result.imageId}
                onDownload={handleDownload}
                onRegenerate={handleRegenerate}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                <div>
                  <Sparkles className="w-8 h-8 mx-auto mb-3 text-primary/50" />
                  <p>Your studio-ready photo will appear here after you generate.</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Credits Modal */}
      {showCreditsModal && (
        <InsufficientCreditsModal
          currentBalance={credits}
          requiredCredits={creditsNeeded}
          onClose={() => setShowCreditsModal(false)}
        />
      )}
    </PageContainer>
  );
}
