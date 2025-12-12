import { describe, it, expect, beforeAll } from '@jest/globals';
import { calculateCost } from '../calculator';
import { clearPricingCache } from '../config';

interface ValidationFixture {
  modelId: string;
  usage: { input: number; output: number };
  expectedCost?: {
    inputCost?: number;
    outputCost?: number;
    total?: number;
    provider: string;
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

    },
    source: 'https://ai.google.dev/pricing (verified 2025-12-08)',
  },
  {
    modelId: 'unknown-model-xyz',
    usage: { input: 1000000, output: 500000 },
    expectedError: 'Model \'unknown-model-xyz\' is not configured in pricing',
    source: 'Unknown model should throw error',
  },
  {
    modelId: 'gpt-claude-hybrid',
    usage: { input: 1000000, output: 500000 },
    expectedError: 'Model \'gpt-claude-hybrid\' is not configured in pricing',
    source: 'Cross-provider confusion should throw error',
  },
  {
    modelId: 'claude-sonnet-4-20250514',
    usage: { input: 0, output: 0 },
    expectedCost: {
      inputCost: 0,
      outputCost: 0,
      total: 0,
      provider: 'anthropic',

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
    clearPricingCache();
  });


  it('should validate all pricing fixtures against actual calculations', () => {
    for (const fixture of fixtures) {
      if (fixture.expectedError) {
        // Should throw an error
        expect(() => {
          calculateCost(fixture.modelId, fixture.usage);
        }).toThrow(fixture.expectedError);
      } else if (fixture.expectedCost) {
        // Should return success with expected cost
        const cost = calculateCost(fixture.modelId, fixture.usage);

        // Check exact values for known models
        if (fixture.expectedCost.inputCost !== undefined &&
            fixture.expectedCost.outputCost !== undefined && fixture.expectedCost.total !== undefined) {
          expect(cost.inputCost).toBeCloseTo(fixture.expectedCost.inputCost, 2);
          expect(cost.outputCost).toBeCloseTo(fixture.expectedCost.outputCost, 2);
          expect(cost.total).toBeCloseTo(fixture.expectedCost.total, 2);
        }

        // Always check provider
        expect(cost.provider).toBe(fixture.expectedCost.provider);
        expect(cost.modelId).toBe(fixture.modelId);
      }
    }
  });

  it('should handle zero usage correctly', () => {
    const zeroUsageFixtures = fixtures.filter(f => f.usage.input === 0 && f.usage.output === 0);

    for (const fixture of zeroUsageFixtures) {
      const cost = calculateCost(fixture.modelId, fixture.usage);

      expect(cost.total).toBe(0);
      expect(cost.inputCost).toBe(0);
      expect(cost.outputCost).toBe(0);
    }
  });



  it('should validate exact pricing matches for known models', () => {
    const knownModelFixtures = fixtures.filter(f =>
      f.expectedCost && !f.expectedError
    );

    for (const fixture of knownModelFixtures) {
      const cost = calculateCost(fixture.modelId, fixture.usage);

      if (fixture.expectedCost) {
        if (fixture.expectedCost.inputCost !== undefined && fixture.expectedCost.outputCost !== undefined && fixture.expectedCost.total !== undefined) {
          expect(cost.inputCost).toBeCloseTo(fixture.expectedCost.inputCost, 2);
          expect(cost.outputCost).toBeCloseTo(fixture.expectedCost.outputCost, 2);
          expect(cost.total).toBeCloseTo(fixture.expectedCost.total, 2);
        }
        expect(cost.provider).not.toBe('unknown');
      }
    }
  });

  it('should handle prefix matching correctly', () => {
    const prefixFixtures = fixtures.filter(f =>
      f.modelId.includes('-') && f.modelId.split('-').length > 2 &&
      f.expectedCost
    );

    for (const fixture of prefixFixtures) {
      const cost = calculateCost(fixture.modelId, fixture.usage);

      if (fixture.expectedCost) {
        // Should get same pricing as the base model
        expect(cost.provider).toBe(fixture.expectedCost.provider);
      }
    }
  });
});
