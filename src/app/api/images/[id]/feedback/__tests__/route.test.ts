import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { NextRequest } from 'next/server';

// Mock auth
const mockSupabase = {
  auth: {
    getUser: mock(() => Promise.resolve({ data: { user: { id: 'user-123' } } } as any))
  },
  from: mock(() => ({
    select: mock(() => ({
      eq: mock(() => ({
        single: mock(() => Promise.resolve({
          data: { user_id: 'user-123' },
          error: null
        }) as any)
      }) as any)
    }) as any)
  }) as any)
} as any;

mock.module('@/lib/supabase/server', () => ({
  createClient: mock(() => mockSupabase)
}));

// Mock database functions
const mockSubmitFeedback = mock(() => Promise.resolve({
  id: 'feedback-123',
  imageId: 'image-123',
  userId: 'user-123',
  feedbackType: 'positive' as const,
  reasons: [],
  comment: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
} as any));
const mockGetFeedbackForImage = mock(() => Promise.resolve(null) as any);
const mockDeleteFeedback = mock(() => Promise.resolve(true));

mock.module('@/lib/db/feedback', () => ({
  submitFeedback: mockSubmitFeedback,
  getFeedbackForImage: mockGetFeedbackForImage,
  deleteFeedback: mockDeleteFeedback,
}));

// Mock validation
const mockAreValidReasonsForType = mock(() => true);
const mockIsPositiveFeedbackReason = mock(() => true);
const mockIsNegativeFeedbackReason = mock(() => true);
mock.module('@/lib/validation/feedback', () => ({
  areValidReasonsForType: mockAreValidReasonsForType,
  isPositiveFeedbackReason: mockIsPositiveFeedbackReason,
  isNegativeFeedbackReason: mockIsNegativeFeedbackReason,
}));

// Import after mocking
const { POST, GET, DELETE } = await import('../route');

