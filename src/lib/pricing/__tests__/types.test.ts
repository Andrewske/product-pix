import { describe, it, expect } from '@jest/globals';
import type { Provider, ModelPricing, PricingConfig, TokenUsage, CostResult } from '../types';

describe('Pricing Types', () => {
  it('should export Provider type', () => {
    const provider: Provider = 'anthropic';
    expect(provider).toBe('anthropic');

    const providers: Provider[] = ['anthropic', 'openai', 'google'];
    expect(providers).toHaveLength(3);
  });

  it('should export ModelPricing interface', () => {
    const pricing: ModelPricing = {
      input: 3.0,
      output: 15.0,
    };
    expect(pricing.input).toBe(3.0);
    expect(pricing.output).toBe(15.0);
  });

  it('should export PricingConfig interface', () => {
    const config: PricingConfig = {
      anthropic: {
        'claude-sonnet-4': { input: 3.0, output: 15.0 },
      },
      openai: {
        'gpt-4o': { input: 2.5, output: 10.0 },
      },
      google: {
        'gemini-3-pro-image-preview': { input: 0.075, output: 0.3 },
      },
    };
    expect(config.anthropic['claude-sonnet-4'].input).toBe(3.0);
  });

  it('should export TokenUsage interface', () => {
    const usage: TokenUsage = {
      input: 1000000,
      output: 500000,
    };
    expect(usage.input).toBe(1000000);
    expect(usage.output).toBe(500000);
  });

  it('should export CostResult interface', () => {
    const result: CostResult = {
      inputCost: 3.00,
      outputCost: 7.50,
      total: 10.50,
      modelId: 'claude-sonnet-4-20250514',
      provider: 'anthropic',
    };
    expect(result.total).toBe(10.50);
    expect(result.provider).toBe('anthropic');
  });
});