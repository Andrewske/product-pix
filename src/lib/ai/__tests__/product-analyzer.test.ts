// src/lib/ai/__tests__/product-analyzer.test.ts
import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test';
import type { SpyInstance } from 'bun:test';
import type { ProductAnalysis } from '../types';

// Create mock functions
const mockGenerateObject = mock(() => {});
const mockGoogle = mock(() => 'mocked-google-model');
const mockLoggerError = mock(() => {});
const mockNormalizeUsage = mock(() => {});

// Mock modules
mock.module('ai', () => ({
  generateObject: mockGenerateObject,
}));

mock.module('@ai-sdk/google', () => ({
  google: (modelName: string) => {
    mockGoogle(modelName);
    return 'mocked-google-model' as const;
  },
}));

const mockEnvValues = {
  GOOGLE_GENERATIVE_AI_API_KEY: 'test-google-key',
  GEMINI_MODEL: 'gemini-3-pro-image-preview',
  ANALYSIS_MODEL: 'gemini-2.0-flash',
  ANTHROPIC_API_KEY: 'test-anthropic-key',
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'public-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  R2_ACCOUNT_ID: 'r2-account',
  R2_ACCESS_KEY_ID: 'r2-access-key',
  R2_SECRET_ACCESS_KEY: 'r2-secret',
  R2_BUCKET_NAME: 'product-pix-bucket',
  R2_PUBLIC_URL: 'https://r2.example.com',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  CRON_SECRET: 'cron-secret',
  STRIPE_SECRET_KEY: 'sk_test_123',
  STRIPE_WEBHOOK_SECRET: 'whsec_test_123',
  STRIPE_PRICE_PACK_50: 'price_pack_50',
  STRIPE_PRICE_PACK_200: 'price_pack_200',
  STRIPE_PRICE_PACK_500: 'price_pack_500',
  STRIPE_PRICE_PRO_MONTHLY: 'price_pro_monthly',
  STRIPE_PRICE_BUSINESS_MONTHLY: 'price_business_monthly',
};

mock.module('@/lib/env', () => ({
  env: { ...mockEnvValues },
}));

mock.module('../usage-types', () => ({
  normalizeUsage: mockNormalizeUsage,
}));

// Dynamic import after mocking
const { analyzeProductImage } = await import('../product-analyzer');
const { env } = await import('@/lib/env');
const loggingModule = await import('@/lib/logging');
let loggerErrorSpy: SpyInstance<typeof loggingModule.logger.error>;

