import { describe, it, expect } from 'bun:test';
import { env } from '@/lib/env';

const { CREDIT_PACKS, SUBSCRIPTION_TIERS } = await import('../products');

describe('Stripe Products Configuration', () => {
  describe('CREDIT_PACKS', () => {
    it('should have correct pack configurations', () => {
      expect(CREDIT_PACKS.pack_50).toEqual({
        credits: 50,
        priceId: env.STRIPE_PRICE_PACK_50,
      });

      expect(CREDIT_PACKS.pack_200).toEqual({
        credits: 200,
        priceId: env.STRIPE_PRICE_PACK_200,
      });

      expect(CREDIT_PACKS.pack_500).toEqual({
        credits: 500,
        priceId: env.STRIPE_PRICE_PACK_500,
      });
    });

    it('should have valid credit amounts', () => {
      Object.values(CREDIT_PACKS).forEach((pack) => {
        expect(pack.credits).toBeGreaterThan(0);
        expect(pack.priceId).toBeDefined();
      });
    });
  });

  describe('SUBSCRIPTION_TIERS', () => {
    it('should have correct tier configurations', () => {
      expect(SUBSCRIPTION_TIERS.pro).toEqual({
        credits: 200,
        priceId: env.STRIPE_PRICE_PRO_MONTHLY,
      });

      expect(SUBSCRIPTION_TIERS.business).toEqual({
        credits: 600,
        priceId: env.STRIPE_PRICE_BUSINESS_MONTHLY,
      });
    });

    it('should have valid monthly tiers', () => {
      Object.values(SUBSCRIPTION_TIERS).forEach((tier) => {
        expect(tier.credits).toBeGreaterThan(0);
        expect(tier.priceId).toBeDefined();
      });
    });
  });
});
