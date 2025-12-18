'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertBox } from '@/components/ui/alert-box';
import { SectionLabel } from '@/components/ui/section-label';
import { UploadForm } from '@/components/forms/upload-form';
import { TemplateSelector } from '@/components/forms/template-selector';
import { AspectRatioSelector, type AspectRatio } from '@/components/forms/aspect-ratio-selector';
import { GenerationResult } from '@/components/generation-result';
import { GenerationLoading } from '@/components/generation-loading';
import { Sparkles } from 'lucide-react';
import { CostBreakdown } from '@/components/pricing';
import { GenerationMode } from '@/lib/pricing/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface GenerationFormProps {
  credits: number;
  onGenerate: (params: {
    uploadId?: string;
    templateSlug: string;
    aspectRatio: AspectRatio;
    resolution: '1k' | '2k' | '4k';
    mode: GenerationMode;
  }) => void;
  generating: boolean;
  error: string | null;
  uploadId: string | null;
  previewUrl: string | null;
  templateSlug: string;
  aspectRatio: AspectRatio;
  result: { imageUrl: string; jobId: string; imageId: string } | null;
  onUploadComplete: (id: string, preview: string) => void;
  onTemplateChange: (slug: string) => void;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  onError: (error: string | null) => void;
  onDownload: (imageId: string, jobId: string, imageUrl: string) => void;
  onRegenerate: () => void;
  onReset: () => void;
  resetUploadForm: boolean;
}

export function GenerationForm({
  credits,
  onGenerate,
  generating,
  error,
  uploadId,
  previewUrl,
  templateSlug,
  aspectRatio,
  result,
  onUploadComplete,
  onTemplateChange,
  onAspectRatioChange,
  onError,
  onDownload,
  onRegenerate,
  onReset,
  resetUploadForm,
}: GenerationFormProps) {
  const [mode, setMode] = useState<GenerationMode>('lightning');

  const handleGenerate = () => {
    if (!templateSlug) {
      onError('Please select a template');
      return;
    }

    onGenerate({
      uploadId: uploadId || undefined,
      templateSlug,
      aspectRatio,
      resolution: '1k', // Could be made configurable later
      mode,
    });
  };

  const selectedResolution = '1k' as const; // Could be made configurable later

  return (
    <div className="grid md:grid-cols-[1fr_1.2fr] gap-8">
      {/* Left Column: Controls */}
      <div className="space-y-6">
        {/* Upload Section */}
        <div>
          <SectionLabel>UPLOAD PRODUCT IMAGE</SectionLabel>
          <UploadForm onUploadComplete={onUploadComplete} onError={onError} reset={resetUploadForm} />
          {previewUrl && (
            <Button onClick={onReset} variant="link" className="mt-2 text-sm text-destructive px-0">
              Remove image
            </Button>
          )}
        </div>

        {/* Style Section */}
        <div>
          <SectionLabel>CHOOSE STYLE</SectionLabel>
          <TemplateSelector value={templateSlug} onChange={onTemplateChange} disabled={generating} />
        </div>

        {/* Aspect Ratio Section */}
        <div>
          <SectionLabel>ASPECT RATIO</SectionLabel>
          <AspectRatioSelector value={aspectRatio} onChange={onAspectRatioChange} disabled={generating} />
        </div>

        {/* Processing Speed Section */}
        <div className="space-y-2">
          <SectionLabel>PROCESSING SPEED</SectionLabel>
          <RadioGroup value={mode} onValueChange={(value) => setMode(value as GenerationMode)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="lightning" id="lightning" />
              <Label htmlFor="lightning" className="flex items-center gap-2">
                ⚡ Lightning <span className="text-sm text-muted-foreground">(~3 min)</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="snail" id="snail" />
              <Label htmlFor="snail" className="flex items-center gap-2">
                🐌 Snail <span className="text-sm text-muted-foreground">(up to 2 hrs, 50% off)</span>
              </Label>
            </div>
          </RadioGroup>

          {/* Live cost preview */}
          <CostBreakdown
            resolution={selectedResolution}
            mode={mode}
            variant="compact"
            className="mt-2"
          />
        </div>

        {/* Error Display */}
        {error && (
          <AlertBox variant="error">{error}</AlertBox>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          variant="default"
          size="lg"
          className="w-full"
          disabled={generating || credits < 1}
        >
          {generating ? 'Generating...' : `Generate (${mode === 'lightning' ? '1' : '0.5'} credit${mode === 'snail' ? 's' : ''})`}
        </Button>

        <p className="text-sm text-muted-foreground text-center">
          You have <span className="font-semibold">{credits} credits</span> remaining
        </p>
      </div>

      {/* Right Column: Result */}
      <div>
        <SectionLabel>RESULT</SectionLabel>
        <Card className="min-h-[500px] flex flex-col">
          {generating ? (
            <div className="flex items-center justify-center h-full">
              <GenerationLoading />
            </div>
          ) : result ? (
            <GenerationResult
              imageUrl={result.imageUrl}
              imageId={result.imageId}
              onDownload={() => onDownload(result.imageId, result.jobId, result.imageUrl)}
              onRegenerate={onRegenerate}
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
  );
}