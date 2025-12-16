import type { ProductAnalysis, MergedAnalysis } from '@/types/analysis';

/**
 * Merge multiple product analyses using consensus strategies:
 * - Single values (product, color, material, shape): majority vote
 * - Arrays (features): union of all values
 */
export function mergeAnalysisResults(results: ProductAnalysis[]): MergedAnalysis {
  if (results.length === 0) {
    throw new Error('Cannot merge empty analysis results');
  }

  if (results.length === 1) {
    return results[0];
  }

  return {
    product: majorityVote(results.map(r => r.product)),
    color: majorityVote(results.map(r => r.color)),
    material: majorityVote(results.map(r => r.material)),
    shape: majorityVote(results.map(r => r.shape)),
    features: unionArray(results.flatMap(r => r.features))
  };
}

/**
 * Select the most common value from an array
 * Ties broken by first occurrence
 */
function majorityVote(values: string[]): string {
  const counts = new Map<string, number>();

  for (const val of values) {
    counts.set(val, (counts.get(val) || 0) + 1);
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
}

/**
 * Get unique values from array, preserving order
 */
function unionArray(values: string[]): string[] {
  return [...new Set(values)];
}

/**
 * Generate a hash for a batch of images
 * Used as cache key - changes if ANY image in the batch changes
 */
export function hashImageBatch(imageHashes: string[]): string {
  // Sort hashes for deterministic ordering
  const sorted = [...imageHashes].sort();
  const combined = sorted.join('::');

  // Simple hash function (replace with crypto.createHash in production)
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return `batch_${Math.abs(hash).toString(16)}`;
}
