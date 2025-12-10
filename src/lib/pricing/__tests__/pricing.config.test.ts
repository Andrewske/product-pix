import { describe, it, expect } from '@jest/globals';
import { creditEconomy, type CreditEconomy } from '../pricing.config';

describe('Credit Economy Configuration', () => {
  it('should export creditEconomy const with correct structure', () => {
    expect(creditEconomy).toBeDefined();
    expect(typeof creditEconomy).toBe('object');
  });

  it('should have correct creditsPerResolution values', () => {
    expect(creditEconomy.creditsPerResolution).toEqual({
      '1k': 1,
      '2k': 2,
      '4k': 3,
    });
  });

  it('should have correct freeCreditsOnSignup value', () => {
    expect(creditEconomy.freeCreditsOnSignup).toBe(5);
  });

  it('should have correct packs structure', () => {
    expect(creditEconomy.packs).toEqual({
      pack_50: { credits: 50, slug: 'pack_50' },
      pack_200: { credits: 200, slug: 'pack_200' },
      pack_500: { credits: 500, slug: 'pack_500' },
    });
  });

  it('should have correct subscriptions structure', () => {
    expect(creditEconomy.subscriptions).toEqual({
      pro: { creditsPerMonth: 200, slug: 'pro' },
      business: { creditsPerMonth: 600, slug: 'business' },
    });
  });

  it('should have literal types inferred correctly', () => {
    // Test that TypeScript infers literal types
    const resolutionCredits: CreditEconomy['creditsPerResolution'] = creditEconomy.creditsPerResolution;
    expect(resolutionCredits['1k']).toBe(1);

    const pack50: CreditEconomy['packs']['pack_50'] = creditEconomy.packs.pack_50;
    expect(pack50.credits).toBe(50);
    expect(pack50.slug).toBe('pack_50');

    const proSub: CreditEconomy['subscriptions']['pro'] = creditEconomy.subscriptions.pro;
    expect(proSub.creditsPerMonth).toBe(200);
    expect(proSub.slug).toBe('pro');
  });

  it('should validate successfully with Zod schema', () => {
    // If validation fails, it would throw an error during module import
    // Since the module imported successfully, validation passed
    expect(creditEconomy).toBeDefined();
  });

  it('should use as const for literal type inference', () => {
    // Test that TypeScript can infer literal types (this is a compile-time check)
    // The 'as const' ensures TypeScript treats values as literals rather than general types
    const credits1k: 1 = creditEconomy.creditsPerResolution['1k'];
    const freeCredits: 5 = creditEconomy.freeCreditsOnSignup;
    const pack50Credits: 50 = creditEconomy.packs.pack_50.credits;

    expect(credits1k).toBe(1);
    expect(freeCredits).toBe(5);
    expect(pack50Credits).toBe(50);
  });
});