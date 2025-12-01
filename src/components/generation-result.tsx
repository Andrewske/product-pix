// src/components/generation-result.tsx
'use client';

import { useState } from 'react';

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
    <div className="space-y-4">
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

      <div className="flex space-x-3">
        <button
          onClick={onDownload}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Download
        </button>
        <button
          onClick={onRegenerate}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Regenerate
        </button>
      </div>
    </div>
  );
}
