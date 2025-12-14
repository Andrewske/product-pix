import { describe, it, expect } from 'bun:test';
import { submitFeedback, getFeedbackForImage, deleteFeedback } from '../feedback';

describe('Feedback Database Functions', () => {
  describe('submitFeedback', () => {
    it('should be a function', () => {
      expect(typeof submitFeedback).toBe('function');
    });
  });

  describe('getFeedbackForImage', () => {
    it('should be a function', () => {
      expect(typeof getFeedbackForImage).toBe('function');
    });
  });

  describe('deleteFeedback', () => {
    it('should be a function', () => {
      expect(typeof deleteFeedback).toBe('function');
    });
  });
});