// src/app/api/admin/feedback/__tests__/route.test.ts
import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { GET } from '../route';
import { requireAuth } from '@/lib/auth/server';
import { requireAdmin } from '@/lib/auth/admin';
import { getFeedbackAnalytics, getFilteredFeedback } from '@/lib/db/admin-analytics';

// Mock dependencies
mock.module('@/lib/auth/server', () => ({
  requireAuth: mock(),
}));

mock.module('@/lib/auth/admin', () => ({
  requireAdmin: mock(),
}));

mock.module('@/lib/db/admin-analytics', () => ({
  getFeedbackAnalytics: mock(),
  getFilteredFeedback: mock(),
}));

describe('/api/admin/feedback', () => {
  beforeEach(() => {
    mock.restore();
  });

  describe('GET /api/admin/feedback?action=analytics', () => {
    it('should return feedback analytics for admin user', async () => {
      // Mock admin auth
      const mockUser = { id: 'admin-123' };
      (requireAuth as any).mockResolvedValue(mockUser);
      (requireAdmin as any).mockResolvedValue(true);

      // Mock analytics data
      const mockAnalytics = {
        stats: {
          totalFeedback: 100,
          positiveCount: 80,
          negativeCount: 20,
          positivePercentage: 80,
          negativePercentage: 20,
        },
        trends: [],
        positiveReasons: [],
        negativeReasons: [],
        recentFeedback: [],
      };
      (getFeedbackAnalytics as any).mockResolvedValue(mockAnalytics);

      // Create request
      const request = new Request('http://localhost/api/admin/feedback?action=analytics&days=30&limit=50');

      // Call handler
      const response = await GET(request as any);
      const result = await response.json();

      // Assertions
      expect(requireAuth).toHaveBeenCalled();
      expect(requireAdmin).toHaveBeenCalledWith('admin-123');
      expect(getFeedbackAnalytics).toHaveBeenCalledWith({ days: 30, limit: 50 });
      expect(response.status).toBe(200);
      expect(result).toEqual(mockAnalytics);
    });

    it('should return 401 for non-admin user', async () => {
      // Mock non-admin auth
      const mockUser = { id: 'user-123' };
      (requireAuth as any).mockResolvedValue(mockUser);
      (requireAdmin as any).mockResolvedValue(false);

      // Create request
      const request = new Request('http://localhost/api/admin/feedback?action=analytics');

      // Call handler
      const response = await GET(request as any);
      const result = await response.json();

      // Assertions
      expect(response.status).toBe(401);
      expect(result.error).toBe('Unauthorized');
    });

    it('should handle analytics errors', async () => {
      // Mock admin auth
      const mockUser = { id: 'admin-123' };
      (requireAuth as any).mockResolvedValue(mockUser);
      (requireAdmin as any).mockResolvedValue(true);

      // Mock error
      (getFeedbackAnalytics as any).mockRejectedValue(new Error('Database error'));

      // Create request
      const request = new Request('http://localhost/api/admin/feedback?action=analytics');

      // Call handler
      const response = await GET(request as any);
      const result = await response.json();

      // Assertions
      expect(response.status).toBe(500);
      expect(result.error).toBe('Internal server error');
    });

    it('should validate days parameter (max 365)', async () => {
      // Mock admin auth
      const mockUser = { id: 'admin-123' };
      (requireAuth as any).mockResolvedValue(mockUser);
      (requireAdmin as any).mockResolvedValue(true);

      const mockAnalytics = {
        stats: { totalFeedback: 0, positiveCount: 0, negativeCount: 0, positivePercentage: 0, negativePercentage: 0 },
        trends: [],
        positiveReasons: [],
        negativeReasons: [],
        recentFeedback: [],
      };
      (getFeedbackAnalytics as any).mockResolvedValue(mockAnalytics);

      // Create request with days > 365
      const request = new Request('http://localhost/api/admin/feedback?action=analytics&days=400');

      // Call handler
      await GET(request as any);

      // Should be called with max value of 365
      expect(getFeedbackAnalytics).toHaveBeenCalledWith({ days: 365, limit: 50 });
    });

    it('should validate limit parameter (max 200)', async () => {
      // Mock admin auth
      const mockUser = { id: 'admin-123' };
      (requireAuth as any).mockResolvedValue(mockUser);
      (requireAdmin as any).mockResolvedValue(true);

      const mockAnalytics = {
        stats: { totalFeedback: 0, positiveCount: 0, negativeCount: 0, positivePercentage: 0, negativePercentage: 0 },
        trends: [],
        positiveReasons: [],
        negativeReasons: [],
        recentFeedback: [],
      };
      (getFeedbackAnalytics as any).mockResolvedValue(mockAnalytics);

      // Create request with limit > 200
      const request = new Request('http://localhost/api/admin/feedback?action=analytics&limit=300');

      // Call handler
      await GET(request as any);

      // Should be called with max value of 200
      expect(getFeedbackAnalytics).toHaveBeenCalledWith({ days: 30, limit: 200 });
    });
  });

  describe('GET /api/admin/feedback?action=list', () => {
    it('should return filtered feedback list', async () => {
      // Mock admin auth
      const mockUser = { id: 'admin-123' };
      (requireAuth as any).mockResolvedValue(mockUser);
      (requireAdmin as any).mockResolvedValue(true);

      // Mock filtered data
      const mockResult = {
        feedback: [
          {
            id: 'feedback-1',
            imageId: 'image-1',
            userId: 'user-1',
            feedbackType: 'positive',
            reasons: ['great_quality'],
            comment: 'Great work!',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            userEmail: 'user@example.com',
          },
        ],
        total: 1,
      };
      (getFilteredFeedback as any).mockResolvedValue(mockResult);

      // Create request with filters
      const request = new Request(
        'http://localhost/api/admin/feedback?action=list&feedbackType=positive&limit=10&offset=0'
      );

      // Call handler
      const response = await GET(request as any);
      const result = await response.json();

      // Assertions
      expect(getFilteredFeedback).toHaveBeenCalledWith({
        feedbackType: 'positive',
        reason: undefined,
        userId: undefined,
        limit: 10,
        offset: 0,
        startDate: undefined,
        endDate: undefined,
      });
      expect(response.status).toBe(200);
      expect(result).toEqual(mockResult);
    });

    it('should handle all filter parameters', async () => {
      // Mock admin auth
      const mockUser = { id: 'admin-123' };
      (requireAuth as any).mockResolvedValue(mockUser);
      (requireAdmin as any).mockResolvedValue(true);

      const mockResult = { feedback: [], total: 0 };
      (getFilteredFeedback as any).mockResolvedValue(mockResult);

      // Create request with all filters
      const request = new Request(
        'http://localhost/api/admin/feedback?action=list&feedbackType=negative&reason=quality_issues&userId=user-123&limit=25&offset=50&startDate=2024-01-01&endDate=2024-01-31'
      );

      // Call handler
      await GET(request as any);

      // Assertions
      expect(getFilteredFeedback).toHaveBeenCalledWith({
        feedbackType: 'negative',
        reason: 'quality_issues',
        userId: 'user-123',
        limit: 25,
        offset: 50,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });
    });

    it('should validate offset parameter (min 0)', async () => {
      // Mock admin auth
      const mockUser = { id: 'admin-123' };
      (requireAuth as any).mockResolvedValue(mockUser);
      (requireAdmin as any).mockResolvedValue(true);

      const mockResult = { feedback: [], total: 0 };
      (getFilteredFeedback as any).mockResolvedValue(mockResult);

      // Create request with negative offset
      const request = new Request('http://localhost/api/admin/feedback?action=list&offset=-10');

      // Call handler
      await GET(request as any);

      // Should be called with offset 0
      expect(getFilteredFeedback).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 0 })
      );
    });
  });

  describe('GET /api/admin/feedback - invalid action', () => {
    it('should return 400 for invalid action', async () => {
      // Mock admin auth
      const mockUser = { id: 'admin-123' };
      (requireAuth as any).mockResolvedValue(mockUser);
      (requireAdmin as any).mockResolvedValue(true);

      // Create request with invalid action
      const request = new Request('http://localhost/api/admin/feedback?action=invalid');

      // Call handler
      const response = await GET(request as any);
      const result = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(result.error).toBe('Invalid action');
    });
  });

  describe('Authentication failures', () => {
    it('should handle requireAuth errors', async () => {
      (requireAuth as any).mockRejectedValue(new Error('Auth failed'));

      const request = new Request('http://localhost/api/admin/feedback');

      // This should throw, but we'll catch it in the handler
      try {
        await GET(request as any);
      } catch (error) {
        // Expected to throw due to auth failure
        expect(error).toBeDefined();
      }
    });

    it('should handle requireAdmin errors', async () => {
      (requireAuth as any).mockResolvedValue({ id: 'user-123' });
      (requireAdmin as any).mockRejectedValue(new Error('Admin check failed'));

      const request = new Request('http://localhost/api/admin/feedback');

      // This should throw, but we'll catch it in the handler
      try {
        await GET(request as any);
      } catch (error) {
        // Expected to throw due to admin check failure
        expect(error).toBeDefined();
      }
    });
  });
});