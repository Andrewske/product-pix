// src/components/image-gallery.tsx
'use client';

import { useState } from 'react';
import { ImageCard } from './image-card';
import { Button } from '@/components/ui/button';
import type { GeneratedImage } from '@/types';

interface ImageGalleryProps {
  images: GeneratedImage[];
}

export function ImageGallery({ images: initialImages }: ImageGalleryProps) {
  const [images, setImages] = useState(initialImages);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');

  const filteredImages = filter === 'favorites'
    ? images.filter((img) => img.is_favorite)
    : images;

  const handleFavorite = async (id: string) => {
    const response = await fetch(`/api/images/${id}/favorite`, {
      method: 'POST',
    });

    if (response.ok) {
      setImages((prev) =>
        prev.map((img) =>
          img.id === id ? { ...img, is_favorite: !img.is_favorite } : img
        )
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    const response = await fetch(`/api/images/${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      setImages((prev) => prev.filter((img) => img.id !== id));
    }
  };

  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'product-photo.png';
    link.click();
  };

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-4 border-b">
        <Button
          variant="ghost"
          onClick={() => setFilter('all')}
          className={`rounded-none border-b-2 px-1 ${
            filter === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          All ({images.length})
        </Button>
        <Button
          variant="ghost"
          onClick={() => setFilter('favorites')}
          className={`rounded-none border-b-2 px-1 ${
            filter === 'favorites'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Favorites ({images.filter((img) => img.is_favorite).length})
        </Button>
      </div>

      {/* Image grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredImages.map((image) => (
          <ImageCard
            key={image.id}
            image={image}
            onFavorite={handleFavorite}
            onDelete={handleDelete}
            onDownload={handleDownload}
          />
        ))}
      </div>

      {filteredImages.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          {filter === 'favorites' ? 'No favorites yet' : 'No images'}
        </p>
      )}
    </div>
  );
}
