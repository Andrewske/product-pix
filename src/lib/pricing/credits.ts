/**
 * Credit calculation utilities for image generation based on resolution and mode.
 */

import { creditEconomy } from './pricing.config';
import type { GenerationMode, GenerationCostBreakdown } from './types';

export type Resolution = '1k' | '2k' | '4k';

// Derive addon names from config for type safety
type AddonName = keyof typeof creditEconomy.addonCosts;

export type GenerationParams = {
  resolution: Resolution;
  mode: GenerationMode;
  addons?: Array<AddonName>;
};

/**
 * Get credits required for a given resolution and mode.
 */
export function getCreditsForGeneration(resolution: Resolution, mode: GenerationMode): number {
  return creditEconomy.generationCosts[mode][resolution];
}

/**
 * Calculate generation cost breakdown including base generation and addons.
 */
export function calculateGenerationCost(params: GenerationParams): GenerationCostBreakdown {
  const baseGeneration = creditEconomy.generationCosts[params.mode][params.resolution];
  const addons = (params.addons || []).map(addon => ({
    name: addon,
    credits: creditEconomy.addonCosts[addon]
  }));
  const total = baseGeneration + addons.reduce((sum, a) => sum + a.credits, 0);

  return { baseGeneration, addons, total };
}