import type { TokenUsage, CostResult } from './types';
import { getProviderForModel, getPricingForModel } from './models';

/**
 * Calculate the cost for AI model usage.
 *
 * @param modelId - The model identifier used
 * @param usage - Token usage statistics
 * @returns Cost breakdown
 * @throws Error if token counts are negative
 */
export function calculateCost(modelId: string, usage: TokenUsage): CostResult {
  // Validate token counts
  if (usage.input < 0 || usage.output < 0) {
    throw new Error('Token counts cannot be negative');
  }

  // Handle zero usage (valid case)
  if (usage.input === 0 && usage.output === 0) {
    return {
      inputCost: 0,
      outputCost: 0,
      total: 0,
      modelId,
      provider: getProviderForModel(modelId),
      fallbackUsed: false,
    };
  }

  const provider = getProviderForModel(modelId);
  const pricing = getPricingForModel(modelId);
  const fallbackUsed = provider === 'unknown' ||
    !getPricingForModel(modelId, undefined); // Check if exact match exists

  // Calculate costs (pricing is per 1M tokens, so divide by 1,000,000)
  const inputCost = (usage.input / 1_000_000) * pricing.input;
  const outputCost = (usage.output / 1_000_000) * pricing.output;
  const total = inputCost + outputCost;

  return {
    inputCost,
    outputCost,
    total,
    modelId,
    provider,
    fallbackUsed,
  };
}