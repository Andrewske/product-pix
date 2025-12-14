import { describe, it, expect, mock, beforeEach } from 'bun:test';

// Mock Supabase before importing
const mockSupabase = {
  from: mock(() => ({
    upsert: mock(() => ({
      select: mock(() => ({
        single: mock(() => Promise.resolve({
          data: {
            id: 'feedback-123',
            image_id: 'image-123',
            user_id: 'user-123',
            feedback_type: 'positive',
            reasons: ['great_quality'],
            comment: null,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
          error: null
        }))
      }))
    })),
    select: mock(() => ({
      eq: mock(() => ({
        eq: mock(() => ({
          single: mock(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } }))
        }))
      }))
    })),
    delete: mock(() => ({
      eq: mock(() => ({
        eq: mock(() => Promise.resolve({ error: null }))
      }))
    }))
  }))
};

mock.module('@/lib/supabase/admin', () => ({
  createAdminClient: mock(() => mockSupabase)
}));

// Import after mocking
const { submitFeedback, getFeedbackForImage, deleteFeedback } = await import('../feedback');

describe('Feedback Database Functions', () => {
  beforeEach(() => {
    mockSupabase.from.mockClear();
  });

  describe('submitFeedback', () => {
    it('submits feedback and returns mapped result', async () => {
      const result = await submitFeedback('user-123', {
        imageId: 'image-123',
        feedbackType: 'positive',
        reasons: ['great_quality'],
      });

      expect(result).not.toBeNull();
      expect(result?.id).toBe('feedback-123');
      expect(result?.imageId).toBe('image-123');
      expect(result?.userId).toBe('user-123');
      expect(result?.feedbackType).toBe('positive');
      expect(result?.reasons).toEqual(['great_quality']);
      expect(result?.comment).toBeNull();
      expect(result?.createdAt).toBe('2025-01-01T00:00:00Z');
      expect(result?.updatedAt).toBe('2025-01-01T00:00:00Z');
    });

    it('handles feedback with comment', async () => {
      mockSupabase.from.mockReturnValueOnce({
        upsert: () => ({
          select: () => ({
            single: () => Promise.resolve({
              data: {
                id: 'feedback-456',
                image_id: 'image-456',
                user_id: 'user-456',
                feedback_type: 'negative',
                reasons: ['quality_issues'],
                comment: 'Poor quality image',
                created_at: '2025-01-02T00:00:00Z',
                updated_at: '2025-01-02T00:00:00Z',
              },
              error: null
            })
          })
        })
      } as any);

      const result = await submitFeedback('user-456', {
        imageId: 'image-456',
        feedbackType: 'negative',
        reasons: ['quality_issues'],
        comment: 'Poor quality image',
      });

      expect(result).not.toBeNull();
      expect(result?.feedbackType).toBe('negative');
      expect(result?.comment).toBe('Poor quality image');
    });

    it('returns null on database error', async () => {
      mockSupabase.from.mockReturnValueOnce({
        upsert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'DB error' } })
          })
        })
      } as any);

      const result = await submitFeedback('user-123', {
        imageId: 'image-123',
        feedbackType: 'positive',
        reasons: [],
      });

      expect(result).toBeNull();
    });
  });

  describe('getFeedbackForImage', () => {
    it('returns null when no feedback exists (PGRST116)', async () => {
      const result = await getFeedbackForImage('image-123', 'user-123');
      expect(result).toBeNull();
    });

    it('returns mapped feedback when it exists', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: {
                  id: 'feedback-789',
                  image_id: 'image-789',
                  user_id: 'user-789',
                  feedback_type: 'positive',
                  reasons: ['fast', 'matched_request'],
                  comment: 'Great work!',
                  created_at: '2025-01-03T00:00:00Z',
                  updated_at: '2025-01-03T00:00:00Z',
                },
                error: null
              })
            })
          })
        })
      } as any);

      const result = await getFeedbackForImage('image-789', 'user-789');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('feedback-789');
      expect(result?.feedbackType).toBe('positive');
      expect(result?.reasons).toEqual(['fast', 'matched_request']);
      expect(result?.comment).toBe('Great work!');
    });

    it('returns null on database error', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: { message: 'DB error' } })
            })
          })
        })
      } as any);

      const result = await getFeedbackForImage('image-123', 'user-123');
      expect(result).toBeNull();
    });
  });

  describe('deleteFeedback', () => {
    it('returns true on successful delete', async () => {
      const result = await deleteFeedback('image-123', 'user-123');
      expect(result).toBe(true);
    });

    it('returns false on database error', async () => {
      mockSupabase.from.mockReturnValueOnce({
        delete: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: { message: 'DB error' } })
          })
        })
      } as any);

      const result = await deleteFeedback('image-123', 'user-123');
      expect(result).toBe(false);
    });
  });
});