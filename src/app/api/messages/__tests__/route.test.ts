import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { NextRequest } from 'next/server';

// Mock auth
const mockSupabase = {
  auth: {
    getUser: mock(() => Promise.resolve({ data: { user: { id: 'user-123' } } }))
  }
} as any;

mock.module('@/lib/supabase/server', () => ({
  createClient: mock(() => mockSupabase)
}));

// Mock admin client for individual message route
const mockAdminSupabase = {
  from: mock(() => ({
    select: mock(() => ({
      eq: mock(() => ({
        single: mock(() => Promise.resolve({
          data: { is_admin: true },
          error: null
        }))
      }))
    }))
  }))
} as any;

mock.module('@/lib/supabase/admin', () => ({
  createAdminClient: mock(() => mockAdminSupabase)
}));

// Mock database functions
const mockSubmitMessage = mock(() => Promise.resolve({
  id: 'msg-1',
  userId: 'user-123',
  content: 'Test message',
  isFromAdmin: false,
  readAt: null,
  analysis: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
} as any));
const mockGetMessagesForUser = mock(() => Promise.resolve([] as any[]));
const mockMarkAsRead = mock(() => Promise.resolve(true));

mock.module('@/lib/db/messages', () => ({
  submitMessage: mockSubmitMessage,
  getMessagesForUser: mockGetMessagesForUser,
  markAsRead: mockMarkAsRead,
}));

// Import after mocking
const { POST, GET } = await import('../route');

describe('Messages API Route', () => {
  beforeEach(() => {
    mockSupabase.auth.getUser.mockClear();
    mockSubmitMessage.mockClear();
    mockGetMessagesForUser.mockClear();
  });

  describe('POST /api/messages', () => {
    it('creates message for authenticated user', async () => {
      const request = new NextRequest('http://localhost/api/messages', {
        method: 'POST',
        body: JSON.stringify({ content: 'Test message' }),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.message.content).toBe('Test message');
      expect(mockSubmitMessage).toHaveBeenCalledWith('user-123', { content: 'Test message' });
    });

    it('rejects unauthenticated requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });

      const request = new NextRequest('http://localhost/api/messages', {
        method: 'POST',
        body: JSON.stringify({ content: 'Test message' }),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.error).toBe('Unauthorized');
    });

    it('validates content is required', async () => {
      const request = new NextRequest('http://localhost/api/messages', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Content is required');
    });

    it('validates content is string', async () => {
      const request = new NextRequest('http://localhost/api/messages', {
        method: 'POST',
        body: JSON.stringify({ content: 123 }),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Content is required');
    });

    it('validates content length', async () => {
      const longContent = 'a'.repeat(2001);
      const request = new NextRequest('http://localhost/api/messages', {
        method: 'POST',
        body: JSON.stringify({ content: longContent }),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Content must be 2000 characters or less');
    });

    it('returns 500 when message creation fails', async () => {
      mockSubmitMessage.mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost/api/messages', {
        method: 'POST',
        body: JSON.stringify({ content: 'Test message' }),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe('Failed to submit message');
    });

    it('handles invalid JSON', async () => {
      const request = new NextRequest('http://localhost/api/messages', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe('Internal server error');
    });
  });

  describe('GET /api/messages', () => {
    it('returns messages for authenticated user', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          userId: 'user-123',
          content: 'Test message',
          isFromAdmin: false,
          readAt: null,
          analysis: null,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        }
      ];
      mockGetMessagesForUser.mockResolvedValueOnce(mockMessages);

      const request = new NextRequest('http://localhost/api/messages');
      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.messages).toEqual(mockMessages);
      expect(mockGetMessagesForUser).toHaveBeenCalledWith('user-123');
    });

    it('rejects unauthenticated requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });

      const request = new NextRequest('http://localhost/api/messages');
      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.error).toBe('Unauthorized');
    });
  });
});