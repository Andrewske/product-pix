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

// Mock admin client
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
const mockMarkAsRead = mock(() => Promise.resolve(true));

mock.module('@/lib/db/messages', () => ({
  markAsRead: mockMarkAsRead,
}));

// Import after mocking
const { PATCH } = await import('../route');

describe('Individual Message API Route', () => {
  beforeEach(() => {
    mockSupabase.auth.getUser.mockClear();
    mockAdminSupabase.from.mockClear();
    mockMarkAsRead.mockClear();
  });

  describe('PATCH /api/messages/[id]', () => {
    it('marks message as read for admin user', async () => {
      const request = new NextRequest('http://localhost/api/messages/msg-1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'mark_read' }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'msg-1' }) });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(mockMarkAsRead).toHaveBeenCalledWith('msg-1');
    });

    it('rejects unauthenticated requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });

      const request = new NextRequest('http://localhost/api/messages/msg-1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'mark_read' }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'msg-1' }) });
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.error).toBe('Unauthorized');
    });

    it('rejects non-admin users', async () => {
      mockAdminSupabase.from.mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: { is_admin: false },
              error: null
            })
          })
        })
      });

      const request = new NextRequest('http://localhost/api/messages/msg-1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'mark_read' }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'msg-1' }) });
      const result = await response.json();

      expect(response.status).toBe(403);
      expect(result.error).toBe('Forbidden');
    });

    it('returns 400 for invalid action', async () => {
      const request = new NextRequest('http://localhost/api/messages/msg-1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'invalid_action' }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'msg-1' }) });
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Invalid action');
    });

    it('returns 500 when markAsRead fails', async () => {
      mockMarkAsRead.mockResolvedValueOnce(false);

      const request = new NextRequest('http://localhost/api/messages/msg-1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'mark_read' }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'msg-1' }) });
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe('Failed to mark message as read');
    });

    it('handles invalid JSON', async () => {
      const request = new NextRequest('http://localhost/api/messages/msg-1', {
        method: 'PATCH',
        body: 'invalid json',
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'msg-1' }) });
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe('Internal server error');
    });
  });
});