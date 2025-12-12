import { describe, it, expect } from 'bun:test';
import { createImageRefundRequest, getUserRefundCount, approveImageRefund, getPendingAdminRefunds, approveRefund } from '../refunds';

describe('Refund Utility Functions', () => {
  describe('createImageRefundRequest', () => {
    it('should be a function', () => {
      expect(typeof createImageRefundRequest).toBe('function');
    });
  });

  describe('getUserRefundCount', () => {
    it('should be a function', () => {
      expect(typeof getUserRefundCount).toBe('function');
    });
  });

  describe('approveImageRefund', () => {
    it('should be a function', () => {
      expect(typeof approveImageRefund).toBe('function');
    });
  });

  describe('getPendingAdminRefunds', () => {
    it('should be a function', () => {
      expect(typeof getPendingAdminRefunds).toBe('function');
    });
  });

  describe('approveRefund', () => {
    it('should be a function', () => {
      expect(typeof approveRefund).toBe('function');
    });
  });
});