import { describe, it, expect } from 'bun:test';
import { creditEconomy, type CreditEconomy } from '../pricing.config';

describe('Credit Economy Configuration', () => {
  it('should export creditEconomy const with correct structure', () => {
    expect(creditEconomy).toBeDefined();
    expect(typeof creditEconomy).toBe('object');
  });

  it('should have correct generationCosts values', () => {
    expect(creditEconomy.generationCosts.lightning).toEqual({
      '1k': 30,
      '2k': 60,
      '4k': 120,
    });
    expect(creditEconomy.generationCosts.snail).toEqual({
      '1k': 15,
      '2k': 30,
      '4k': 60,
    });
  });

  it('should have correct addonCosts values', () => {
    expect(creditEconomy.addonCosts).toEqual({
      titleGeneration: 50,
      fancyBackground: 10,
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
    const lightningCosts: CreditEconomy['generationCosts']['lightning'] = creditEconomy.generationCosts.lightning;
    expect(lightningCosts['1k']).toBe(30);

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
    const lightning1k: 30 = creditEconomy.generationCosts.lightning['1k'];
    const freeCredits: 5 = creditEconomy.freeCreditsOnSignup;
    const pack50Credits: 50 = creditEconomy.packs.pack_50.credits;

    expect(lightning1k).toBe(30);
    expect(freeCredits).toBe(5);
    expect(pack50Credits).toBe(50);
  });
});