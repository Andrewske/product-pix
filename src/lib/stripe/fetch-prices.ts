import { unstable_cache } from 'next/cache';
import { stripe } from './client';
import { env } from '@/lib/env';

// =============================================================================
// Types
// =============================================================================

export interface StripePriceData {
  pack_50: PriceInfo;
  pack_200: PriceInfo;
  pack_500: PriceInfo;
  pro_monthly: PriceInfo;
  business_monthly: PriceInfo;
}

export interface PriceInfo {
  unitAmount: number;
  currency: string;
  recurring?: {
    interval: string;
    intervalCount: number;
  };
}

// =============================================================================
// Price ID Mapping
// =============================================================================

// Note: PRICE_IDS is now defined inside fetchStripePricesCore to avoid
// module-level evaluation issues with unstable_cache

// =============================================================================
// Core Function
// =============================================================================

/**
 * Core function to fetch price data from Stripe API.
 * Handles API errors gracefully.
 */
export async function fetchStripePricesCore(): Promise<StripePriceData> {
  // Price ID Mapping - defined here to avoid module-level evaluation issues
  const PRICE_IDS = {
    pack_50: env.STRIPE_PRICE_PACK_50,
    pack_200: env.STRIPE_PRICE_PACK_200,
    pack_500: env.STRIPE_PRICE_PACK_500,
    pro_monthly: env.STRIPE_PRICE_PRO_MONTHLY,
    business_monthly: env.STRIPE_PRICE_BUSINESS_MONTHLY,
  } as const;

  try {
    // Fetch all prices in parallel
    const pricePromises = Object.entries(PRICE_IDS).map(async ([key, priceId]) => {
      const price = await stripe.prices.retrieve(priceId);
      return { key, price };
    });

    const results = await Promise.all(pricePromises);

    // Transform to typed response
    const priceData = results.reduce((acc, { key, price }) => {
      acc[key as keyof StripePriceData] = {
        unitAmount: price.unit_amount ?? 0,
        currency: price.currency,
        ...(price.recurring && {
          recurring: {
            interval: price.recurring.interval,
            intervalCount: price.recurring.interval_count,
          },
        }),
      };
      return acc;
    }, {} as StripePriceData);

    return priceData;
  } catch (error) {
    // Log error for monitoring but re-throw to let caller handle
    console.error('Failed to fetch Stripe prices:', error);
    throw new Error(`Stripe API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetches current price data from Stripe API with caching.
 * Uses unstable_cache with 1-hour TTL for performance.
 * Handles API errors gracefully by returning cached data or throwing.
 */
export const fetchStripePrices = unstable_cache(
  fetchStripePricesCore,
  ['stripe-prices'],
  {
    revalidate: 3600, // 1 hour in seconds
    tags: ['stripe-prices'],
  }
);