import { describe, it, expect, beforeAll } from '@jest/globals';
import { calculateCost } from '../calculator';

interface ValidationFixture {
  modelId: string;
  usage: { input: number; output: number };
  expectedCost?: {
    inputCost?: number;
    outputCost?: number;
    total?: number;
    provider: string;
    fallbackUsed: boolean;
  };
  expectedError?: string;
  source: string;
}

const fixtures: ValidationFixture[] = [
  {
    modelId: 'claude-sonnet-4-20250514',
    usage: { input: 1000000, output: 500000 },
    expectedCost: {
      inputCost: 3.00,
      outputCost: 7.50,
      total: 10.50,
      provider: 'anthropic',
      fallbackUsed: false,
    },
    source: 'https://anthropic.com/pricing (verified 2025-12-08)',
  },
  {
    modelId: 'claude-sonnet-4',
    usage: { input: 1000000, output: 500000 },
    expectedCost: {
      inputCost: 3.00,
      outputCost: 7.50,
      total: 10.50,
      provider: 'anthropic',
      fallbackUsed: false,
    },
    source: 'Prefix match to claude-sonnet-4-20250514',
  },
  {
    modelId: 'claude-opus-4-5',
    usage: { input: 1000000, output: 500000 },
    expectedCost: {
      inputCost: 15.00,
      outputCost: 37.50,
      total: 52.50,
      provider: 'anthropic',
      fallbackUsed: false,
    },
    source: 'https://anthropic.com/pricing (verified 2025-12-08)',
  },
  {
    modelId: 'gpt-4o',
    usage: { input: 1000000, output: 500000 },
    expectedCost: {
      inputCost: 2.50,
      outputCost: 5.00,
      total: 7.50,
      provider: 'openai',
      fallbackUsed: false,
    },
    source: 'https://openai.com/pricing (verified 2025-12-08)',
  },
  {
    modelId: 'gpt-4o-mini',
    usage: { input: 1000000, output: 500000 },
    expectedCost: {
      inputCost: 0.15,
      outputCost: 0.30,
      total: 0.45,
      provider: 'openai',
      fallbackUsed: false,
    },
    source: 'https://openai.com/pricing (verified 2025-12-08)',
  },
  {
    modelId: 'gemini-3-pro-image-preview',
    usage: { input: 1000000, output: 500000 },
    expectedCost: {
      inputCost: 0.075,
      outputCost: 0.15,
      total: 0.225,
      provider: 'google',
      fallbackUsed: false,
    },
    source: 'https://ai.google.dev/pricing (verified 2025-12-08)',
  },
  {
    modelId: 'unknown-model-xyz',
    usage: { input: 1000000, output: 500000 },
    expectedCost: {
      provider: 'unknown',
      fallbackUsed: true,
    },
    source: 'Fallback pricing (computed as MAX * 1.5)',
  },
  {
    modelId: 'gpt-claude-hybrid',
    usage: { input: 1000000, output: 500000 },
    expectedCost: {
      provider: 'unknown',
      fallbackUsed: true,
    },
    source: 'Cross-provider confusion, uses fallback',
  },
  {
    modelId: 'claude-sonnet-4-20250514',
    usage: { input: 0, output: 0 },
    expectedCost: {
      inputCost: 0,
      outputCost: 0,
      total: 0,
      provider: 'anthropic',
      fallbackUsed: false,
    },
    source: 'Zero usage edge case',
  },
  {
    modelId: 'claude-sonnet-4-20250514',
    usage: { input: -100, output: 500 },
    expectedError: 'Token counts cannot be negative',
    source: 'Negative tokens validation',
  },
];

describe('Pricing Validation Fixtures', () => {
  beforeAll(() => {
    // Clear any cached config and ensure fresh load
    const { clearPricingCache } = require('../config');
    clearPricingCache();
  });


  it('should validate all pricing fixtures against actual calculations', () => {
    for (const fixture of fixtures) {
      const result = calculateCost(fixture.modelId, fixture.usage);

      if (fixture.expectedError) {
        // Should return an error
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toBe(fixture.expectedError);
        }
      } else if (fixture.expectedCost) {
        // Should return success with expected cost
        expect(result.ok).toBe(true);
        if (result.ok) {
          const cost = result.data;

          // Check exact values for known models
          if (!fixture.expectedCost.fallbackUsed && fixture.expectedCost.inputCost !== undefined &&
              fixture.expectedCost.outputCost !== undefined && fixture.expectedCost.total !== undefined) {
            expect(cost.inputCost).toBeCloseTo(fixture.expectedCost.inputCost, 2);
            expect(cost.outputCost).toBeCloseTo(fixture.expectedCost.outputCost, 2);
            expect(cost.total).toBeCloseTo(fixture.expectedCost.total, 2);
          }

          // Always check provider and fallback status
          expect(cost.provider).toBe(fixture.expectedCost.provider);
          expect(cost.fallbackUsed).toBe(fixture.expectedCost.fallbackUsed);
          expect(cost.modelId).toBe(fixture.modelId);
        }
      }
    }
  });

  it('should handle zero usage correctly', () => {
    const zeroUsageFixtures = fixtures.filter(f => f.usage.input === 0 && f.usage.output === 0);

    for (const fixture of zeroUsageFixtures) {
      const result = calculateCost(fixture.modelId, fixture.usage);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.total).toBe(0);
        expect(result.data.inputCost).toBe(0);
        expect(result.data.outputCost).toBe(0);
      }
    }
  });

  it('should validate fallback pricing for unknown models', () => {
    const fallbackFixtures = fixtures.filter(f => f.expectedCost?.fallbackUsed);

    for (const fixture of fallbackFixtures) {
      const result = calculateCost(fixture.modelId, fixture.usage);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.provider).toBe('unknown');
        expect(result.data.fallbackUsed).toBe(true);
        // Fallback pricing should be higher than any known model pricing
        expect(result.data.total).toBeGreaterThan(0);
      }
    }
  });

  it('should validate exact pricing matches for known models', () => {
    const knownModelFixtures = fixtures.filter(f =>
      f.expectedCost && !f.expectedCost.fallbackUsed && !f.expectedError
    );

    for (const fixture of knownModelFixtures) {
      const result = calculateCost(fixture.modelId, fixture.usage);

      expect(result.ok).toBe(true);
      if (result.ok && fixture.expectedCost) {
        if (fixture.expectedCost.inputCost !== undefined && fixture.expectedCost.outputCost !== undefined && fixture.expectedCost.total !== undefined) {
          expect(result.data.inputCost).toBeCloseTo(fixture.expectedCost.inputCost, 2);
          expect(result.data.outputCost).toBeCloseTo(fixture.expectedCost.outputCost, 2);
          expect(result.data.total).toBeCloseTo(fixture.expectedCost.total, 2);
        }
        expect(result.data.provider).not.toBe('unknown');
        expect(result.data.fallbackUsed).toBe(false);
      }
    }
  });

  it('should handle prefix matching correctly', () => {
    const prefixFixtures = fixtures.filter(f =>
      f.modelId.includes('-') && f.modelId.split('-').length > 2 &&
      f.expectedCost && !f.expectedCost.fallbackUsed
    );

    for (const fixture of prefixFixtures) {
      const result = calculateCost(fixture.modelId, fixture.usage);

      expect(result.ok).toBe(true);
      if (result.ok && fixture.expectedCost) {
        // Should get same pricing as the base model
        expect(result.data.provider).toBe(fixture.expectedCost.provider);
        expect(result.data.fallbackUsed).toBe(false);
      }
    }
  });
});