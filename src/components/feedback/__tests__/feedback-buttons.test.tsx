import { describe, it, expect } from 'bun:test';
import { FeedbackButtons } from '../feedback-buttons';

describe('FeedbackButtons', () => {
  describe('component', () => {
    it('should be a function', () => {
      expect(typeof FeedbackButtons).toBe('function');
    });
  });
});