import { describe, it, expect } from 'bun:test';
import { ImageCard } from '../image-card';

describe('ImageCard', () => {
  it('should be a function', () => {
    expect(typeof ImageCard).toBe('function');
  });
});