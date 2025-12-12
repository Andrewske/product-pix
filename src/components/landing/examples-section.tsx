'use client';

import { useEffect, useRef, useState } from 'react';
import { BeforeAfterSlider } from '@/components/before-after-slider';

interface ExampleItem {
  beforeImage: string;
  afterImage: string;
  product: string;
  category: string;
}

interface ExamplesSectionProps {
  examples: ExampleItem[];
  className?: string;
}

export function ExamplesSection({ examples, className = '' }: ExamplesSectionProps) {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers = itemRefs.current.map((ref, index) => {
      if (!ref) return null;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleItems(prev => new Set([...prev, index]));
          }
        },
        {
          threshold: 0.1,
          rootMargin: '50px',
        }
      );

      observer.observe(ref);
      return observer;
    });

    return () => {
      observers.forEach(observer => observer?.disconnect());
    };
  }, [examples.length]);

  return (
    <section
      className={`py-24 px-4 sm:px-6 lg:px-8 ${className}`}
      aria-labelledby="examples-heading"
      aria-describedby="examples-description"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 id="examples-heading" className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 font-display">
            See the Transformation
          </h2>
          <p id="examples-description" className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From phone photos to professional product shots in seconds
          </p>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12"
          role="grid"
          aria-label="Product transformation examples"
        >
          {examples.map((example, index) => {
            const isVisible = visibleItems.has(index);
            const delay = index * 200; // Staggered delay

            return (
              <div
                key={index}
                ref={el => {
                  itemRefs.current[index] = el;
                }}
                className={`
                  relative transform transition-all duration-700 ease-out
                  ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                `}
                style={{
                  transitionDelay: `${delay}ms`,
                }}
                role="gridcell"
                aria-label={`Example ${index + 1}: ${example.product} transformation`}
              >
                {/* Offset positioning for visual interest */}
                <div
                  className={`
                    ${index % 2 === 0 ? 'md:translate-y-0 lg:translate-y-4' : 'md:translate-y-8 lg:translate-y-0'}
                    ${index % 3 === 0 ? 'lg:translate-x-2' : ''}
                    ${index % 3 === 2 ? 'lg:-translate-x-2' : ''}
                  `}
                >
                  <BeforeAfterSlider {...example} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}