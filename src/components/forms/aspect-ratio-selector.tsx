// src/components/forms/aspect-ratio-selector.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type AspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '3:2';

interface AspectRatioSelectorProps {
  value: AspectRatio;
  onChange: (ratio: AspectRatio) => void;
  disabled?: boolean;
}

const ASPECT_RATIOS: AspectRatio[] = ['1:1', '4:3', '3:4', '16:9', '9:16', '3:2'];

export function AspectRatioSelector({ value, onChange, disabled }: AspectRatioSelectorProps): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-2">
      {ASPECT_RATIOS.map((ratio) => (
        <button
          key={ratio}
          type="button"
          disabled={disabled}
          onClick={() => value !== ratio && onChange(ratio)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200',
              'focus:outline-none',
              value === ratio
                ? 'bg-green-600 text-black border-green-600 focus:ring-0'
                : 'border-border hover:border-primary/50 text-foreground hover:bg-primary/5 focus:ring-2 focus:ring-primary/20 focus:ring-offset-2',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
        >
          {ratio}
        </button>
      ))}
    </div>
  );
}

export type { AspectRatio, AspectRatioSelectorProps };