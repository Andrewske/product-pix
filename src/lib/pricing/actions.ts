'use server';

import { fetchStripePrices } from '@/lib/stripe/fetch-prices';
import { creditEconomy } from '@/lib/pricing/pricing.config';
import { mergePacks, mergeSubscriptions, type PricingData, type PricingPack, type PricingSubscription } from './utils';

// Re-export types for convenience
export type { PricingData, PricingPack, PricingSubscription };

// =============================================================================
// Server Action
// =============================================================================

/**
 * Server action to fetch complete pricing data for frontend consumption.
 * Merges live Stripe prices with credit economy configuration.
 *
 * @returns Complete pricing data including packs, subscriptions, and economy settings
 */
export async function getPricing(): Promise<PricingData> {
  try {
    const stripePrices = await fetchStripePrices();

    return {
      packs: mergePacks(stripePrices, creditEconomy),
      subscriptions: mergeSubscriptions(stripePrices, creditEconomy),
      economy: {
        creditsPerResolution: creditEconomy.creditsPerResolution,
        freeCreditsOnSignup: creditEconomy.freeCreditsOnSignup,
      },
    };
  } catch (error) {
    // Log error for monitoring but re-throw to let caller handle
    console.error('Failed to fetch pricing data:', error);
    throw new Error(`Pricing data fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}