/**
 * Credit calculation utilities for image generation based on resolution.
 */

export type Resolution = '1k' | '2k' | '4k';

const CREDITS_PER_RESOLUTION: Record<Resolution, number> = {
  '1k': 1,
  '2k': 2,
  '4k': 3,
} as const;

/**
 * Get credits required for a given resolution.
 */
export function getCreditsForResolution(resolution: Resolution): number {
  return CREDITS_PER_RESOLUTION[resolution];
}

/**
 * Calculate total credits for a batch of items.
 */
export function calculateBatchCredits(items: ReadonlyArray<{ readonly resolution: Resolution }>): number {
  return items.reduce((total, item) => total + getCreditsForResolution(item.resolution), 0);
}