// src/components/image-card.tsx
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import type { GeneratedImage } from '@/types';

interface ImageCardProps {
  image: GeneratedImage;
  onFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (url: string) => void;
}

export function ImageCard({ image, onFavorite, onDelete, onDownload }: ImageCardProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <Card
      variant="hero"
      hover
      className="relative group shadow-2xl"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="relative w-full aspect-square">
        <Image
          src={image.public_url}
          alt="Generated product"
          fill
          className="object-cover"
        />
      </div>

      {/* Overlay actions */}
      <div
        className={`
          absolute inset-0 bg-black/40 flex items-center justify-center space-x-2
          transition-opacity duration-200
          ${showActions ? 'opacity-100' : 'opacity-0'}
        `}
      >
        <button
          onClick={() => onDownload(image.public_url)}
          className="p-2 bg-background rounded-full hover:bg-secondary"
          title="Download"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>

        <button
          onClick={() => onFavorite(image.id)}
          className={`p-2 rounded-full ${image.is_favorite ? 'bg-destructive text-destructive-foreground' : 'bg-background hover:bg-secondary'}`}
          title={image.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg className="w-5 h-5" fill={image.is_favorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        <button
          onClick={() => onDelete(image.id)}
          className="p-2 bg-background rounded-full hover:bg-secondary"
          title="Delete"
        >
          <svg className="w-5 h-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Favorite indicator */}
      {image.is_favorite && (
        <div className="absolute top-2 right-2">
          <svg className="w-5 h-5 text-destructive fill-current" viewBox="0 0 24 24">
            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
      )}
    </Card>
  );
}
