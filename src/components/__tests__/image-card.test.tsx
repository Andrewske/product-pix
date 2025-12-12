import { describe, it, expect } from 'bun:test';
import { ImageCard } from '../image-card';
import type { GeneratedImage } from '@/types';

describe('ImageCard', () => {
  it('should be a function', () => {
    expect(typeof ImageCard).toBe('function');
  });
});