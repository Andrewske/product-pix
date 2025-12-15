import { describe, it, expect, mock, beforeEach } from 'bun:test';

// Mock Supabase before importing
const mockSupabase = {
  from: mock((table: string) => {
    if (table === 'user_messages') {
      return {
        insert: mock(() => ({
          select: mock(() => ({
            single: mock(() => Promise.resolve({
              data: null, // Will be overridden in individual tests
              error: null
            }))
          }))
        })),
        select: mock(() => ({
          eq: mock(() => ({
            order: mock(() => Promise.resolve({
              data: [],
              error: null
            }))
          }))
        })),
        update: mock(() => ({
          eq: mock(() => Promise.resolve({
            error: null
          }))
        }))
      };
    }
    if (table === 'sentiment_analysis_queue') {
      return {
        insert: mock(() => Promise.resolve({
          error: null
        }))
      };
    }
    return {};
  })
} as any;

mock.module('@/lib/supabase/admin', () => ({
  createAdminClient: mock(() => mockSupabase)
}));

// Import after mocking
const { submitMessage, getMessagesForUser, markAsRead, sendAdminReply } = await import('../messages');

describe('Messages Database Functions', () => {
  beforeEach(() => {
    mockSupabase.from.mockClear();
  });

  describe('submitMessage', () => {
    it('creates user message and queues for analysis', async () => {
      // Mock successful insert
      mockSupabase.from.mockReturnValueOnce({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({
              data: {
                id: 'msg-1',
                user_id: 'user-1',
                content: 'Test message',
                is_from_admin: false,
                read_at: null,
                analysis: null,
                created_at: '2025-01-01T00:00:00Z',
                updated_at: '2025-01-01T00:00:00Z',
              },
              error: null
            })
          })
        })
      });

      const result = await submitMessage('user-1', { content: 'Test message' });

      expect(result).not.toBeNull();
      expect(result?.content).toBe('Test message');
      expect(result?.isFromAdmin).toBe(false);
      expect(result?.userId).toBe('user-1');
    });

    it('returns null on database error', async () => {
      mockSupabase.from.mockReturnValueOnce({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      });

      const result = await submitMessage('user-1', { content: 'Test' });
      expect(result).toBeNull();
    });

    it('does not queue short messages for analysis', async () => {
      mockSupabase.from.mockReturnValueOnce({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({
              data: {
                id: 'msg-2',
                user_id: 'user-1',
                content: 'Hi',
                is_from_admin: false,
                read_at: null,
                analysis: null,
                created_at: '2025-01-01T00:00:00Z',
                updated_at: '2025-01-01T00:00:00Z',
              },
              error: null
            })
          })
        })
      });

      const result = await submitMessage('user-1', { content: 'Hi' });

      expect(result).not.toBeNull();
      expect(result?.content).toBe('Hi');
      // Should not have called sentiment_analysis_queue
      expect(mockSupabase.from).toHaveBeenCalledTimes(1); // Only user_messages
    });
  });

  describe('getMessagesForUser', () => {
    it('returns messages in chronological order', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({
              data: [
                {
                  id: 'msg-1',
                  user_id: 'user-1',
                  content: 'First message',
                  is_from_admin: false,
                  read_at: null,
                  analysis: null,
                  created_at: '2025-01-01T00:00:00Z',
                  updated_at: '2025-01-01T00:00:00Z',
                },
                {
                  id: 'msg-2',
                  user_id: 'user-1',
                  content: 'Admin reply',
                  is_from_admin: true,
                  read_at: null,
                  analysis: null,
                  created_at: '2025-01-01T01:00:00Z',
                  updated_at: '2025-01-01T01:00:00Z',
                }
              ],
              error: null
            })
          })
        })
      });

      const messages = await getMessagesForUser('user-1');
      expect(Array.isArray(messages)).toBe(true);
      expect(messages).toHaveLength(2);
      expect(messages[0].content).toBe('First message');
      expect(messages[1].content).toBe('Admin reply');
      expect(messages[1].isFromAdmin).toBe(true);
    });

    it('returns empty array on database error', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      });

      const messages = await getMessagesForUser('user-1');
      expect(messages).toEqual([]);
    });
  });

  describe('markAsRead', () => {
    it('updates read_at timestamp', async () => {
      const result = await markAsRead('msg-1');
      expect(result).toBe(true);
    });

    it('returns false on database error', async () => {
      mockSupabase.from.mockReturnValueOnce({
        update: () => ({
          eq: () => Promise.resolve({
            error: { message: 'Database error' }
          })
        })
      });

      const result = await markAsRead('msg-1');
      expect(result).toBe(false);
    });
  });

  describe('sendAdminReply', () => {
    it('creates admin message', async () => {
      mockSupabase.from.mockReturnValueOnce({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({
              data: {
                id: 'msg-admin',
                user_id: 'user-1',
                content: 'Admin reply',
                is_from_admin: true,
                read_at: null,
                analysis: null,
                created_at: '2025-01-01T01:00:00Z',
                updated_at: '2025-01-01T01:00:00Z',
              },
              error: null
            })
          })
        })
      });

      const result = await sendAdminReply({
        userId: 'user-1',
        content: 'Admin reply',
      });

      expect(result?.isFromAdmin).toBe(true);
      expect(result?.content).toBe('Admin reply');
      expect(result?.userId).toBe('user-1');
    });

    it('returns null on database error', async () => {
      mockSupabase.from.mockReturnValueOnce({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      });

      const result = await sendAdminReply({
        userId: 'user-1',
        content: 'Admin reply',
      });
      expect(result).toBeNull();
    });
  });
});