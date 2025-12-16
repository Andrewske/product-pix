import { createAdminClient } from '@/lib/supabase/admin';
import { ok, err, type Result, createError } from '@bench/core/errors';
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
