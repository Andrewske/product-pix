'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BeforeAfterSlider } from '@/components/before-after-slider';

interface ExampleItem {
  beforeImage: string;
  afterImage: string;
  product: string;
  category: string;
}

interface HeroSectionProps {
  example: ExampleItem;
  className?: string;
}

export function HeroSection({ example, className = '' }: HeroSectionProps) {
  return (
    <section
      className={`relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden ${className}`}
      aria-labelledby="hero-heading"
      aria-describedby="hero-description"
    >
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-20 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h1
            id="hero-heading"
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-8 leading-tight font-display"
          >
            Professional Product Photos <br className="hidden sm:block" />
            <span className="text-primary">in Seconds</span>
          </h1>
          <p
            id="hero-description"
            className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            Transform phone photos into studio-quality product images. <br className="hidden sm:block" />
            No design skills needed. Perfect for e-commerce.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center" role="group" aria-label="Primary actions">
            <Link href="/signup">
              <Button
                size="lg"
                className="text-lg px-8 py-6 h-auto font-semibold shadow-lg shadow-primary/20"
                aria-describedby="signup-description"
              >
                Get 5 Free Photos
              </Button>
              <span id="signup-description" className="sr-only">
                Start with 5 free product photo generations, no credit card required
              </span>
            </Link>
            <Link href="#how-it-works">
              <Button
                variant="ghost"
                size="lg"
                className="text-lg px-8 py-6 h-auto"
                aria-describedby="how-it-works-description"
              >
                See how it works
              </Button>
              <span id="how-it-works-description" className="sr-only">
                Learn about our three-step process for transforming product photos
              </span>
            </Link>
          </div>
        </div>

        <div className="flex justify-center max-w-4xl mx-auto">
          <div
            className="relative w-full aspect-square md:aspect-video rounded-2xl overflow-hidden border border-border/50 shadow-2xl bg-card"
            role="img"
            aria-label={`Before and after comparison showing ${example.product} transformation from phone photo to professional product image`}
          >
            <BeforeAfterSlider {...example} />
          </div>
        </div>
      </div>
    </section>
  );
}