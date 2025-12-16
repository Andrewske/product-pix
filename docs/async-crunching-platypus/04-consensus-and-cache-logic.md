# Consensus Merging and Cache Management

## Files to Create
- `prompt-bench/core/consensus.ts` (new)
- `prompt-bench/core/analysis-cache.ts` (new)

## Implementation Details

### 1. Consensus Merging Logic
Merge multiple image analyses using majority vote and union strategies:

```typescript
// prompt-bench/core/consensus.ts
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
```

### 2. Analysis Cache Management
Cache layer for batch-level analysis results:

```typescript
// prompt-bench/core/analysis-cache.ts
import { createAdminClient } from '@/lib/supabase/admin';
import { ok, err, type Result } from '@bench/core/errors';
import type { MergedAnalysis, ProductAnalysis } from '@/types/analysis';
import { hashImageBatch } from './consensus';

export interface CachedAnalysis {
  batchHash: string;
  promptSlug: string;
  promptVersion: number;
  mergedResult: MergedAnalysis;
  individualResults: ProductAnalysis[];
  createdAt: Date;
}

/**
 * Get cached analysis for a batch of images
 */
export async function getAnalysisCache(
  batchHash: string
): Promise<Result<CachedAnalysis | null>> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('analysis_cache')
    .select('*')
    .eq('images_hash', batchHash)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found - cache miss
      return ok(null);
    }
    return err(createError('DATABASE_ERROR', `Failed to fetch cache: ${error.message}`));
  }

  return ok({
    batchHash: data.images_hash,
    promptSlug: data.prompt_slug,
    promptVersion: data.prompt_version,
    mergedResult: data.merged_result as MergedAnalysis,
    individualResults: data.individual_results as ProductAnalysis[],
    createdAt: new Date(data.created_at)
  });
}

/**
 * Store analysis results in cache
 */
export async function setAnalysisCache(
  batchHash: string,
  promptSlug: string,
  promptVersion: number,
  mergedResult: MergedAnalysis,
  individualResults: ProductAnalysis[]
): Promise<Result<void>> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('analysis_cache')
    .insert({
      images_hash: batchHash,
      prompt_slug: promptSlug,
      prompt_version: promptVersion,
      merged_result: mergedResult,
      individual_results: individualResults
    });

  if (error) {
    return err(createError('DATABASE_ERROR', `Failed to cache analysis: ${error.message}`));
  }

  return ok(undefined);
}

/**
 * Generate cache key from image buffers
 */
export function generateCacheKey(images: Array<{ buffer: Buffer }>): string {
  const imageHashes = images.map(img => {
    // Use crypto hash in production
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(img.buffer).digest('hex').slice(0, 16);
  });

  return hashImageBatch(imageHashes);
}
```

## Acceptance Criteria
- [ ] `mergeAnalysisResults` correctly implements majority vote for single values
- [ ] Features array uses union strategy (no duplicates)
- [ ] `hashImageBatch` produces consistent hash for same image set
- [ ] Hash changes if ANY image in batch changes
- [ ] Cache hit/miss logic works correctly
- [ ] Cache stores both merged and individual results for audit

## Unit Tests
Create `prompt-bench/__tests__/consensus.test.ts`:
- Test majority vote with 3, 5, 7 inputs
- Test tie-breaking (first occurrence wins)
- Test union array deduplication
- Test single-result edge case
- Test empty array error handling

Create `prompt-bench/__tests__/analysis-cache.test.ts`:
- Test cache key generation
- Test cache miss returns null
- Test cache hit returns stored data
- Test batch hash changes when image changes

## Dependencies
- Task 01 (migrations for cache table)
