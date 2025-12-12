import { describe, it, expect } from 'bun:test';
import { getMimeType, computeHash, resolveSourcePath } from '@bench/core/source-image';

describe('source-image', () => {
  describe('getMimeType', () => {
    it('returns image/png for .png files', () => {
      const result = getMimeType('/path/to/image.png');
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toBe('image/png');
    });

    it('returns image/jpeg for .jpg files', () => {
      const result = getMimeType('/path/to/image.jpg');
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toBe('image/jpeg');
    });

    it('returns image/jpeg for .jpeg files', () => {
      const result = getMimeType('/path/to/image.jpeg');
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toBe('image/jpeg');
    });

    it('returns image/webp for .webp files', () => {
      const result = getMimeType('/path/to/image.webp');
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toBe('image/webp');
    });

    it('returns error for unsupported formats', () => {
      const result = getMimeType('/path/to/image.gif');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('Unsupported');
      }
    });

    it('handles uppercase extensions', () => {
      const result = getMimeType('/path/to/IMAGE.PNG');
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toBe('image/png');
    });
  });

  describe('computeHash', () => {
    it('returns consistent hash for same content', () => {
      const buffer = Buffer.from('test content');
      const hash1 = computeHash(buffer);
      const hash2 = computeHash(buffer);
      expect(hash1).toBe(hash2);
    });

    it('returns different hash for different content', () => {
      const hash1 = computeHash(Buffer.from('content 1'));
      const hash2 = computeHash(Buffer.from('content 2'));
      expect(hash1).not.toBe(hash2);
    });

    it('returns 64-character hex string', () => {
      const hash = computeHash(Buffer.from('test'));
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('resolveSourcePath', () => {
    it('returns HTTP URL unchanged', () => {
      const result = resolveSourcePath(
        'http://example.com/image.png',
        '/batch/file.json'
      );
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toBe('http://example.com/image.png');
    });

    it('returns HTTPS URL unchanged', () => {
      const result = resolveSourcePath(
        'https://example.com/image.png',
        '/batch/file.json'
      );
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toBe('https://example.com/image.png');
    });
  });
});
