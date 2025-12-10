'use client';

import Image from 'next/image';
import { Camera, Sparkles } from 'lucide-react';
import { useState } from 'react';

const beforeImage = '/images/landing/example1-before.webp';
const afterImage = '/images/landing/example1-after.webp';

function Badge({
  icon: Icon,
  label
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white bg-black/70 backdrop-blur">
      <Icon className="h-4 w-4 text-emerald-300" />
      {label}
    </span>
  );
}

export function HeroComparison() {
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
    <figure
      role="img"
      aria-label="Before and after suitcase transformation"
      className="relative mt-24 w-full max-w-5xl mx-auto rounded-[36px] border border-white/10 bg-[#040607] p-4 sm:p-6 shadow-[0_35px_120px_rgba(15,23,42,0.45)]"
    >
      <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-emerald-500/15 via-transparent to-cyan-500/10 blur-[120px] opacity-80" aria-hidden="true" />

      {/* Desktop View - Diagonal Split */}
      <div className="hidden md:block">
        <div
          data-testid="hero-comparison-container"
          className="relative overflow-hidden rounded-[28px] border border-white/5 bg-gradient-to-br from-[#070b12] via-[#05070b] to-[#030406] aspect-[2/1]"
        >
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute -inset-24 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
            <div className="absolute inset-y-6 left-1/2 h-[120%] w-40 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl" />
          </div>

          {/* Before Image - Bottom Layer */}
          <div className="absolute inset-0 z-0">
            <Image
              src={beforeImage}
              alt="Before photo of suitcase in cluttered room"
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 480px, (min-width: 768px) 50vw, 100vw"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-70"
              style={{ backgroundImage: 'radial-gradient(circle at 15% 20%, rgba(255,255,255,0.2), transparent 55%)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/30" aria-hidden="true" />
          </div>

          {/* After Image - Top Layer with Clip Path */}
          <div className="absolute inset-0 z-10" style={{ clipPath: 'polygon(30% 100%, 70% 0, 100% 0, 100% 100%)' }}>
            <Image
              src={afterImage}
              alt="After photo of suitcase on white background"
              fill
              priority
              className="object-cover"
              sizes="(min-width: 1024px) 480px, (min-width: 768px) 50vw, 100vw"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-70"
              style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(52,211,153,0.3), transparent 60%)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/30" aria-hidden="true" />
          </div>

          {/* Before Badge */}
          <div className="absolute bottom-4 left-4 z-20">
            <Badge icon={Camera} label="Before: Raw Snapshot" />
          </div>

          {/* After Badge */}
          <div className="absolute bottom-4 right-4 z-20">
            <Badge icon={Sparkles} label="After: Studio Quality" />
          </div>

          {/* SVG Divider */}
          <svg
            data-testid="hero-comparison-divider"
            className="absolute inset-0 z-20 pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <line
              x1="30"
              y1="100"
              x2="70"
              y2="0"
              stroke="#10b981"
              strokeWidth="0.5"
              filter="drop-shadow(0 0 4px rgba(16, 185, 129, 0.8))"
            />
          </svg>
        </div>
      </div>

      {/* Mobile View - Interactive Slider */}
      <div className="md:hidden">
        <div
          data-testid="hero-comparison-mobile-container"
          className="relative overflow-hidden rounded-[28px] border border-white/5 bg-gradient-to-br from-[#070b12] via-[#05070b] to-[#030406] p-5 sm:p-8 aspect-[4/3]"
        >
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute -inset-24 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
            <div className="absolute inset-y-6 left-1/2 h-[120%] w-40 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl" />
          </div>

          <div
            className="relative aspect-[4/3] overflow-hidden rounded-lg shadow-lg cursor-ew-resize select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            tabIndex={0}
            role="slider"
            aria-label="Compare suitcase before and after images"
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
              alt="After photo of suitcase on white background"
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />

            {/* Before image (clipped) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <Image
                src={beforeImage}
                alt="Before photo of suitcase in cluttered room"
                fill
                className="object-cover"
                sizes="100vw"
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
            <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm font-medium z-20">
              Before
            </div>
            <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-sm font-medium z-20">
              After
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}
