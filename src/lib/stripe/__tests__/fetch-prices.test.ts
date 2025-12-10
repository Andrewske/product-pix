import { describe, it, expect, beforeAll, mock } from 'bun:test';
import { env } from '@/lib/env';

const mockStripeRetrieve = mock(() => {});

mock.module('../client', () => ({
  stripe: {
    prices: {
      retrieve: mockStripeRetrieve,
    },
  },
}));

mock.module('next/cache', () => ({
  unstable_cache: mock((fn: any) => fn),
}));

(globalThis as any).__incrementalCache = {
  get: mock(() => {}),
  set: mock(() => {}),
  revalidateTag: mock(() => {}),
};

const priceIds = {
  pack_50: env.STRIPE_PRICE_PACK_50,
  pack_200: env.STRIPE_PRICE_PACK_200,
  pack_500: env.STRIPE_PRICE_PACK_500,
  pro_monthly: env.STRIPE_PRICE_PRO_MONTHLY,
  business_monthly: env.STRIPE_PRICE_BUSINESS_MONTHLY,
} as const;

type FetchPricesModule = typeof import('../fetch-prices');

describe('fetchStripePrices', () => {
  let fetchStripePrices: FetchPricesModule['fetchStripePrices'];
  let fetchStripePricesCore: FetchPricesModule['fetchStripePricesCore'];

  beforeAll(async () => {
    const module: FetchPricesModule = await import('../fetch-prices');
    fetchStripePrices = module.fetchStripePrices;
    fetchStripePricesCore = module.fetchStripePricesCore;
  });

  it('should fetch and return all Stripe prices correctly', async () => {
    const mockPrices: Record<string, any> = {
      [priceIds.pack_50]: { unit_amount: 1000, currency: 'usd' },
      [priceIds.pack_200]: { unit_amount: 3000, currency: 'usd' },
      [priceIds.pack_500]: { unit_amount: 6000, currency: 'usd' },
      [priceIds.pro_monthly]: {
        unit_amount: 2000,
        currency: 'usd',
        recurring: { interval: 'month', interval_count: 1 },
      },
      [priceIds.business_monthly]: {
        unit_amount: 5000,
        currency: 'usd',
        recurring: { interval: 'month', interval_count: 1 },
      },
    };

    mockStripeRetrieve.mockReset();
    mockStripeRetrieve.mockImplementation((priceId: string) => {
      const price = mockPrices[priceId];
      if (!price) {
        throw new Error(`Unexpected priceId: ${priceId}`);
      }
      return Promise.resolve(price);
    });

    const result = await fetchStripePricesCore();

    expect(result).toEqual({
      pack_50: { unitAmount: 1000, currency: 'usd' },
      pack_200: { unitAmount: 3000, currency: 'usd' },
      pack_500: { unitAmount: 6000, currency: 'usd' },
      pro_monthly: {
        unitAmount: 2000,
        currency: 'usd',
        recurring: { interval: 'month', intervalCount: 1 },
      },
      business_monthly: {
        unitAmount: 5000,
        currency: 'usd',
        recurring: { interval: 'month', intervalCount: 1 },
      },
    });

    expect(mockStripeRetrieve).toHaveBeenCalledTimes(5);
    expect(mockStripeRetrieve).toHaveBeenCalledWith(priceIds.pack_50);
    expect(mockStripeRetrieve).toHaveBeenCalledWith(priceIds.pack_200);
    expect(mockStripeRetrieve).toHaveBeenCalledWith(priceIds.pack_500);
    expect(mockStripeRetrieve).toHaveBeenCalledWith(priceIds.pro_monthly);
    expect(mockStripeRetrieve).toHaveBeenCalledWith(priceIds.business_monthly);
  });

  it('should handle Stripe API errors gracefully', async () => {
    const stripeError = new Error('Stripe API connection failed');
    mockStripeRetrieve.mockReset();
    mockStripeRetrieve.mockRejectedValue(stripeError);

    await expect(fetchStripePricesCore()).rejects.toThrow('Stripe API error: Stripe API connection failed');
  });

  it('should handle non-Error exceptions', async () => {
    mockStripeRetrieve.mockReset();
    mockStripeRetrieve.mockRejectedValue('String error');

    await expect(fetchStripePricesCore()).rejects.toThrow('Stripe API error: Unknown error');
  });

  it('should handle prices with null unit_amount', async () => {
    mockStripeRetrieve.mockReset();
    mockStripeRetrieve.mockResolvedValue({
      unit_amount: null,
      currency: 'usd',
    } as any);

    const result = await fetchStripePricesCore();

    expect(result.pack_50.unitAmount).toBe(0);
  });

  it('should export both cached and core functions', () => {
    expect(typeof fetchStripePrices).toBe('function');
    expect(typeof fetchStripePricesCore).toBe('function');
  });
});
