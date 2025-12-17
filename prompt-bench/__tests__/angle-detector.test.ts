import { describe, it, expect, mock } from 'bun:test';
import { detectSourceAngles } from '../core/angle-detector';
import type { ResolvedSourceImage } from '../core/source-image';

// Mock all external dependencies
mock.module('@bench/core/logger', () => ({
  logger: {
    debug: mock(() => {}),
    warn: mock(() => {}),
  },
}));

mock.module('@/lib/supabase/admin', () => ({
  createAdminClient: mock(() => ({
    from: mock(() => ({
      select: mock(() => ({
        eq: mock(() => ({
          single: mock(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } })),
        })),
      })),
      insert: mock(() => Promise.resolve({ error: null })),
    })),
  })),
}));

mock.module('ai', () => ({
  generateObject: mock(() => Promise.resolve({
    object: {
      sourceAngles: [
        { imageIndex: 0, detectedAngle: 'front view', isPrimaryReference: true },
        { imageIndex: 1, detectedAngle: 'side view', isPrimaryReference: false },
      ],
    },
  })),
}));

mock.module('@ai-sdk/google', () => ({
  google: mock(() => ({})),
}));

describe('detectSourceAngles', () => {
  const mockImages: ResolvedSourceImage[] = [
    {
      buffer: Buffer.from('fake-image-1'),
      mimeType: 'image/jpeg',
      hash: 'hash1',
      r2Key: 'key1',
      r2Url: 'url1',
    },
    {
      buffer: Buffer.from('fake-image-2'),
      mimeType: 'image/jpeg',
      hash: 'hash2',
      r2Key: 'key2',
      r2Url: 'url2',
    },
  ];

  it('validates source images count', async () => {
    const result = await detectSourceAngles([]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('returns Result<DetectedAngles> with successful detection', async () => {
    const result = await detectSourceAngles(mockImages);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveProperty('sourceAngles');
      expect(Array.isArray(result.data.sourceAngles)).toBe(true);
      expect(result.data.sourceAngles).toHaveLength(2);
    }
  });

  it('handles caching disabled', async () => {
    const result = await detectSourceAngles(mockImages, { cacheEnabled: false });

    expect(result.ok).toBe(true);
  });

  it('uses specified model', async () => {
    const result = await detectSourceAngles(mockImages, { model: 'gemini-2.0-flash-exp' });

    expect(result.ok).toBe(true);
  });
});