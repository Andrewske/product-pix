import { fetchStripePrices, type StripePriceData } from '@/lib/stripe/fetch-prices';
import { creditEconomy, type CreditEconomy } from '@/lib/pricing/pricing.config';

// =============================================================================
// Types
// =============================================================================

export interface PricingPack {
  credits: number;
  slug: string;
  priceCents: number;
  currency: string;
}

export interface PricingSubscription {
  creditsPerMonth: number;
  slug: string;
  priceCents: number;
  currency: string;
}

export interface PricingEconomy {
  creditsPerResolution: CreditEconomy['creditsPerResolution'];
  freeCreditsOnSignup: number;
}

export interface PricingData {
  packs: Record<string, PricingPack>;
  subscriptions: Record<string, PricingSubscription>;
  economy: PricingEconomy;
}

// =============================================================================
// Merge Functions
// =============================================================================

/**
 * Merges credit economy pack configuration with Stripe price data.
 * Combines credit amounts from config with live prices from Stripe.
 */
export function mergePacks(
  stripePrices: StripePriceData,
  creditEconomy: CreditEconomy
): Record<string, PricingPack> {
  const packs: Record<string, PricingPack> = {};

  // Map credit economy packs to merged data
  Object.entries(creditEconomy.packs).forEach(([key, packConfig]) => {
    const stripeKey = key as keyof Pick<StripePriceData, 'pack_50' | 'pack_200' | 'pack_500'>;
    const stripePrice = stripePrices[stripeKey];

    if (!stripePrice) {
      throw new Error(`Missing Stripe price for pack: ${key}`);
    }

    packs[key] = {
      credits: packConfig.credits,
      slug: packConfig.slug,
      priceCents: stripePrice.unitAmount,
      currency: stripePrice.currency,
    };
  });

  return packs;
}

/**
 * Merges credit economy subscription configuration with Stripe price data.
 * Combines credit amounts from config with live prices from Stripe.
 */
export function mergeSubscriptions(
  stripePrices: StripePriceData,
  creditEconomy: CreditEconomy
): Record<string, PricingSubscription> {
  const subscriptions: Record<string, PricingSubscription> = {};

  // Map credit economy subscriptions to merged data
  Object.entries(creditEconomy.subscriptions).forEach(([key, subConfig]) => {
    const stripeKey = `${key}_monthly` as keyof Pick<StripePriceData, 'pro_monthly' | 'business_monthly'>;
    const stripePrice = stripePrices[stripeKey];

    if (!stripePrice) {
      throw new Error(`Missing Stripe price for subscription: ${key}`);
    }

    subscriptions[key] = {
      creditsPerMonth: subConfig.creditsPerMonth,
      slug: subConfig.slug,
      priceCents: stripePrice.unitAmount,
      currency: stripePrice.currency,
    };
  });

  return subscriptions;
}