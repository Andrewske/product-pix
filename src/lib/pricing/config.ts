import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parse } from '@iarna/toml';
import type { PricingConfig } from './types';

// Module-scoped cache for pricing config
let pricingConfigCache: PricingConfig | null = null;

/**
 * Load pricing configuration from TOML file with fail-fast error handling.
 * Config is cached per process to avoid repeated file I/O.
 *
 * @throws Error if config file is missing, invalid TOML, or missing pricing sections
 * @returns PricingConfig with computed fallback pricing
 */
export function loadPricingConfig(): PricingConfig {
  // Skip caching during tests to avoid interference
  if (pricingConfigCache && process.env.NODE_ENV !== 'test') {
    return pricingConfigCache;
  }

  const configPath = resolve(process.cwd(), 'prompt-bench.toml');

  let fileContent: string;
  try {
    fileContent = readFileSync(configPath, 'utf-8');
  } catch (error) {
    throw new Error(`Pricing config file not found at: ${configPath}. Please ensure prompt-bench.toml exists in the project root.`);
  }

  let parsedToml: any;
  try {
    parsedToml = parse(fileContent);
  } catch (error) {
    const parseError = error as Error;
    throw new Error(`Invalid TOML syntax in pricing config at ${configPath}: ${parseError.message}`);
  }

  if (!parsedToml.pricing) {
    throw new Error(`Missing [pricing] section in config file at ${configPath}. Please add pricing configuration.`);
  }

  const pricing = parsedToml.pricing;

  // Validate required provider sections
  const requiredProviders = ['anthropic', 'openai', 'google'];
  for (const provider of requiredProviders) {
    if (!pricing[provider]) {
      throw new Error(`Missing [pricing.${provider}] section in config file at ${configPath}`);
    }
  }

  // Compute dynamic fallback pricing
  const allPrices: Array<{ input: number; output: number; modelId: string }> = [];

  for (const provider of requiredProviders) {
    for (const [modelId, modelPricing] of Object.entries(pricing[provider] as Record<string, any>)) {
      if (typeof modelPricing.input !== 'number' || typeof modelPricing.output !== 'number') {
        throw new Error(`Invalid pricing for ${provider}.${modelId}: input and output must be numbers`);
      }
      allPrices.push({
        input: modelPricing.input,
        output: modelPricing.output,
        modelId: `${provider}.${modelId}`,
      });
    }
  }

  if (allPrices.length === 0) {
    throw new Error('No pricing data found in config. At least one model must be configured per provider.');
  }

  const maxInput = Math.max(...allPrices.map(p => p.input));
  const maxOutput = Math.max(...allPrices.map(p => p.output));
  const fallbackSource = allPrices.find(p => p.input === maxInput && p.output === maxOutput)?.modelId || 'unknown';

  const config: PricingConfig = {
    anthropic: pricing.anthropic,
    openai: pricing.openai,
    google: pricing.google,
    fallback: {
      input: maxInput * 1.5,
      output: maxOutput * 1.5,
    },
    fallbackSource,
  };

  // Log computed fallback values for transparency
  console.log(`💰 Pricing config loaded. Fallback pricing: input=$${config.fallback.input.toFixed(3)}/1M, output=$${config.fallback.output.toFixed(3)}/1M (from ${fallbackSource})`);

  pricingConfigCache = config;
  return config;
}

/**
 * Clear the pricing config cache. Useful for testing or when config file changes.
 */
export function clearPricingCache(): void {
  pricingConfigCache = null;
}