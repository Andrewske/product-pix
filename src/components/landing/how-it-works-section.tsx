'use client';

import { useEffect, useRef, useState } from 'react';

interface StepItem {
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface HowItWorksSectionProps {
  className?: string;
}

const steps: StepItem[] = [
  {
    step: 1,
    title: "Upload",
    description: "Drop your raw product photo directly from your phone.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        role="img"
        aria-label="Upload icon"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    )
  },
  {
    step: 2,
    title: "Style",
    description: "Choose from our curated templates or describe your own scene.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        role="img"
        aria-label="Style customization icon"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    )
  },
  {
    step: 3,
    title: "Download",
    description: "Get high-resolution, marketplace-ready images instantly.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        role="img"
        aria-label="Download icon"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    )
  }
];

export function HowItWorksSection({ className = '' }: HowItWorksSectionProps) {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

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
  }, []);

  return (
    <section
      id="how-it-works"
      className={`py-24 px-4 sm:px-6 lg:px-8 bg-muted/10 border-y border-border/40 ${className}`}
      aria-labelledby="how-it-works-heading"
      aria-describedby="how-it-works-description"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 id="how-it-works-heading" className="text-3xl sm:text-5xl font-bold mb-6">How It Works</h2>
          <p id="how-it-works-description" className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to professional results
          </p>
        </div>

        <ol className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto" role="list">
          {steps.map((item, index) => {
            const isVisible = visibleItems.has(index);
            const delay = index * 200;

            return (
              <li
                key={item.step}
                ref={el => {
                  itemRefs.current[index] = el;
                }}
                className={`
                  relative group transform transition-all duration-700 ease-out
                  ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                `}
                style={{
                  transitionDelay: `${delay}ms`,
                }}
                aria-labelledby={`step-${item.step}-title`}
                aria-describedby={`step-${item.step}-description`}
              >
                <div className="absolute inset-0 bg-primary/5 rounded-3xl transform group-hover:scale-105 transition-transform duration-300" aria-hidden="true" />
                <div className="relative p-8 text-center">
                  <div className="w-20 h-20 bg-background border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg group-hover:border-primary/50 transition-colors">
                    <span className="text-primary">
                      {item.icon}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <span
                      className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold"
                      aria-hidden="true"
                    >
                      {item.step}
                    </span>
                    <h3 id={`step-${item.step}-title`} className="text-2xl font-bold">{item.title}</h3>
                  </div>
                  <p id={`step-${item.step}-description`} className="text-muted-foreground leading-relaxed text-lg">{item.description}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}