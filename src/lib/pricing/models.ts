import type { Provider, ModelPricing, PricingConfig } from './types';
import { loadPricingConfig } from './config';

/**
 * Get the provider for a given model ID using smart matching rules.
 *
 * Matching rules (in order):
 * 1. Try exact match against config keys
 * 2. If no match, strip version suffix (e.g., "-20250514") and retry
 * 3. If still no match, return 'unknown' provider
 *
 * @param modelId - The model identifier to match
 * @param config - Pricing configuration (optional, will load if not provided)
 * @returns Provider enum value
 */
export function getProviderForModel(modelId: string, config?: PricingConfig): Provider {
  const pricingConfig = config || loadPricingConfig();

  // Rule 1: Exact match
  if (pricingConfig.anthropic[modelId]) return 'anthropic';
  if (pricingConfig.openai[modelId]) return 'openai';
  if (pricingConfig.google[modelId]) return 'google';

  // Rule 2: Strip version suffix and retry
  const versionSuffixPattern = /-\d{8}$|-\d+\.\d+$|-\d+$/;
  const baseModelId = modelId.replace(versionSuffixPattern, '');

  if (baseModelId !== modelId) {
    if (pricingConfig.anthropic[baseModelId]) return 'anthropic';
    if (pricingConfig.openai[baseModelId]) return 'openai';
    if (pricingConfig.google[baseModelId]) return 'google';
  }

  // Rule 3: No match found
  return 'unknown';
}

/**
 * Get pricing for a given model ID using smart matching rules.
 *
 * @param modelId - The model identifier to get pricing for
 * @param config - Pricing configuration (optional, will load if not provided)
 * @returns ModelPricing object (either from config or fallback)
 */
export function getPricingForModel(modelId: string, config?: PricingConfig): ModelPricing {
  const pricingConfig = config || loadPricingConfig();

  // Rule 1: Exact match
  if (pricingConfig.anthropic[modelId]) return pricingConfig.anthropic[modelId];
  if (pricingConfig.openai[modelId]) return pricingConfig.openai[modelId];
  if (pricingConfig.google[modelId]) return pricingConfig.google[modelId];

  // Rule 2: Strip version suffix and retry
  const versionSuffixPattern = /-\d{8}$|-\d+\.\d+$|-\d+$/;
  const baseModelId = modelId.replace(versionSuffixPattern, '');

  if (baseModelId !== modelId) {
    if (pricingConfig.anthropic[baseModelId]) return pricingConfig.anthropic[baseModelId];
    if (pricingConfig.openai[baseModelId]) return pricingConfig.openai[baseModelId];
    if (pricingConfig.google[baseModelId]) return pricingConfig.google[baseModelId];
  }

  // Rule 3: No match found, return fallback pricing
  return pricingConfig.fallback;
}