describe('Feedback API Route', () => {
  beforeEach(() => {
    mockSupabase.auth.getUser.mockClear();
    mockSupabase.from.mockClear();
    mockSubmitFeedback.mockClear();
    mockGetFeedbackForImage.mockClear();
    mockDeleteFeedback.mockClear();
    mockAreValidReasonsForType.mockClear();
  });

  describe('POST /api/images/[id]/feedback', () => {
    it('submits positive feedback successfully', async () => {
      const mockRequest = new NextRequest('http://localhost/api/images/image-123/feedback', {
        method: 'POST',
        body: JSON.stringify({
          feedbackType: 'positive',
          reasons: ['great_quality'],
        }),
      });

      const response = await POST(mockRequest, { params: Promise.resolve({ id: 'image-123' }) });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.id).toBe('feedback-123');
      expect(mockSubmitFeedback).toHaveBeenCalledWith('user-123', {
        imageId: 'image-123',
        feedbackType: 'positive',
        reasons: ['great_quality'],
        comment: undefined,
      });
    });

    it('submits negative feedback with comment', async () => {
      const mockRequest = new NextRequest('http://localhost/api/images/image-456/feedback', {
        method: 'POST',
        body: JSON.stringify({
          feedbackType: 'negative',
          reasons: ['quality_issues'],
          comment: 'Poor quality image',
        }),
      });

      const response = await POST(mockRequest, { params: Promise.resolve({ id: 'image-456' }) });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(mockSubmitFeedback).toHaveBeenCalledWith('user-123', {
        imageId: 'image-456',
        feedbackType: 'negative',
        reasons: ['quality_issues'],
        comment: 'Poor quality image',
      });
    });

    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });

      const mockRequest = new NextRequest('http://localhost/api/images/image-123/feedback', {
        method: 'POST',
        body: JSON.stringify({
          feedbackType: 'positive',
          reasons: [],
        }),
      });

      const response = await POST(mockRequest, { params: Promise.resolve({ id: 'image-123' }) });
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.error).toBe('Unauthorized');
    });

    it('returns 403 when user does not own the image', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: { user_id: 'different-user' },
              error: null
            })
          })
        })
      } as any);

      const mockRequest = new NextRequest('http://localhost/api/images/image-123/feedback', {
        method: 'POST',
        body: JSON.stringify({
          feedbackType: 'positive',
          reasons: [],
        }),
      });

      const response = await POST(mockRequest, { params: Promise.resolve({ id: 'image-123' }) } as any);
      const result = await response.json();

      expect(response.status).toBe(403);
      expect(result.error).toBe('Forbidden');
    });

    it('returns 400 for invalid reasons', async () => {
      mockAreValidReasonsForType.mockReturnValueOnce(false);

      const mockRequest = new NextRequest('http://localhost/api/images/image-123/feedback', {
        method: 'POST',
        body: JSON.stringify({
          feedbackType: 'positive',
          reasons: ['invalid_reason'],
        }),
      });

      const response = await POST(mockRequest, { params: Promise.resolve({ id: 'image-123' }) });
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toContain('Invalid reasons');
    });

    it('returns 400 for invalid JSON', async () => {
      const mockRequest = new NextRequest('http://localhost/api/images/image-123/feedback', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(mockRequest, { params: Promise.resolve({ id: 'image-123' }) });
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Invalid JSON');
    });

    it('returns 400 for invalid request body', async () => {
      const mockRequest = new NextRequest('http://localhost/api/images/image-123/feedback', {
        method: 'POST',
        body: JSON.stringify({
          invalidField: 'value',
        }),
      });

      const response = await POST(mockRequest, { params: Promise.resolve({ id: 'image-123' }) });
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Validation failed');
    });

    it('returns 400 when comment exceeds 500 characters', async () => {
      const longComment = 'a'.repeat(501); // 501 characters

      const mockRequest = new NextRequest('http://localhost/api/images/image-123/feedback', {
        method: 'POST',
        body: JSON.stringify({
          feedbackType: 'negative',
          reasons: ['quality_issues'],
          comment: longComment,
        }),
      });

      const response = await POST(mockRequest, { params: Promise.resolve({ id: 'image-123' }) });
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Validation failed');
      expect(result.details[0].message).toContain('Too big');
    });

    it('returns 500 when feedback submission fails', async () => {
      mockSubmitFeedback.mockResolvedValueOnce(null);

      const mockRequest = new NextRequest('http://localhost/api/images/image-123/feedback', {
        method: 'POST',
        body: JSON.stringify({
          feedbackType: 'positive',
          reasons: [],
        }),
      });

      const response = await POST(mockRequest, { params: Promise.resolve({ id: 'image-123' }) });
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe('Failed to submit feedback');
    });
  });

  describe('GET /api/images/[id]/feedback', () => {
    it('returns feedback when it exists', async () => {
      const mockFeedback = {
        id: 'feedback-123',
        imageId: 'image-123',
        userId: 'user-123',
        feedbackType: 'positive' as const,
        reasons: ['great_quality'],
        comment: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };
      mockGetFeedbackForImage.mockResolvedValueOnce(mockFeedback);

      const mockRequest = new NextRequest('http://localhost/api/images/image-123/feedback');
      const response = await GET(mockRequest, { params: Promise.resolve({ id: 'image-123' }) });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result).toEqual(mockFeedback);
      expect(mockGetFeedbackForImage).toHaveBeenCalledWith('image-123', 'user-123');
    });

    it('returns null when no feedback exists', async () => {
      const mockRequest = new NextRequest('http://localhost/api/images/image-123/feedback');
      const response = await GET(mockRequest, { params: Promise.resolve({ id: 'image-123' }) });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result).toBeNull();
    });

    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });

      const mockRequest = new NextRequest('http://localhost/api/images/image-123/feedback');
      const response = await GET(mockRequest, { params: Promise.resolve({ id: 'image-123' }) });
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.error).toBe('Unauthorized');
    });

    it('returns 403 when user does not own the image', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: { user_id: 'different-user' },
              error: null
            })
          })
        })
      });

      const mockRequest = new NextRequest('http://localhost/api/images/image-123/feedback');
      const response = await GET(mockRequest, { params: Promise.resolve({ id: 'image-123' }) });
      const result = await response.json();

      expect(response.status).toBe(403);
      expect(result.error).toBe('Forbidden');
    });
  });

  describe('DELETE /api/images/[id]/feedback', () => {
    it('deletes feedback successfully', async () => {
      const mockRequest = new NextRequest('http://localhost/api/images/image-123/feedback', {
        method: 'DELETE',
      });

      const response = await DELETE(mockRequest, { params: Promise.resolve({ id: 'image-123' }) });

      expect(response.status).toBe(204);
      expect(mockDeleteFeedback).toHaveBeenCalledWith('image-123', 'user-123');
    });

    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });

      const mockRequest = new NextRequest('http://localhost/api/images/image-123/feedback', {
        method: 'DELETE',
      });

      const response = await DELETE(mockRequest, { params: Promise.resolve({ id: 'image-123' }) });
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.error).toBe('Unauthorized');
    });

    it('returns 403 when user does not own the image', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: { user_id: 'different-user' },
              error: null
            })
          })
        })
      });

      const mockRequest = new NextRequest('http://localhost/api/images/image-123/feedback', {
        method: 'DELETE',
      });

      const response = await DELETE(mockRequest, { params: Promise.resolve({ id: 'image-123' }) });
      const result = await response.json();

      expect(response.status).toBe(403);
      expect(result.error).toBe('Forbidden');
    });

    it('returns 500 when deletion fails', async () => {
      mockDeleteFeedback.mockResolvedValueOnce(false);

      const mockRequest = new NextRequest('http://localhost/api/images/image-123/feedback', {
        method: 'DELETE',
      });

      const response = await DELETE(mockRequest, { params: Promise.resolve({ id: 'image-123' }) });
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe('Failed to delete feedback');
    });
  });
});