describe('analyzeProductImage', () => {
  const mockImageBuffer = Buffer.from('fake-image-data');
  const mockMimeType = 'image/jpeg';

  const mockAnalysisResult: ProductAnalysis = {
    product: 'ceramic coffee mug',
    color: 'matte black',
    material: 'ceramic',
    shape: 'cylindrical with handle',
    features: ['textured surface', 'wide rim'],
  };

  const mockNormalizedUsage = {
    promptTokens: 150,
    completionTokens: 200,
    totalTokens: 350,
  };

  beforeEach(() => {
    mockGenerateObject.mockReset();
    mockGoogle.mockReset();
    mockLoggerError.mockReset();
    mockNormalizeUsage.mockReset();

    mockGoogle.mockReturnValue('mocked-google-model' as any);
    mockNormalizeUsage.mockReturnValue(mockNormalizedUsage);
    loggerErrorSpy = spyOn(loggingModule.logger, 'error').mockImplementation(mockLoggerError as any);
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('should successfully analyze product image and return correct structure', async () => {
    mockGenerateObject.mockResolvedValue({
      object: mockAnalysisResult,
      usage: { inputTokens: 150, outputTokens: 200 },
    } as any);

    const result = await analyzeProductImage(mockImageBuffer, mockMimeType);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.analysis).toEqual(mockAnalysisResult);
      expect(result.data.usage).toEqual(mockNormalizedUsage);
    }

    expect(mockGoogle).toHaveBeenCalledWith('gemini-2.0-flash');
    expect(mockNormalizeUsage).toHaveBeenCalledWith({ inputTokens: 150, outputTokens: 200 });
    expect(mockLoggerError).not.toHaveBeenCalled();
  });

  it('should use default model when ANALYSIS_MODEL is not set', async () => {
    const originalEnv = { ...env };
    (env as any).ANALYSIS_MODEL = undefined;

    mockGenerateObject.mockResolvedValue({
      object: mockAnalysisResult,
      usage: { inputTokens: 150, outputTokens: 200 },
    } as any);

    const result = await analyzeProductImage(mockImageBuffer, mockMimeType);

    expect(result.ok).toBe(true);
    expect(mockGoogle).toHaveBeenCalledWith('gemini-2.0-flash');

    Object.assign(env, originalEnv);
  });

  it('should use custom model when ANALYSIS_MODEL is set', async () => {
    const originalEnv = { ...env };
    (env as any).ANALYSIS_MODEL = 'gemini-pro-vision';

    mockGenerateObject.mockResolvedValue({
      object: mockAnalysisResult,
      usage: { inputTokens: 150, outputTokens: 200 },
    } as any);

    const result = await analyzeProductImage(mockImageBuffer, mockMimeType);

    expect(result.ok).toBe(true);
    expect(mockGoogle).toHaveBeenCalledWith('gemini-pro-vision');

    Object.assign(env, originalEnv);
  });

  it('should handle analysis with empty strings for undetermined fields', async () => {
    const partialAnalysisResult: ProductAnalysis = {
      product: 'unknown product',
      color: '',
      material: '',
      shape: 'rectangular',
      features: [],
    };

    mockGenerateObject.mockResolvedValue({
      object: partialAnalysisResult,
      usage: { inputTokens: 150, outputTokens: 200 },
    } as any);

    const result = await analyzeProductImage(mockImageBuffer, mockMimeType);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.analysis).toEqual(partialAnalysisResult);
      expect(result.data.analysis.color).toBe('');
      expect(result.data.analysis.material).toBe('');
      expect(result.data.analysis.features).toEqual([]);
    }
  });

  it('should return error when generateObject throws an error', async () => {
    const mockError = new Error('API rate limit exceeded');
    mockGenerateObject.mockRejectedValue(mockError);

    const result = await analyzeProductImage(mockImageBuffer, mockMimeType);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('ANALYSIS_FAILED');
      expect(result.error.message).toBe('Failed to analyze product image: API rate limit exceeded');
    }

    expect(mockLoggerError).toHaveBeenCalledWith('Product analysis failed', {
      error: 'API rate limit exceeded',
    });
    expect(mockNormalizeUsage).not.toHaveBeenCalled();
  });

  it('should return error with generic message for non-Error exceptions', async () => {
    mockGenerateObject.mockRejectedValue('string error');

    const result = await analyzeProductImage(mockImageBuffer, mockMimeType);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('ANALYSIS_FAILED');
      expect(result.error.message).toBe('Failed to analyze product image: Unknown error during product analysis');
    }

    expect(mockLoggerError).toHaveBeenCalledWith('Product analysis failed', {
      error: 'Unknown error during product analysis',
    });
  });

  it('should normalize usage correctly', async () => {
    const geminiUsage = {
      promptTokenCount: 100,
      candidatesTokenCount: 50,
      totalTokenCount: 150,
    };

    const expectedNormalized = {
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
    };

    mockGenerateObject.mockResolvedValue({
      object: mockAnalysisResult,
      usage: geminiUsage,
    } as any);
    mockNormalizeUsage.mockReturnValue(expectedNormalized);

    const result = await analyzeProductImage(mockImageBuffer, mockMimeType);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.usage).toEqual(expectedNormalized);
    }
    expect(mockNormalizeUsage).toHaveBeenCalledWith(geminiUsage);
  });

  it('should handle missing usage data', async () => {
    const fallbackUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };

    mockGenerateObject.mockResolvedValue({
      object: mockAnalysisResult,
      usage: undefined,
    } as any);
    mockNormalizeUsage.mockReturnValue(fallbackUsage);

    const result = await analyzeProductImage(mockImageBuffer, mockMimeType);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.usage).toEqual(fallbackUsage);
    }
    expect(mockNormalizeUsage).toHaveBeenCalledWith(undefined);
  });

  it('should pass correct parameters to generateObject', async () => {
    mockGenerateObject.mockResolvedValue({
      object: mockAnalysisResult,
      usage: { inputTokens: 150, outputTokens: 200 },
    } as any);

    await analyzeProductImage(mockImageBuffer, mockMimeType);

    const callArgs = mockGenerateObject.mock.calls[0][0];

    expect(callArgs).toHaveProperty('model');
    expect(callArgs).toHaveProperty('messages');
    expect(callArgs).toHaveProperty('schema');

    // Verify the messages structure
    const messages = (callArgs as any).messages;
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toHaveLength(2);
  });

  it('should include image in the correct format in messages', async () => {
    mockGenerateObject.mockResolvedValue({
      object: mockAnalysisResult,
      usage: { inputTokens: 150, outputTokens: 200 },
    } as any);

    await analyzeProductImage(mockImageBuffer, mockMimeType);

    const callArgs = mockGenerateObject.mock.calls[0][0];
    const messages = (callArgs as any).messages;

    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe('user');
    expect(messages[0].content).toHaveLength(2);

    expect(messages[0].content[0]).toEqual({
      type: 'text',
      text: 'Analyze this product image and extract the following information. Be specific and descriptive. If you cannot determine a field, use an empty string.',
    });

    expect(messages[0].content[1]).toEqual({
      type: 'image',
      image: mockImageBuffer,
    });
  });
});
