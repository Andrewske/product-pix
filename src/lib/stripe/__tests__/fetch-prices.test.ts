import { describe, it, expect, beforeAll, mock } from 'bun:test';

// Create mock functions
const mockStripeRetrieve = mock(() => {});

// Mock the stripe client
mock.module('../client', () => ({
  stripe: {
    prices: {
      retrieve: mockStripeRetrieve,
    },
  },
}));

// Mock unstable_cache
mock.module('next/cache', () => ({
  unstable_cache: mock((fn: any) => fn),
}));

// Mock the incremental cache for Next.js
(globalThis as any).__incrementalCache = {
  get: mock(() => {}),
  set: mock(() => {}),
  revalidateTag: mock(() => {}),
};

describe('fetchStripePrices', () => {
  let fetchStripePrices: any;
  let fetchStripePricesCore: any;

  beforeAll(async () => {
    // Set up all required env vars
    process.env.STRIPE_PRICE_PACK_50 = 'price_pack_50_test';
    process.env.STRIPE_PRICE_PACK_200 = 'price_pack_200_test';
    process.env.STRIPE_PRICE_PACK_500 = 'price_pack_500_test';
    process.env.STRIPE_PRICE_PRO_MONTHLY = 'price_pro_monthly_test';
    process.env.STRIPE_PRICE_BUSINESS_MONTHLY = 'price_business_monthly_test';

    // Import after env vars are set
    const module = await import('../fetch-prices');
    fetchStripePrices = module.fetchStripePrices;
    fetchStripePricesCore = module.fetchStripePricesCore;
  });

  it('should fetch and return all Stripe prices correctly', async () => {
    const mockPrices = {
      price_pack_50_test: { unit_amount: 1000, currency: 'usd' },
      price_pack_200_test: { unit_amount: 3000, currency: 'usd' },
      price_pack_500_test: { unit_amount: 6000, currency: 'usd' },
      price_pro_monthly_test: { unit_amount: 2000, currency: 'usd', recurring: { interval: 'month', interval_count: 1 } },
      price_business_monthly_test: { unit_amount: 5000, currency: 'usd', recurring: { interval: 'month', interval_count: 1 } },
    };

    mockStripeRetrieve.mockReset();
    mockStripeRetrieve.mockImplementation((priceId: string) => {
      const price = mockPrices[priceId as keyof typeof mockPrices];
      if (!price) {
        throw new Error(`Unexpected priceId: ${priceId}`);
      }
      return Promise.resolve(price);
    });

    const result = await fetchStripePricesCore();

    expect(result).toEqual({
      pack_50: {
        unitAmount: 1000,
        currency: 'usd',
      },
      pack_200: {
        unitAmount: 3000,
        currency: 'usd',
      },
      pack_500: {
        unitAmount: 6000,
        currency: 'usd',
      },
      pro_monthly: {
        unitAmount: 2000,
        currency: 'usd',
        recurring: {
          interval: 'month',
          intervalCount: 1,
        },
      },
      business_monthly: {
        unitAmount: 5000,
        currency: 'usd',
        recurring: {
          interval: 'month',
          intervalCount: 1,
        },
      },
    });

    // Verify all price IDs were fetched
    expect(mockStripeRetrieve).toHaveBeenCalledTimes(5);
    expect(mockStripeRetrieve).toHaveBeenCalledWith('price_pack_50_test');
    expect(mockStripeRetrieve).toHaveBeenCalledWith('price_pack_200_test');
    expect(mockStripeRetrieve).toHaveBeenCalledWith('price_pack_500_test');
    expect(mockStripeRetrieve).toHaveBeenCalledWith('price_pro_monthly_test');
    expect(mockStripeRetrieve).toHaveBeenCalledWith('price_business_monthly_test');
  });

  it('should handle Stripe API errors gracefully', async () => {
    // Mock Stripe API error
    const stripeError = new Error('Stripe API connection failed');
    mockStripeRetrieve.mockReset();
    mockStripeRetrieve.mockRejectedValue(stripeError);

    await expect(fetchStripePricesCore()).rejects.toThrow('Stripe API error: Stripe API connection failed');
  });

  it('should handle non-Error exceptions', async () => {
    // Mock non-Error exception
    mockStripeRetrieve.mockReset();
    mockStripeRetrieve.mockRejectedValue('String error');

    await expect(fetchStripePricesCore()).rejects.toThrow('Stripe API error: Unknown error');
  });

  it('should handle prices with null unit_amount', async () => {
    // Mock price with null unit_amount (only properties used in code)
    mockStripeRetrieve.mockReset();
    mockStripeRetrieve.mockResolvedValue({
      unit_amount: null,
      currency: 'usd',
    } as any);

    const result = await fetchStripePricesCore();

    // Should default to 0 for null unit_amount
    expect(result.pack_50.unitAmount).toBe(0);
  });

  it('should export both cached and core functions', () => {
    // Test that both functions are exported
    expect(typeof fetchStripePrices).toBe('function');
    expect(typeof fetchStripePricesCore).toBe('function');
  });
});
