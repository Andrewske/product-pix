import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { renderHook, waitFor } from '@testing-library/react';
import { useMessages } from '../use-messages';

// Mock Supabase Realtime
const mockChannel = {
  on: mock(() => mockChannel),
  subscribe: mock(() => mockChannel),
};

mock.module('@/lib/supabase/client', () => ({
  createClient: () => ({
    channel: mock(() => mockChannel),
    removeChannel: mock(),
  }),
}));

// Mock auth
mock.module('@/lib/auth/hooks', () => ({
  useUser: () => ({ user: { id: 'user-1' } }),
}));

// Mock fetch
const mockFetch = mock((url: string) => {
  if (url === '/api/messages') {
    return Promise.resolve({
      ok: true,
      json: async () => ({ messages: [] }),
    } as Response);
  }
  if (url === '/api/messages/msg-1') {
    return Promise.resolve({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);
  }
  return Promise.reject(new Error('Not found'));
});

global.fetch = mockFetch as any;

describe('useMessages', () => {
  beforeEach(() => {
    mockChannel.on.mockClear();
    mockChannel.subscribe.mockClear();
    (global.fetch as any).mockClear();
  });

  it('fetches messages on mount', async () => {
    const { result } = renderHook(() => useMessages());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(Array.isArray(result.current.messages)).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith('/api/messages');
  });

  it('provides sendMessage function', () => {
    const { result } = renderHook(() => useMessages());
    expect(typeof result.current.sendMessage).toBe('function');
  });

  it('calculates unread count', async () => {
    // Mock fetch to return messages with unread admin message
    const mockFetchImpl = mock((url: string) => {
      if (url === '/api/messages') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            messages: [
              {
                id: '1',
                userId: 'user-1',
                content: 'Admin message',
                isFromAdmin: true,
                readAt: null,
                analysis: null,
                createdAt: '2025-01-01T00:00:00Z',
                updatedAt: '2025-01-01T00:00:00Z',
              }
            ]
          }),
        } as Response);
      }
      return Promise.reject(new Error('Not found'));
    });

    global.fetch = mockFetchImpl as any;

    const { result } = renderHook(() => useMessages());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.unreadCount).toBe(1);
  });

  it('sendMessage posts to API and handles success', async () => {
    (global.fetch as any).mockImplementationOnce((url: string) => {
      if (url === '/api/messages') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: { id: 'new-msg' } }),
        } as Response);
      }
      return Promise.reject(new Error('Not found'));
    });

    const { result } = renderHook(() => useMessages());

    const success = await result.current.sendMessage({ content: 'Test message' });
    expect(success).toBe(true);
    expect(result.current.sending).toBe(false);
  });

  it('sendMessage handles API errors', async () => {
    const mockFetchImpl = mock((url: string) => {
      if (url === '/api/messages') {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: 'API Error' }),
        } as Response);
      }
      return Promise.reject(new Error('Not found'));
    });

    global.fetch = mockFetchImpl as any;

    const { result } = renderHook(() => useMessages());

    const success = await result.current.sendMessage({ content: 'Test message' });
    expect(success).toBe(false);
    expect(result.current.error).toBe('API Error');
  });

  it('markAsRead calls PATCH endpoint', async () => {
    const { result } = renderHook(() => useMessages());

    const success = await result.current.markAsRead('msg-1');
    expect(success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith('/api/messages/msg-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_read' }),
    });
  });

  it('sets up realtime subscription', async () => {
    renderHook(() => useMessages());

    await waitFor(() => {
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_messages',
          filter: 'user_id=eq.user-1',
        },
        expect.any(Function)
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });
  });

  it('cleans up realtime subscription on unmount', () => {
    const mockRemoveChannel = mock();
    mock.module('@/lib/supabase/client', () => ({
      createClient: () => ({
        channel: mock(() => mockChannel),
        removeChannel: mockRemoveChannel,
      }),
    }));

    const { unmount } = renderHook(() => useMessages());

    unmount();

    expect(mockRemoveChannel).toHaveBeenCalled();
  });
});