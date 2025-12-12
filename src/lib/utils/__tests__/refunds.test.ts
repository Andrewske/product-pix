import { describe, it, expect } from 'bun:test';
import { formatTimestamp, getReasonLabel } from '../refunds';

describe('refunds utilities', () => {
  describe('formatTimestamp', () => {
    it('formats ISO timestamp to locale string', () => {
      const result = formatTimestamp('2024-01-01T10:00:00Z');
      expect(result).toContain('1/1/2024');
    });
  });

  describe('getReasonLabel', () => {
    it('returns label for poor_quality', () => {
      expect(getReasonLabel('poor_quality')).toBe('Poor Quality');
    });

    it('returns label for wrong_style', () => {
      expect(getReasonLabel('wrong_style')).toBe('Wrong Style');
    });

    it('returns label for technical_issue', () => {
      expect(getReasonLabel('technical_issue')).toBe('Technical Issue');
    });

    it('returns label for other', () => {
      expect(getReasonLabel('other')).toBe('Other');
    });

    it('returns original reason for unknown values', () => {
      expect(getReasonLabel('unknown')).toBe('unknown');
    });
  });
});