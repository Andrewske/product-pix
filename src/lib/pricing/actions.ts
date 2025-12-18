'use server';

import { fetchStripePrices } from '@/lib/stripe/fetch-prices';
import { creditEconomy } from '@/lib/pricing/pricing.config';
import { mergePacks, mergeSubscriptions, type PricingData, type PricingPack, type PricingSubscription } from './utils';
import { createPaymentError } from '@/lib/errors/error-classes';
import { captureError } from '@/lib/observability/capture-error';
import { ErrorCodes } from '@/lib/errors/codes';

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
        generationCosts: creditEconomy.generationCosts,
        addonCosts: creditEconomy.addonCosts,
        freeCreditsOnSignup: creditEconomy.freeCreditsOnSignup,
      },
    };
   } catch (error) {
    // Log error for monitoring but re-throw to let caller handle
    const pricingError = createPaymentError(
      ErrorCodes.PAYMENT_INTENT_FAILED,
      'Failed to fetch pricing data from Stripe',
      {
        severity: 'high',
        amount: 0,
        originalError: error instanceof Error ? error.message : String(error),
      }
    );
    await captureError(pricingError);
    throw new Error(`Pricing data fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
   }
}