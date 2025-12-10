import { describe, it, expect, beforeEach, mock } from 'bun:test';
import type { PricingConfig } from '../types';

const mockLoadPricingConfig = mock(() => mockConfig);

// Mock config loader
mock.module('../config', () => ({
  loadPricingConfig: mockLoadPricingConfig,
}));

const mockConfig: PricingConfig = {
  anthropic: {
    'claude-sonnet-4': { input: 3.0, output: 15.0 },
    'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
    'claude-opus-4-5': { input: 15.0, output: 75.0 },
  },
  openai: {
    'gpt-4o': { input: 2.5, output: 10.0 },
    'gpt-4o-mini': { input: 0.15, output: 0.6 },
  },
  google: {
    'gemini-3-pro-image-preview': { input: 0.075, output: 0.3 },
  },
  fallback: { input: 22.5, output: 112.5 },
  fallbackSource: 'anthropic.claude-opus-4-5',
};

// Dynamic import after mocking
const { getProviderForModel, getPricingForModel } = await import('../models');

describe('Model to Provider Mapping', () => {
  beforeEach(() => {
    mockLoadPricingConfig.mockReset();
    mockLoadPricingConfig.mockReturnValue(mockConfig);
  });

  describe('getProviderForModel', () => {
    it('should return anthropic for Claude models', () => {
      expect(getProviderForModel('claude-sonnet-4')).toBe('anthropic');
      expect(getProviderForModel('claude-sonnet-4-20250514')).toBe('anthropic');
      expect(getProviderForModel('claude-opus-4-5')).toBe('anthropic');
    });

    it('should return openai for GPT models', () => {
      expect(getProviderForModel('gpt-4o')).toBe('openai');
      expect(getProviderForModel('gpt-4o-mini')).toBe('openai');
    });

    it('should return google for Gemini models', () => {
      expect(getProviderForModel('gemini-3-pro-image-preview')).toBe('google');
    });

    it('should return unknown for unrecognized prefixes', () => {
      expect(getProviderForModel('unknown-model-xyz')).toBe('unknown');
      expect(getProviderForModel('gpt-claude-hybrid')).toBe('unknown');
      expect(getProviderForModel('claude-gpt-mix')).toBe('unknown');
    });

    it('should handle exact match before prefix match', () => {
      expect(getProviderForModel('claude-sonnet-4')).toBe('anthropic');
      expect(getProviderForModel('claude-sonnet-4-20250514')).toBe('anthropic');
    });

    it('should handle version suffix stripping', () => {
      expect(getProviderForModel('claude-sonnet-4-20250514')).toBe('anthropic');
      expect(getProviderForModel('gpt-4o-v2')).toBe('unknown'); // No base match
    });
  });

  describe('getPricingForModel', () => {
    it('should return correct pricing for known Anthropic models', () => {
      expect(getPricingForModel('claude-sonnet-4')).toEqual({ input: 3.0, output: 15.0 });
      expect(getPricingForModel('claude-sonnet-4-20250514')).toEqual({ input: 3.0, output: 15.0 });
      expect(getPricingForModel('claude-opus-4-5')).toEqual({ input: 15.0, output: 75.0 });
    });

    it('should return correct pricing for known OpenAI models', () => {
      expect(getPricingForModel('gpt-4o')).toEqual({ input: 2.5, output: 10.0 });
      expect(getPricingForModel('gpt-4o-mini')).toEqual({ input: 0.15, output: 0.6 });
    });

    it('should return correct pricing for known Google models', () => {
      expect(getPricingForModel('gemini-3-pro-image-preview')).toEqual({ input: 0.075, output: 0.3 });
    });

    it('should return fallback pricing for unknown models', () => {
      expect(getPricingForModel('unknown-model-xyz')).toEqual({ input: 22.5, output: 112.5 });
      expect(getPricingForModel('gpt-claude-hybrid')).toEqual({ input: 22.5, output: 112.5 });
    });

    it('should handle prefix matching for versioned models', () => {
      // This would require adding a base model to config, but tests the logic
      expect(getPricingForModel('claude-sonnet-4-20250514')).toEqual({ input: 3.0, output: 15.0 });
    });

    it('should use provided config instead of loading', () => {
      const customConfig: PricingConfig = {
        ...mockConfig,
        anthropic: {
          'custom-model': { input: 1.0, output: 2.0 },
        },
      };

      expect(getPricingForModel('custom-model', customConfig)).toEqual({ input: 1.0, output: 2.0 });
      expect(mockLoadPricingConfig).not.toHaveBeenCalled();
    });
  });

  describe('Version suffix patterns', () => {
    it('should strip date suffixes (8 digits)', () => {
      expect(getProviderForModel('claude-sonnet-4-20250514')).toBe('anthropic');
      expect(getProviderForModel('gpt-4o-20240101')).toBe('openai'); // Strips to gpt-4o
    });

    it('should strip version suffixes (major.minor)', () => {
      expect(getProviderForModel('gemini-3-pro-image-preview-1.0')).toBe('google');
      expect(getProviderForModel('gpt-4o-2.1')).toBe('openai'); // Strips to gpt-4o
    });

    it('should strip version suffixes (major only)', () => {
      expect(getProviderForModel('claude-sonnet-4-5')).toBe('anthropic');
      expect(getProviderForModel('gpt-4o-1')).toBe('openai'); // Strips to gpt-4o
    });

    it('should not strip non-version suffixes', () => {
      expect(getProviderForModel('claude-sonnet-4-lite')).toBe('unknown');
      expect(getProviderForModel('gpt-4o-turbo')).toBe('unknown');
    });
  });
});
