'use client';
// src/app/generate/page.tsx

import { useState } from 'react';

export const dynamic = 'force-dynamic';
import { Sparkles } from 'lucide-react';
import { GenerationResult } from '@/components/generation-result';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionLabel } from '@/components/ui/section-label';
import { AspectRatioSelector, type AspectRatio } from '@/components/forms/aspect-ratio-selector';
import { GenerationForm } from '@/components/generation/generation-form';
import { InsufficientCreditsModal } from '@/components/generation/insufficient-credits-modal';
import { PageContainer } from '@/components/layout/page-container';
import { useCredits, useUserProfile } from '@/lib/auth';
import { trackEvent } from '@/lib/analytics/client';
import { trackActivity } from '@/lib/db/user-activity';

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
  const [costBreakdown, setCostBreakdown] = useState<any>(null);
  const [generationParams, setGenerationParams] = useState<any>(null);
  const [resetUploadForm, setResetUploadForm] = useState(false);

  const handleUploadComplete = (id: string, preview: string) => {
    setUploadId(id);
    setPreviewUrl(preview);
    setError(null);
  };

  const handleGenerate = async (params: {
    uploadId?: string;
    templateSlug: string;
    aspectRatio: AspectRatio;
    resolution: '1k' | '2k' | '4k';
    mode: 'lightning' | 'snail';
  }) => {
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
        template_slug: params.templateSlug,
        aspect_ratio: params.aspectRatio,
        resolution: params.resolution,
        mode: params.mode,
        has_source_image: !!params.uploadId,
      },
    });

    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
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
        setCostBreakdown(data.costBreakdown);
        setGenerationParams(params);
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
       if (typeof window !== 'undefined') {
         window.open(result.imageUrl, '_blank');
       }
     }
  };

  const handleRegenerate = () => {
    setResult(null);
    // Use the last generation parameters, or default values
    handleGenerate({
      uploadId: uploadId || undefined,
      templateSlug,
      aspectRatio,
      resolution: '1k',
      mode: 'lightning',
    });
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
        <Badge variant="outline">
          AI studio for ecommerce sellers
        </Badge>
      </div>

      <GenerationForm
        credits={credits}
        onGenerate={handleGenerate}
        generating={generating}
        error={error}
        uploadId={uploadId}
        previewUrl={previewUrl}
        templateSlug={templateSlug}
        aspectRatio={aspectRatio}
        result={result}
        onUploadComplete={handleUploadComplete}
        onTemplateChange={setTemplateSlug}
        onAspectRatioChange={setAspectRatio}
        onError={setError}
        onDownload={handleDownload}
        onRegenerate={handleRegenerate}
        onReset={handleReset}
        resetUploadForm={resetUploadForm}
      />

      {/* Credits Modal */}
      {costBreakdown && generationParams && (
        <InsufficientCreditsModal
          isOpen={showCreditsModal}
          currentBalance={credits}
          costBreakdown={costBreakdown}
          resolution={generationParams.resolution}
          mode={generationParams.mode}
          addons={generationParams.addons}
          onClose={() => setShowCreditsModal(false)}
        />
      )}
    </PageContainer>
  );
}
