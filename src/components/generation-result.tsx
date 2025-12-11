// src/components/generation-result.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface GenerationResultProps {
  imageUrl: string;
  onDownload: () => void;
  onRegenerate: () => void;
}

export function GenerationResult({
  imageUrl,
  onDownload,
  onRegenerate,
}: GenerationResultProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <Card variant="studio" className="p-6 space-y-4">
      <div className="relative">
        <img
          src={imageUrl}
          alt="Generated product photo"
          className={`
            rounded-lg cursor-pointer transition-transform
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

      <div className="flex gap-3">
        <Button onClick={onDownload} className="flex-1">
          Download
        </Button>
        <Button onClick={onRegenerate} variant="outline" className="flex-1">
          Regenerate
        </Button>
      </div>
    </Card>
  );
}
