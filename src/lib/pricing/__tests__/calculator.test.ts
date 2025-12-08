import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { calculateCost } from '../calculator';
import { getProviderForModel, getPricingForModel } from '../models';

// Mock the model functions
jest.mock('../models', () => ({
  getProviderForModel: jest.fn(),
  getPricingForModel: jest.fn(),
}));

const mockGetProviderForModel = getProviderForModel as jest.MockedFunction<typeof getProviderForModel>;
const mockGetPricingForModel = getPricingForModel as jest.MockedFunction<typeof getPricingForModel>;

describe('Cost Calculator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate costs correctly for known models', () => {
    mockGetProviderForModel.mockReturnValue('anthropic');
    mockGetPricingForModel.mockReturnValue({ input: 3.0, output: 15.0 });

    const result = calculateCost('claude-sonnet-4', { input: 1_000_000, output: 500_000 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.inputCost).toBe(3.0); // (1M / 1M) * 3.0
      expect(result.data.outputCost).toBe(7.5); // (500K / 1M) * 15.0
      expect(result.data.total).toBe(10.5);
      expect(result.data.modelId).toBe('claude-sonnet-4');
      expect(result.data.provider).toBe('anthropic');
      expect(result.data.fallbackUsed).toBe(false);
    }
  });

  it('should handle zero token usage', () => {
    mockGetProviderForModel.mockReturnValue('openai');

    const result = calculateCost('gpt-4o', { input: 0, output: 0 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.inputCost).toBe(0);
      expect(result.data.outputCost).toBe(0);
      expect(result.data.total).toBe(0);
      expect(result.data.fallbackUsed).toBe(false);
    }
  });

  it('should return error for negative input tokens', () => {
    const result = calculateCost('claude-sonnet-4', { input: -100, output: 500 });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toBe('Token counts cannot be negative');
      expect(result.error.retryable).toBe(false);
    }
  });

  it('should return error for negative output tokens', () => {
    const result = calculateCost('claude-sonnet-4', { input: 100, output: -500 });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toBe('Token counts cannot be negative');
    }
  });

  it('should handle large token counts', () => {
    mockGetProviderForModel.mockReturnValue('google');
    mockGetPricingForModel.mockReturnValue({ input: 0.075, output: 0.3 });

    const result = calculateCost('gemini-3-pro-image-preview', { input: 10_000_000, output: 5_000_000 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.inputCost).toBe(0.75); // (10M / 1M) * 0.075
      expect(result.data.outputCost).toBe(1.5); // (5M / 1M) * 0.3
      expect(result.data.total).toBe(2.25);
    }
  });

  it('should handle fractional token costs', () => {
    mockGetProviderForModel.mockReturnValue('openai');
    mockGetPricingForModel.mockReturnValue({ input: 2.5, output: 10.0 });

    const result = calculateCost('gpt-4o', { input: 500_000, output: 250_000 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.inputCost).toBe(1.25); // (500K / 1M) * 2.5
      expect(result.data.outputCost).toBe(2.5); // (250K / 1M) * 10.0
      expect(result.data.total).toBe(3.75);
    }
  });

  it('should mark fallback usage for unknown models', () => {
    mockGetProviderForModel.mockReturnValue('unknown');
    mockGetPricingForModel.mockReturnValue({ input: 22.5, output: 112.5 });

    const result = calculateCost('unknown-model-xyz', { input: 1_000_000, output: 500_000 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.provider).toBe('unknown');
      expect(result.data.fallbackUsed).toBe(true);
      expect(result.data.inputCost).toBe(22.5);
      expect(result.data.outputCost).toBe(56.25);
      expect(result.data.total).toBe(78.75);
    }
  });

  it('should handle mixed zero and non-zero tokens', () => {
    mockGetProviderForModel.mockReturnValue('anthropic');
    mockGetPricingForModel.mockReturnValue({ input: 3.0, output: 15.0 });

    const result = calculateCost('claude-sonnet-4', { input: 0, output: 500_000 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.inputCost).toBe(0);
      expect(result.data.outputCost).toBe(7.5);
      expect(result.data.total).toBe(7.5);
    }
  });

  it('should calculate costs with very small pricing', () => {
    mockGetProviderForModel.mockReturnValue('google');
    mockGetPricingForModel.mockReturnValue({ input: 0.075, output: 0.3 });

    const result = calculateCost('gemini-3-pro-image-preview', { input: 100_000, output: 50_000 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.inputCost).toBe(0.0075); // (100K / 1M) * 0.075
      expect(result.data.outputCost).toBe(0.015); // (50K / 1M) * 0.3
      expect(result.data.total).toBe(0.0225);
    }
  });
});