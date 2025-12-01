// src/app/generate/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadForm } from '@/components/forms/upload-form';
import { PromptInput } from '@/components/forms/prompt-input';
import { GenerationResult } from '@/components/generation-result';
import { GenerationLoading } from '@/components/generation-loading';
import { useCredits } from '@/lib/auth';

type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9';

export default function GeneratePage() {
  const router = useRouter();
  const { credits } = useCredits();

  const [uploadId, setUploadId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('Professional product photo on clean white background with soft shadows');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ imageUrl: string; jobId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUploadComplete = (id: string, preview: string) => {
    setUploadId(id);
    setPreviewUrl(preview);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
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
          prompt,
          aspectRatio,
          resolution: '1k',
        }),
      });

      const data = await response.json();

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
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Generate Product Photo</h1>

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
              <button
                onClick={handleReset}
                className="mt-2 text-sm text-red-600 hover:text-red-700"
              >
                Remove image
              </button>
            )}
          </div>

          <div>
            <h2 className="text-lg font-medium mb-4">2. Describe the Output</h2>
            <PromptInput
              value={prompt}
              onChange={setPrompt}
              disabled={generating}
            />
          </div>

          <div>
            <h2 className="text-lg font-medium mb-4">3. Aspect Ratio</h2>
            <div className="grid grid-cols-3 gap-2">
              {(['1:1', '4:3', '3:4', '16:9', '9:16', '3:2'] as AspectRatio[]).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`
                    px-3 py-2 rounded-md border text-sm
                    ${aspectRatio === ratio
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-300 hover:border-gray-400'
                    }
                  `}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating || credits < 1}
            className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? 'Generating...' : `Generate (1 credit)`}
          </button>

          <p className="text-sm text-gray-500 text-center">
            You have {credits} credits remaining
          </p>
        </div>

        {/* Right column: Output */}
        <div>
          <h2 className="text-lg font-medium mb-4">Result</h2>
          <div className="border rounded-lg p-4 min-h-[400px] flex items-center justify-center bg-gray-50">
            {generating ? (
              <GenerationLoading />
            ) : result ? (
              <GenerationResult
                imageUrl={result.imageUrl}
                onDownload={handleDownload}
                onRegenerate={handleRegenerate}
              />
            ) : (
              <p className="text-gray-400">
                Generated image will appear here
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
