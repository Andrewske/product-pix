import { describe, it, expect, mock } from 'bun:test';
import { getAnalysisCache, setAnalysisCache, generateCacheKey } from '@bench/core/analysis-cache';

describe('analysis cache', () => {
  it('generates cache key from image buffers', () => {
    const images = [
      { buffer: Buffer.from('image1') },
      { buffer: Buffer.from('image2') },
    ];

    const key = generateCacheKey(images);

    expect(key).toBeDefined();
    expect(typeof key).toBe('string');
    expect(key.startsWith('batch_')).toBe(true);
  });

  it('generates same key for same images', () => {
    const images1 = [
      { buffer: Buffer.from('image1') },
      { buffer: Buffer.from('image2') },
    ];
    const images2 = [
      { buffer: Buffer.from('image1') },
      { buffer: Buffer.from('image2') },
    ];

    const key1 = generateCacheKey(images1);
    const key2 = generateCacheKey(images2);

    expect(key1).toBe(key2);
  });

  it('generates different key when images change', () => {
    const images1 = [
      { buffer: Buffer.from('image1') },
      { buffer: Buffer.from('image2') },
    ];
    const images2 = [
      { buffer: Buffer.from('image1') },
      { buffer: Buffer.from('image3') },
    ];

    const key1 = generateCacheKey(images1);
    const key2 = generateCacheKey(images2);

    expect(key1).not.toBe(key2);
  });
});

// Note: Full cache tests would require mocking the database
// These are basic unit tests for the key generation
