import { describe, it, expect } from 'bun:test';
import {
  isPositiveFeedbackReason,
  isNegativeFeedbackReason,
  areValidReasonsForType
} from '../feedback';

describe('Feedback Type Guards', () => {
  describe('isPositiveFeedbackReason', () => {
    it('returns true for valid positive reasons', () => {
      expect(isPositiveFeedbackReason('great_quality')).toBe(true);
      expect(isPositiveFeedbackReason('matched_request')).toBe(true);
      expect(isPositiveFeedbackReason('fast')).toBe(true);
    });

    it('returns false for negative reasons', () => {
      expect(isPositiveFeedbackReason('quality_issues')).toBe(false);
      expect(isPositiveFeedbackReason('doesnt_match_request')).toBe(false);
      expect(isPositiveFeedbackReason('product_not_visible')).toBe(false);
      expect(isPositiveFeedbackReason('wrong_style')).toBe(false);
      expect(isPositiveFeedbackReason('background_problems')).toBe(false);
      expect(isPositiveFeedbackReason('other')).toBe(false);
    });

    it('returns false for invalid values', () => {
      expect(isPositiveFeedbackReason('invalid')).toBe(false);
      expect(isPositiveFeedbackReason(123)).toBe(false);
      expect(isPositiveFeedbackReason(null)).toBe(false);
      expect(isPositiveFeedbackReason(undefined)).toBe(false);
      expect(isPositiveFeedbackReason({})).toBe(false);
    });
  });

  describe('isNegativeFeedbackReason', () => {
    it('returns true for valid negative reasons', () => {
      expect(isNegativeFeedbackReason('quality_issues')).toBe(true);
      expect(isNegativeFeedbackReason('doesnt_match_request')).toBe(true);
      expect(isNegativeFeedbackReason('product_not_visible')).toBe(true);
      expect(isNegativeFeedbackReason('wrong_style')).toBe(true);
      expect(isNegativeFeedbackReason('background_problems')).toBe(true);
      expect(isNegativeFeedbackReason('other')).toBe(true);
    });

    it('returns false for positive reasons', () => {
      expect(isNegativeFeedbackReason('great_quality')).toBe(false);
      expect(isNegativeFeedbackReason('matched_request')).toBe(false);
      expect(isNegativeFeedbackReason('fast')).toBe(false);
    });

    it('returns false for invalid values', () => {
      expect(isNegativeFeedbackReason('invalid')).toBe(false);
      expect(isNegativeFeedbackReason(123)).toBe(false);
      expect(isNegativeFeedbackReason(null)).toBe(false);
      expect(isNegativeFeedbackReason(undefined)).toBe(false);
      expect(isNegativeFeedbackReason({})).toBe(false);
    });
  });

  describe('areValidReasonsForType', () => {
    it('validates positive reasons array', () => {
      expect(areValidReasonsForType(['great_quality', 'fast'], 'positive')).toBe(true);
      expect(areValidReasonsForType(['great_quality'], 'positive')).toBe(true);
      expect(areValidReasonsForType([], 'positive')).toBe(true);
      expect(areValidReasonsForType(['quality_issues'], 'positive')).toBe(false);
      expect(areValidReasonsForType(['great_quality', 'invalid'], 'positive')).toBe(false);
    });

    it('validates negative reasons array', () => {
      expect(areValidReasonsForType(['quality_issues', 'other'], 'negative')).toBe(true);
      expect(areValidReasonsForType(['doesnt_match_request'], 'negative')).toBe(true);
      expect(areValidReasonsForType([], 'negative')).toBe(true);
      expect(areValidReasonsForType(['great_quality'], 'negative')).toBe(false);
      expect(areValidReasonsForType(['quality_issues', 'invalid'], 'negative')).toBe(false);
    });

    it('returns false for non-array input', () => {
      expect(areValidReasonsForType('not-array' as any, 'positive')).toBe(false);
      expect(areValidReasonsForType(null as any, 'positive')).toBe(false);
      expect(areValidReasonsForType(undefined as any, 'positive')).toBe(false);
      expect(areValidReasonsForType(123 as any, 'positive')).toBe(false);
    });

    it('returns false for invalid feedback type', () => {
      expect(areValidReasonsForType(['great_quality'], 'invalid' as any)).toBe(false);
    });
  });
});