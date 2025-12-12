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
import { useCredits } from '@/lib/auth';

export default function GeneratePage() {
  const { credits } = useCredits();

  const [uploadId, setUploadId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [templateSlug, setTemplateSlug] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ imageUrl: string; jobId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [creditsNeeded, setCreditsNeeded] = useState(0);

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

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId: uploadId || undefined,
          templateSlug,
          aspectRatio,
          resolution: '1k',
        }),
      });

      const data = await response.json();

      if (response.status === 402) {
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
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result.imageUrl;
    link.download = 'product-photo.png';
    link.click();
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
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold">Generate Product Photo</h1>
        <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20">
          AI studio for ecommerce sellers
        </Badge>
      </div>

      <div className="grid md:grid-cols-[1fr_1.2fr] gap-8">
        {/* Left Column: Controls */}
        <div className="space-y-6">
          {/* Upload Section */}
          <div>
            <SectionLabel>UPLOAD PRODUCT IMAGE</SectionLabel>
            <UploadForm onUploadComplete={handleUploadComplete} onError={setError} />
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
          <Button onClick={handleGenerate} disabled={generating || credits < 1} className="w-full" size="lg">
            {generating ? 'Generating...' : 'Generate (1 credit)'}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            You have <span className="font-semibold">{credits} credits</span> remaining
          </p>
        </div>

        {/* Right Column: Result */}
        <div>
          <SectionLabel>RESULT</SectionLabel>
          <Card className="min-h-[500px] flex items-center justify-center bg-muted/30">
            {generating ? (
              <GenerationLoading />
            ) : result ? (
              <GenerationResult imageUrl={result.imageUrl} onDownload={handleDownload} onRegenerate={handleRegenerate} />
            ) : (
              <div className="text-center text-muted-foreground">
                <Sparkles className="w-8 h-8 mx-auto mb-3 text-primary/50" />
                <p>Your studio-ready photo will appear here after you generate.</p>
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
    </div>
  );
}
