export type Provider = 'anthropic' | 'openai' | 'google';

export interface ModelPricing {
  input: number;   // USD per 1M tokens
  output: number;  // USD per 1M tokens
}

export interface PricingConfig {
  anthropic: Record<string, ModelPricing>;
  openai: Record<string, ModelPricing>;
  google: Record<string, ModelPricing>;
}

export interface TokenUsage {
  input: number;
  output: number;
}

export interface CostResult {
  inputCost: number;
  outputCost: number;
  total: number;
  modelId: string;
  provider: Provider;
}

