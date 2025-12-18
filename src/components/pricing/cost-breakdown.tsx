import React from 'react';
import { cn } from '@/lib/utils';
import { calculateGenerationCost, getCreditsForGeneration } from '@/lib/pricing/credits';
import type { GenerationMode } from '@/lib/pricing/types';
import type { Resolution } from '@/lib/pricing/credits';

interface CostBreakdownProps {
  resolution: Resolution;
  mode: GenerationMode;
  addons?: Array<string>;
  className?: string;
  variant?: 'default' | 'compact';
}

export function CostBreakdown({
  resolution,
  mode,
  addons,
  className,
  variant = 'default'
}: CostBreakdownProps): React.ReactElement {
  const breakdown = calculateGenerationCost({
    resolution,
    mode,
    addons: addons as Array<keyof typeof import('@/lib/pricing/pricing.config').creditEconomy.addonCosts> | undefined
  });

  // Calculate discount for snail mode
  const isSnailMode = mode === 'snail';
  const lightningCost = getCreditsForGeneration(resolution, 'lightning');
  const snailCost = getCreditsForGeneration(resolution, 'snail');
  const discount = lightningCost - snailCost;
  const discountPercent = Math.round((discount / lightningCost) * 100);

  const resolutionLabel = {
    '1k': '1024px',
    '2k': '2048px',
    '4k': '4096px'
  }[resolution];

  const isCompact = variant === 'compact';

  return (
    <section className={cn('space-y-2', className)} aria-label="Cost breakdown">
      {!isCompact && (
        <h3 className="text-sm font-medium text-foreground">Cost Breakdown:</h3>
      )}

      <div className="space-y-1 text-sm">
        {/* Base generation cost */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">
            1 image ({resolutionLabel}):
          </span>
          <span className="font-mono">
            {breakdown.baseGeneration} credits
            {mode === 'lightning' && (
              <span className="text-xs text-muted-foreground ml-1">(lightning rate)</span>
            )}
          </span>
        </div>

        {/* Snail mode discount */}
        {isSnailMode && (
          <div className="flex justify-between items-center text-success">
            <span>Snail mode discount:</span>
            <span className="font-mono">
              -{discount} credits ({discountPercent}% off)
            </span>
          </div>
        )}

        {/* Addon costs */}
        {breakdown.addons.map((addon) => (
          <div key={addon.name} className="flex justify-between items-center">
            <span className="text-muted-foreground capitalize">
              {addon.name.replace(/([A-Z])/g, ' $1').toLowerCase()}:
            </span>
            <span className="font-mono">{addon.credits} credits</span>
          </div>
        ))}

        {/* Total */}
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="font-semibold">Total:</span>
          <span className="font-mono font-semibold text-lg">
            {breakdown.total} credits
          </span>
        </div>
      </div>
    </section>
  );
}