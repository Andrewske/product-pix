/**
 * Cost calculation wrapper for prompt-bench
 *
 * Wraps the src/lib/pricing/calculator to return Result type
 * consistent with prompt-bench error handling patterns.
 */
import { calculateCost as calculateCostRaw, type CostResult, type TokenUsage } from '@/lib/pricing';
import { ok, err, createError, type Result } from './errors';

/**
 * Calculate cost with Result type wrapper
 *
 * @param modelId - The model identifier used
 * @param usage - Token usage statistics
 * @returns Result containing cost breakdown or error
 */
export function calculateCost(modelId: string, usage: TokenUsage): Result<CostResult> {
  try {
    return ok(calculateCostRaw(modelId, usage));
  } catch (error) {
    return err(createError(
      'VALIDATION_ERROR',
      error instanceof Error ? error.message : 'Cost calculation failed',
      { retryable: false }
    ));
  }
}
