import { describe, it, expect } from 'bun:test';
import { NegativeFeedbackModal } from '../negative-feedback-modal';

describe('NegativeFeedbackModal', () => {
  describe('component', () => {
    it('should be a function', () => {
      expect(typeof NegativeFeedbackModal).toBe('function');
    });
  });
});