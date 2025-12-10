// Mock the stripe client
jest.mock('../client', () => ({
  stripe: {
    prices: {
      retrieve: jest.fn(),
    },
  },
}));

// Mock unstable_cache
jest.mock('next/cache', () => ({
  unstable_cache: jest.fn((fn) => fn),
}));

// Mock the incremental cache for Next.js
(globalThis as any).__incrementalCache = {
  get: jest.fn(),
  set: jest.fn(),
  revalidateTag: jest.fn(),
});

describe('fetchStripePrices', () => {
  let fetchStripePrices: any;
  let fetchStripePricesCore: any;
  let mockStripeRetrieve: jest.MockedFunction<any>;

  beforeAll(() => {
    // Set up all required env vars
    process.env.STRIPE_PRICE_PACK_50 = 'price_pack_50_test';
    process.env.STRIPE_PRICE_PACK_200 = 'price_pack_200_test';
    process.env.STRIPE_PRICE_PACK_500 = 'price_pack_500_test';
    process.env.STRIPE_PRICE_PRO_MONTHLY = 'price_pro_monthly_test';
    process.env.STRIPE_PRICE_BUSINESS_MONTHLY = 'price_business_monthly_test';
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'dummy';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://dummy';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'dummy';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'dummy';
    process.env.R2_ACCOUNT_ID = 'dummy';
    process.env.R2_ACCESS_KEY_ID = 'dummy';
    process.env.R2_SECRET_ACCESS_KEY = 'dummy';
    process.env.R2_BUCKET_NAME = 'dummy';
    process.env.R2_PUBLIC_URL = 'http://dummy';
    process.env.NEXT_PUBLIC_APP_URL = 'http://dummy';
    process.env.STRIPE_WEBHOOK_SECRET = 'dummy';

    // Import the functions after env is set
    jest.isolateModules(() => {
      const module = require('../fetch-prices');
      fetchStripePrices = module.fetchStripePrices;
      fetchStripePricesCore = module.fetchStripePricesCore;
    });

    // Get the mocked stripe client
    const { stripe } = require('../client');
    mockStripeRetrieve = stripe.prices.retrieve as jest.MockedFunction<any>;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and return correctly formatted price data', async () => {
    // Mock successful price retrievals
    mockStripeRetrieve.mockImplementation((priceId: string) => {
      const mockPrices: Record<string, any> = {
        'price_pack_50_test': {
          unit_amount: 1000,
          currency: 'usd',
        },
        'price_pack_200_test': {
          unit_amount: 3000,
          currency: 'usd',
        },
        'price_pack_500_test': {
          unit_amount: 6000,
          currency: 'usd',
        },
        'price_pro_monthly_test': {
          unit_amount: 2000,
          currency: 'usd',
          recurring: {
            interval: 'month',
            interval_count: 1,
          },
        },
        'price_business_monthly_test': {
          unit_amount: 5000,
          currency: 'usd',
          recurring: {
            interval: 'month',
            interval_count: 1,
          },
        },
      };
      const price = mockPrices[priceId];
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
    mockStripeRetrieve.mockRejectedValue(stripeError);

    await expect(fetchStripePricesCore()).rejects.toThrow('Stripe API error: Stripe API connection failed');
  });

  it('should handle non-Error exceptions', async () => {
    // Mock non-Error exception
    mockStripeRetrieve.mockRejectedValue('String error');

    await expect(fetchStripePricesCore()).rejects.toThrow('Stripe API error: Unknown error');
  });

  it('should handle prices with null unit_amount', async () => {
    // Mock price with null unit_amount (only properties used in code)
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