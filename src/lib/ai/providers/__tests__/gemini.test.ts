// src/lib/ai/providers/__tests__/gemini.test.ts
import { createGeminiProvider } from '../gemini';
import type { ImageConfig } from '../../types';

// Mock the env module
jest.mock('@/lib/env', () => ({
  env: {
    GEMINI_MODEL: 'gemini-3-pro-image-preview',
  },
}));

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