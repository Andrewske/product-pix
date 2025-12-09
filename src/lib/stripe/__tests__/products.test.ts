// Mock the env module before importing products
jest.mock('@/lib/env', () => ({
  env: {
    STRIPE_PRICE_PACK_50: 'price_test_pack_50',
    STRIPE_PRICE_PACK_200: 'price_test_pack_200',
    STRIPE_PRICE_PACK_500: 'price_test_pack_500',
    STRIPE_PRICE_PRO_MONTHLY: 'price_test_pro',
    STRIPE_PRICE_BUSINESS_MONTHLY: 'price_test_business',
  },
}));

import { CREDIT_PACKS, SUBSCRIPTION_TIERS } from '../products';

describe('Stripe Products Configuration', () => {
  describe('CREDIT_PACKS', () => {
    it('should have correct pack configurations', () => {
      expect(CREDIT_PACKS.pack_50).toEqual({
        credits: 50,
        priceCents: 1000,
        priceId: 'price_test_pack_50',
      });

      expect(CREDIT_PACKS.pack_200).toEqual({
        credits: 200,
        priceCents: 3000,
        priceId: 'price_test_pack_200',
      });

      expect(CREDIT_PACKS.pack_500).toEqual({
        credits: 500,
        priceCents: 6000,
        priceId: 'price_test_pack_500',
      });
    });

    it('should have valid price calculations', () => {
      Object.values(CREDIT_PACKS).forEach(pack => {
        expect(pack.priceCents).toBeGreaterThan(0);
        expect(pack.credits).toBeGreaterThan(0);
        expect(pack.priceCents / pack.credits).toBeGreaterThan(0);
      });
    });
  });

  describe('SUBSCRIPTION_TIERS', () => {
    it('should have correct tier configurations', () => {
      expect(SUBSCRIPTION_TIERS.pro).toEqual({
        credits: 200,
        priceCents: 2000,
        priceId: 'price_test_pro',
      });

      expect(SUBSCRIPTION_TIERS.business).toEqual({
        credits: 600,
        priceCents: 5000,
        priceId: 'price_test_business',
      });
    });

    it('should have valid monthly pricing', () => {
      Object.values(SUBSCRIPTION_TIERS).forEach(tier => {
        expect(tier.priceCents).toBeGreaterThan(0);
        expect(tier.credits).toBeGreaterThan(0);
      });
    });
  });
});
