import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parse } from '@iarna/toml';
import type { PricingConfig } from './types';

// Parsed TOML structure
interface ParsedToml {
  pricing?: {
    anthropic?: Record<string, { input: number; output: number }>;
    openai?: Record<string, { input: number; output: number }>;
    google?: Record<string, { input: number; output: number }>;
  };
}

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
  } catch {
    throw new Error(`Pricing config file not found at: ${configPath}. Please ensure prompt-bench.toml exists in the project root.`);
  }

  let parsedToml: ParsedToml;
  try {
    parsedToml = parse(fileContent) as ParsedToml;
  } catch (error) {
    const parseError = error as Error;
    throw new Error(`Invalid TOML syntax in pricing config at ${configPath}: ${parseError.message}`);
  }

  if (!parsedToml.pricing) {
    throw new Error(`Missing [pricing] section in config file at ${configPath}. Please add pricing configuration.`);
  }

  const pricing = parsedToml.pricing;

  // Validate required provider sections
  const requiredProviders: Array<'anthropic' | 'openai' | 'google'> = ['anthropic', 'openai', 'google'];
  for (const provider of requiredProviders) {
    if (!pricing[provider]) {
      throw new Error(`Missing [pricing.${provider}] section in config file at ${configPath}`);
    }
  }

  // Validate all pricing data
  for (const provider of requiredProviders) {
    const providerPricing = pricing[provider];
    if (!providerPricing) continue;

    for (const [modelId, modelPricing] of Object.entries(providerPricing)) {
      if (typeof modelPricing.input !== 'number' || typeof modelPricing.output !== 'number') {
        throw new Error(`Invalid pricing for ${provider}.${modelId}: input and output must be numbers`);
      }
    }
  }

  const config: PricingConfig = {
    anthropic: pricing.anthropic || {},
    openai: pricing.openai || {},
    google: pricing.google || {},
  };

  console.info(`💰 Pricing config loaded with ${Object.keys(config.anthropic).length + Object.keys(config.openai).length + Object.keys(config.google).length} models`);

  pricingConfigCache = config;
  return config;
}

/**
 * Clear the pricing config cache. Useful for testing or when config file changes.
 */
export function clearPricingCache(): void {
  pricingConfigCache = null;
}