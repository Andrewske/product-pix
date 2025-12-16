import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { GET } from '../route';

// Mock the dependencies
const mockSupabaseClient = {
  from: mock(() => ({
    delete: mock(() => ({
      lt: mock(() => ({
        not: mock(() => ({
          select: mock(() => Promise.resolve({ count: 5, error: null })),
        })),
      })),
    })),
  })),
};

const mockLogger = {
  error: mock(() => {}),
  info: mock(() => {}),
  warn: mock(() => {}),
};

mock.module('@/lib/supabase/admin', () => ({
  createAdminClient: mock(() => mockSupabaseClient),
}));

mock.module('@/lib/logging', () => ({
  logger: mockLogger,
}));

describe('Error Cleanup Cron Route', () => {
  describe('Authentication', () => {
    it('should reject requests without authorization header', async () => {
      const request = new Request('http://localhost/api/cron/cleanup-errors');
      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.error).toBe('Unauthorized');
      expect(mockLogger.warn).toHaveBeenCalledWith('Unauthorized cron job attempt', {
        receivedAuth: 'missing',
        expectedAuth: 'present',
      });
    });

    it('should reject requests with invalid authorization header', async () => {
      const request = new Request('http://localhost/api/cron/cleanup-errors', {
        headers: { authorization: 'Bearer invalid-secret' },
      });
      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.error).toBe('Unauthorized');
      expect(mockLogger.warn).toHaveBeenCalledWith('Unauthorized cron job attempt', {
        receivedAuth: 'present',
        expectedAuth: 'present',
      });
    });

    it('should accept requests with valid authorization header', async () => {
      const request = new Request('http://localhost/api/cron/cleanup-errors', {
        headers: { authorization: 'Bearer test-secret' },
      });
      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
    });
  });

  describe('Successful cleanup', () => {
    it('should return success response with deletion counts', async () => {
      const request = new Request('http://localhost/api/cron/cleanup-errors', {
        headers: { authorization: 'Bearer test-secret' },
      });
      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result).toEqual({
        success: true,
        deleted: {
          critical_errors: 5,
          observability_failures: 5,
        },
        cutoffDate: expect.any(String),
      });
    });

    it('should log successful cleanup', async () => {
      const request = new Request('http://localhost/api/cron/cleanup-errors', {
        headers: { authorization: 'Bearer valid-secret' },
      });
      await GET(request);

      expect(mockLogger.info).toHaveBeenCalledWith('Error cleanup completed', {
        criticalDeleted: 5,
        failuresDeleted: 5,
        cutoffDate: expect.any(String),
      });
    });
  });

  describe('Error handling', () => {
    it('should handle unexpected errors', async () => {
      // Mock an unexpected error
      mockSupabaseClient.from.mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });

      const request = new Request('http://localhost/api/cron/cleanup-errors', {
        headers: { authorization: 'Bearer test-secret' },
      });
      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe('Cleanup failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Error cleanup cron failed', {
        error: 'Unexpected error',
      });
    });
  });
});