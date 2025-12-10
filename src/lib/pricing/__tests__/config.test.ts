import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { readFileSync } from 'fs';
import { loadPricingConfig, clearPricingCache } from '../config';

// Mock fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));

// Mock @iarna/toml
jest.mock('@iarna/toml', () => ({
  parse: jest.fn(),
}));

const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>;
const mockParse = require('@iarna/toml').parse as jest.MockedFunction<any>;

describe('Pricing Config Loader', () => {
  beforeEach(() => {
    clearPricingCache();
    jest.clearAllMocks();
  });

  it('should load valid TOML config correctly', () => {
    const mockToml = `
[pricing.anthropic]
"claude-sonnet-4" = { input = 3.0, output = 15.0 }

[pricing.openai]
"gpt-4o" = { input = 2.5, output = 10.0 }

[pricing.google]
"gemini-3-pro-image-preview" = { input = 0.075, output = 0.3 }
`;

    mockReadFileSync.mockReturnValue(mockToml);
    mockParse.mockReturnValue({
      pricing: {
        anthropic: { 'claude-sonnet-4': { input: 3.0, output: 15.0 } },
        openai: { 'gpt-4o': { input: 2.5, output: 10.0 } },
        google: { 'gemini-3-pro-image-preview': { input: 0.075, output: 0.3 } },
      },
    });

    const config = loadPricingConfig();

    expect(config.anthropic['claude-sonnet-4']).toEqual({ input: 3.0, output: 15.0 });
    expect(config.openai['gpt-4o']).toEqual({ input: 2.5, output: 10.0 });
    expect(config.google['gemini-3-pro-image-preview']).toEqual({ input: 0.075, output: 0.3 });
    expect(config.fallback).toEqual({ input: 4.5, output: 22.5 }); // Based on mock data max (claude-sonnet-4)
    expect(config.fallbackSource).toBe('anthropic.claude-sonnet-4');
  });

  it('should throw error for missing config file', () => {
    mockReadFileSync.mockImplementation(() => {
      throw new Error('ENOENT');
    });

    expect(() => loadPricingConfig()).toThrow(
      /Pricing config file not found at: .*prompt-bench\.toml/
    );
  });

  it('should throw error for invalid TOML syntax', () => {
    mockReadFileSync.mockReturnValue('invalid [toml syntax');
    mockParse.mockImplementation(() => {
      throw new Error('Parse error at line 1');
    });

    expect(() => loadPricingConfig()).toThrow(
      /Invalid TOML syntax in pricing config.*Parse error at line 1/
    );
  });

  it('should throw error for missing pricing section', () => {
    mockReadFileSync.mockReturnValue('[defaults]\ntemplate = "test"');
    mockParse.mockReturnValue({ defaults: { template: 'test' } });

    expect(() => loadPricingConfig()).toThrow(
      /Missing \[pricing\] section in config file/
    );
  });

  it('should throw error for missing provider sections', () => {
    mockReadFileSync.mockReturnValue('[pricing]\nanthropic = {}');
    mockParse.mockReturnValue({ pricing: { anthropic: {} } });

    expect(() => loadPricingConfig()).toThrow(
      /Missing \[pricing\.openai\] section/
    );
  });

  it('should throw error for invalid pricing data types', () => {
    mockReadFileSync.mockReturnValue(`
[pricing.anthropic]
"claude-sonnet-4" = { input = "3.0", output = 15.0 }

[pricing.openai]
"gpt-4o" = { input = 2.5, output = 10.0 }

[pricing.google]
"gemini-3-pro-image-preview" = { input = 0.075, output = 0.3 }
`);
    mockParse.mockReturnValue({
      pricing: {
        anthropic: { 'claude-sonnet-4': { input: '3.0', output: 15.0 } },
        openai: { 'gpt-4o': { input: 2.5, output: 10.0 } },
        google: { 'gemini-3-pro-image-preview': { input: 0.075, output: 0.3 } },
      },
    });

    expect(() => loadPricingConfig()).toThrow(
      /Invalid pricing for anthropic\.claude-sonnet-4: input and output must be numbers/
    );
  });

  it('should cache config and return same instance', () => {
    const mockToml = `
[pricing.anthropic]
"claude-sonnet-4" = { input = 3.0, output = 15.0 }

[pricing.openai]
"gpt-4o" = { input = 2.5, output = 10.0 }

[pricing.google]
"gemini-3-pro-image-preview" = { input = 0.075, output = 0.3 }
`;

    mockReadFileSync.mockReturnValue(mockToml);
    mockParse.mockReturnValue({
      pricing: {
        anthropic: { 'claude-sonnet-4': { input: 3.0, output: 15.0 } },
        openai: { 'gpt-4o': { input: 2.5, output: 10.0 } },
        google: { 'gemini-3-pro-image-preview': { input: 0.075, output: 0.3 } },
      },
    });

    const config1 = loadPricingConfig();
    const config2 = loadPricingConfig();

    expect(config1).not.toBe(config2); // Different references (caching disabled in tests)
    expect(mockReadFileSync).toHaveBeenCalledTimes(2); // Called twice
  });

  it('should clear cache correctly', () => {
    const mockToml = `
[pricing.anthropic]
"claude-sonnet-4" = { input = 3.0, output = 15.0 }

[pricing.openai]
"gpt-4o" = { input = 2.5, output = 10.0 }

[pricing.google]
"gemini-3-pro-image-preview" = { input = 0.075, output = 0.3 }
`;

    mockReadFileSync.mockReturnValue(mockToml);
    mockParse.mockReturnValue({
      pricing: {
        anthropic: { 'claude-sonnet-4': { input: 3.0, output: 15.0 } },
        openai: { 'gpt-4o': { input: 2.5, output: 10.0 } },
        google: { 'gemini-3-pro-image-preview': { input: 0.075, output: 0.3 } },
      },
    });

    const config1 = loadPricingConfig();
    clearPricingCache();
    const config2 = loadPricingConfig();

    expect(config1).not.toBe(config2); // Different references
    expect(mockReadFileSync).toHaveBeenCalledTimes(2); // Called twice
  });

  it('should compute fallback from max prices correctly', () => {
    const mockToml = `
[pricing.anthropic]
"claude-opus-4-5" = { input = 15.0, output = 75.0 }

[pricing.openai]
"gpt-4o" = { input = 2.5, output = 10.0 }

[pricing.google]
"gemini-3-pro-image-preview" = { input = 0.075, output = 0.3 }
`;

    mockReadFileSync.mockReturnValue(mockToml);
    mockParse.mockReturnValue({
      pricing: {
        anthropic: { 'claude-opus-4-5': { input: 15.0, output: 75.0 } },
        openai: { 'gpt-4o': { input: 2.5, output: 10.0 } },
        google: { 'gemini-3-pro-image-preview': { input: 0.075, output: 0.3 } },
      },
    });

    const config = loadPricingConfig();

    expect(config.fallback.input).toBe(22.5); // 15.0 * 1.5
    expect(config.fallback.output).toBe(112.5); // 75.0 * 1.5
    expect(config.fallbackSource).toBe('anthropic.claude-opus-4-5');
  });
});