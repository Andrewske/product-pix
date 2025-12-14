import { describe, it, expect } from 'bun:test';
import { useImageFeedback } from '../use-image-feedback';

describe('useImageFeedback', () => {
  describe('hook', () => {
    it('should be a function', () => {
      expect(typeof useImageFeedback).toBe('function');
    });
  });
});