'use client';
// src/app/generate/page.tsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadForm } from '@/components/forms/upload-form';
import { TemplateSelector } from '@/components/forms/template-selector';
import { GenerationResult } from '@/components/generation-result';
import { GenerationLoading } from '@/components/generation-loading';
import { InsufficientCreditsModal } from '@/components/generation/insufficient-credits-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCredits } from '@/lib/auth';

type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9';

export default function GeneratePage() {
  const router = useRouter();
  const { credits } = useCredits();

  const [uploadId, setUploadId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState('');
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
    if (!templateId) {
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
          templateId,
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-8">Generate Product Photo</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left column: Input */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium mb-4">
              1. Upload Product Image (Optional)
            </h2>
            <UploadForm
              onUploadComplete={handleUploadComplete}
              onError={setError}
            />
            {previewUrl && (
              <Button
                onClick={handleReset}
                variant="link"
                className="mt-2 text-sm text-destructive hover:text-destructive/90 px-0"
              >
                Remove image
              </Button>
            )}
          </div>

          <div>
            <h2 className="text-lg font-medium mb-4">2. Select Style</h2>
            <TemplateSelector
              value={templateId}
              onChange={setTemplateId}
              disabled={generating}
            />
          </div>

          <div>
            <h2 className="text-lg font-medium mb-4">3. Aspect Ratio</h2>
            <div className="grid grid-cols-3 gap-2">
              {(['1:1', '4:3', '3:4', '16:9', '9:16', '3:2'] as AspectRatio[]).map((ratio) => (
                <Button
                  key={ratio}
                  variant={aspectRatio === ratio ? "default" : "outline"}
                  onClick={() => setAspectRatio(ratio)}
                  size="sm"
                >
                  {ratio}
                </Button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded">
              {error}
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={generating || credits < 1}
            className="w-full"
            size="lg"
          >
            {generating ? 'Generating...' : `Generate (1 credit)`}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            You have {credits} credits remaining
          </p>
        </div>

        {/* Right column: Output */}
        <div>
          <h2 className="text-lg font-medium mb-4">Result</h2>
          <Card className="p-4 min-h-[400px] flex items-center justify-center bg-muted/50">
            {generating ? (
              <GenerationLoading />
            ) : result ? (
              <GenerationResult
                imageUrl={result.imageUrl}
                onDownload={handleDownload}
                onRegenerate={handleRegenerate}
              />
            ) : (
              <p className="text-muted-foreground">
                Generated image will appear here
              </p>
            )}
          </Card>
        </div>
      </div>

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
