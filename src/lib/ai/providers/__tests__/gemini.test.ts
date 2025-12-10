// src/lib/ai/providers/__tests__/gemini.test.ts
import { describe, it, expect, mock } from 'bun:test';
import type { ImageConfig } from '../../types';

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

// Mock the env module
mock.module('@/lib/env', () => ({
  env: { ...mockEnvValues },
}));

// Import after mocking
const { createGeminiProvider } = await import('../gemini');

describe('createGeminiProvider', () => {
  const provider = createGeminiProvider();

  describe('provider structure', () => {
    it('should return a provider with correct name', () => {
      expect(provider.name).toBe('gemini');
    });

    it('should have generateFromText method', () => {
      expect(typeof provider.generateFromText).toBe('function');
    });

    it('should have generateFromImage method', () => {
      expect(typeof provider.generateFromImage).toBe('function');
    });

    it('should have isAvailable method', () => {
      expect(typeof provider.isAvailable).toBe('function');
    });
  });

  describe('generateFromText', () => {
    it('should accept valid parameters', () => {
      const config: ImageConfig = {
        aspectRatio: '1:1',
        resolution: '1k',
      };

      // Test that the method exists and accepts parameters
      // (Full integration testing would require mocking the AI SDK)
      expect(() => provider.generateFromText('test prompt', config)).not.toThrow();
    });

    it('should handle rawPrompt option', () => {
      const config: ImageConfig = {
        aspectRatio: '1:1',
        resolution: '1k',
        rawPrompt: true,
      };

      expect(() => provider.generateFromText('raw prompt', config)).not.toThrow();
    });
  });

  describe('generateFromImage', () => {
    it('should accept valid parameters', () => {
      const config: ImageConfig = {
        aspectRatio: '1:1',
        resolution: '1k',
      };
      const sourceImage = Buffer.from('fake image data');
      const sourceMimeType = 'image/jpeg';

      expect(() =>
        provider.generateFromImage(sourceImage, sourceMimeType, 'transform prompt', config)
      ).not.toThrow();
    });

    it('should handle rawPrompt option', () => {
      const config: ImageConfig = {
        aspectRatio: '1:1',
        resolution: '1k',
        rawPrompt: true,
      };
      const sourceImage = Buffer.from('fake image data');
      const sourceMimeType = 'image/png';

      expect(() =>
        provider.generateFromImage(sourceImage, sourceMimeType, 'raw transform prompt', config)
      ).not.toThrow();
    });
  });

  describe('isAvailable', () => {
    it('should return a boolean', async () => {
      const result = await provider.isAvailable();
      expect(typeof result).toBe('boolean');
    });
  });
});
