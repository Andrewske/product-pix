/**
 * Credit calculation utilities for image generation based on resolution.
 */

import { creditEconomy } from './pricing.config';

export type Resolution = '1k' | '2k' | '4k';

/**
 * Get credits required for a given resolution.
 */
export function getCreditsForResolution(resolution: Resolution): number {
  return creditEconomy.creditsPerResolution[resolution];
}

/**
 * Calculate total credits for a batch of items.
 */
export function calculateBatchCredits(items: ReadonlyArray<{ readonly resolution: Resolution }>): number {
  return items.reduce((total, item) => total + getCreditsForResolution(item.resolution), 0);
}