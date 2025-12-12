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
            'px-4 py-2 text-sm font-medium rounded-lg border transition-colors',
            value === ratio
              ? 'bg-primary/10 border-primary text-primary'
              : 'border-border hover:border-primary/50 text-foreground'
          )}
        >
          {ratio}
        </button>
      ))}
    </div>
  );
}

export type { AspectRatio, AspectRatioSelectorProps };