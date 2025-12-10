import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { getPricing } from '../actions';
import { mergePacks, mergeSubscriptions, type PricingData } from '../utils';
import { creditEconomy } from '../pricing.config';
import { fetchStripePrices, type StripePriceData } from '@/lib/stripe/fetch-prices';

// Mock the Stripe fetch function
jest.mock('@/lib/stripe/fetch-prices', () => ({
  fetchStripePrices: jest.fn(),
}));

const mockFetchStripePrices = fetchStripePrices as jest.MockedFunction<typeof fetchStripePrices>;

describe('Pricing Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('mergePacks', () => {
    it('should merge credit economy packs with Stripe prices correctly', () => {
      const mockStripePrices: StripePriceData = {
        pack_50: { unitAmount: 1000, currency: 'usd' },
        pack_200: { unitAmount: 3000, currency: 'usd' },
        pack_500: { unitAmount: 6000, currency: 'usd' },
        pro_monthly: { unitAmount: 2000, currency: 'usd', recurring: { interval: 'month', intervalCount: 1 } },
        business_monthly: { unitAmount: 5000, currency: 'usd', recurring: { interval: 'month', intervalCount: 1 } },
      };

      const result = mergePacks(mockStripePrices, creditEconomy);

      expect(result).toEqual({
        pack_50: {
          credits: 50,
          slug: 'pack_50',
          priceCents: 1000,
          currency: 'usd',
        },
        pack_200: {
          credits: 200,
          slug: 'pack_200',
          priceCents: 3000,
          currency: 'usd',
        },
        pack_500: {
          credits: 500,
          slug: 'pack_500',
          priceCents: 6000,
          currency: 'usd',
        },
      });
    });

    it('should throw error for missing Stripe price', () => {
      const mockStripePrices: Partial<StripePriceData> = {
        pack_50: { unitAmount: 1000, currency: 'usd' },
        // Missing pack_200 and pack_500
        pro_monthly: { unitAmount: 2000, currency: 'usd', recurring: { interval: 'month', intervalCount: 1 } },
        business_monthly: { unitAmount: 5000, currency: 'usd', recurring: { interval: 'month', intervalCount: 1 } },
      };

      expect(() => mergePacks(mockStripePrices as StripePriceData, creditEconomy)).toThrow(
        'Missing Stripe price for pack: pack_200'
      );
    });
  });

  describe('mergeSubscriptions', () => {
    it('should merge credit economy subscriptions with Stripe prices correctly', () => {
      const mockStripePrices: StripePriceData = {
        pack_50: { unitAmount: 1000, currency: 'usd' },
        pack_200: { unitAmount: 3000, currency: 'usd' },
        pack_500: { unitAmount: 6000, currency: 'usd' },
        pro_monthly: { unitAmount: 2000, currency: 'usd', recurring: { interval: 'month', intervalCount: 1 } },
        business_monthly: { unitAmount: 5000, currency: 'usd', recurring: { interval: 'month', intervalCount: 1 } },
      };

      const result = mergeSubscriptions(mockStripePrices, creditEconomy);

      expect(result).toEqual({
        pro: {
          creditsPerMonth: 200,
          slug: 'pro',
          priceCents: 2000,
          currency: 'usd',
        },
        business: {
          creditsPerMonth: 600,
          slug: 'business',
          priceCents: 5000,
          currency: 'usd',
        },
      });
    });

    it('should throw error for missing Stripe price', () => {
      const mockStripePrices: Partial<StripePriceData> = {
        pack_50: { unitAmount: 1000, currency: 'usd' },
        pack_200: { unitAmount: 3000, currency: 'usd' },
        pack_500: { unitAmount: 6000, currency: 'usd' },
        // Missing pro_monthly
        business_monthly: { unitAmount: 5000, currency: 'usd', recurring: { interval: 'month', intervalCount: 1 } },
      };

      expect(() => mergeSubscriptions(mockStripePrices as StripePriceData, creditEconomy)).toThrow(
        'Missing Stripe price for subscription: pro'
      );
    });
  });

  describe('getPricing', () => {
    it('should return complete pricing data successfully', async () => {
      const mockStripePrices: StripePriceData = {
        pack_50: { unitAmount: 1000, currency: 'usd' },
        pack_200: { unitAmount: 3000, currency: 'usd' },
        pack_500: { unitAmount: 6000, currency: 'usd' },
        pro_monthly: { unitAmount: 2000, currency: 'usd', recurring: { interval: 'month', intervalCount: 1 } },
        business_monthly: { unitAmount: 5000, currency: 'usd', recurring: { interval: 'month', intervalCount: 1 } },
      };

      mockFetchStripePrices.mockResolvedValue(mockStripePrices);

      const result = await getPricing();

      const expected: PricingData = {
        packs: {
          pack_50: {
            credits: 50,
            slug: 'pack_50',
            priceCents: 1000,
            currency: 'usd',
          },
          pack_200: {
            credits: 200,
            slug: 'pack_200',
            priceCents: 3000,
            currency: 'usd',
          },
          pack_500: {
            credits: 500,
            slug: 'pack_500',
            priceCents: 6000,
            currency: 'usd',
          },
        },
        subscriptions: {
          pro: {
            creditsPerMonth: 200,
            slug: 'pro',
            priceCents: 2000,
            currency: 'usd',
          },
          business: {
            creditsPerMonth: 600,
            slug: 'business',
            priceCents: 5000,
            currency: 'usd',
          },
        },
        economy: {
          creditsPerResolution: { '1k': 1, '2k': 2, '4k': 3 },
          freeCreditsOnSignup: 5,
        },
      };

      expect(result).toEqual(expected);
      expect(mockFetchStripePrices).toHaveBeenCalledTimes(1);
    });

    it('should throw error when Stripe fetch fails', async () => {
      const error = new Error('Stripe API error');
      mockFetchStripePrices.mockRejectedValue(error);

      await expect(getPricing()).rejects.toThrow('Pricing data fetch failed: Stripe API error');
      expect(mockFetchStripePrices).toHaveBeenCalledTimes(1);
    });

    it('should throw error with unknown error message', async () => {
      mockFetchStripePrices.mockRejectedValue('Unknown error');

      await expect(getPricing()).rejects.toThrow('Pricing data fetch failed: Unknown error');
      expect(mockFetchStripePrices).toHaveBeenCalledTimes(1);
    });

    it('should throw error that can be caught by error boundary', async () => {
      const networkError = new Error('Network connection failed');
      mockFetchStripePrices.mockRejectedValue(networkError);

      // This test verifies that getPricing throws an error that would be caught
      // by the app-level error boundary when called from a page component
      await expect(getPricing()).rejects.toThrow('Pricing data fetch failed: Network connection failed');
    });
  });
});