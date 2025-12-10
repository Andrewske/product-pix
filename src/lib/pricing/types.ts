export type Provider = 'anthropic' | 'openai' | 'google' | 'unknown';

export interface ModelPricing {
  input: number;   // USD per 1M tokens
  output: number;  // USD per 1M tokens
}

export interface PricingConfig {
  anthropic: Record<string, ModelPricing>;
  openai: Record<string, ModelPricing>;
  google: Record<string, ModelPricing>;
  fallback: ModelPricing;          // Computed from max prices
  fallbackSource: string;          // Which model had max price
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
  provider: Provider;              // Can be 'unknown'
  fallbackUsed: boolean;
}

// Hybrid pricing types for credit-based billing
export interface CreditPack {
  id: string;
  credits: number;
  price: number;        // USD
  displayName: string;
  description?: string;
  popular?: boolean;    // For UI highlighting
}

export interface SubscriptionTier {
  id: string;
  credits: number;      // Monthly credits
  price: number;        // USD per month
  displayName: string;
  description?: string;
  stripePriceId?: string;
  popular?: boolean;    // For UI highlighting
}

export interface CreditEconomy {
  creditsPerResolution: Record<'1k' | '2k' | '4k', number>;
  creditToUsdRatio: number;  // How many credits per USD
  usdToCreditRatio: number;  // How many USD per credit
  minimumPurchase: number;   // Minimum USD for credit packs
  freeCredits: number;       // Credits given to new users
}

export interface PricingData {
  creditPacks: CreditPack[];
  subscriptionTiers: SubscriptionTier[];
  creditEconomy: CreditEconomy;
  currentCredits?: number;     // User's current credit balance
  activeSubscription?: SubscriptionTier;
}