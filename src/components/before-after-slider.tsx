'use client';

import { useState } from 'react';
import Image from 'next/image';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  product: string;
  category: string;
}

export function BeforeAfterSlider({ beforeImage, afterImage, product, category }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.min(Math.max(percentage, 0), 100));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.min(Math.max(percentage, 0), 100));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSliderPosition(prev => Math.max(prev - 5, 0));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSliderPosition(prev => Math.min(prev + 5, 100));
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div
        className="relative aspect-square overflow-hidden rounded-lg shadow-lg cursor-ew-resize select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        tabIndex={0}
        role="slider"
        aria-label={`Compare ${product} before and after images`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={sliderPosition}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onKeyDown={handleKeyDown}
      >
        {/* After image (full width) */}
        <Image
          src={afterImage}
          alt={`${product} - Enhanced`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />

        {/* Before image (clipped) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <Image
            src={beforeImage}
            alt={`${product} - Original`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>

        {/* Slider handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize z-10"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-gray-200 flex items-center justify-center">
            <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm font-medium">
          Before
        </div>
        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-sm font-medium">
          After
        </div>
      </div>

      <div className="mt-4 text-center">
        <h3 className="font-semibold text-lg">{product}</h3>
        <p className="text-muted-foreground text-sm">{category}</p>
      </div>
    </div>
  );
}