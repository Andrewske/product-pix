import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { NextRequest, NextResponse } from 'next/server';
import { User } from '@supabase/supabase-js';
import { middleware } from '@/middleware';

// Mock the supabase server client
const mockCreateClient = mock(async () => null);
mock.module('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}));

describe('middleware', () => {
  let mockSupabaseClient: {
    auth: {
      getUser: ReturnType<typeof mock<() => Promise<{ data: { user: User | null }; error: { message: string } | null }>>>;
    };
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          single: ReturnType<typeof mock<() => Promise<{ data: { is_admin: boolean } | null; error: { message: string } | null }>>>;
        };
      };
    };
  };
  let mockUser: User;
  let mockGetUser: ReturnType<typeof mock<() => Promise<{ data: { user: User | null }; error: { message: string } | null }>>>;
  let mockSelect: ReturnType<typeof mock>;
  let mockEq: ReturnType<typeof mock>;
  let mockSingle: ReturnType<typeof mock<() => Promise<{ data: { is_admin: boolean } | null; error: { message: string } | null }>>>;

  beforeEach(() => {
    mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    } as User;

    mockGetUser = mock(() => Promise.resolve({ data: { user: null }, error: null }));
    mockSingle = mock(() => Promise.resolve({ data: null, error: null }));

    mockEq = mock(() => ({ single: mockSingle }));
    mockSelect = mock(() => ({ eq: mockEq }));

    mockSupabaseClient = {
      auth: {
        getUser: mockGetUser,
      },
      from: mock(() => ({ select: mockSelect })),
    };

    mockCreateClient.mockReset();
    mockCreateClient.mockResolvedValue(mockSupabaseClient);
  });

  afterEach(() => {
    mockCreateClient.mockReset();
    mockGetUser.mockReset();
    mockSingle.mockReset();
  });

  it('should allow non-admin routes to pass through', async () => {
    const request = new NextRequest('http://localhost/dashboard');

    const response = await middleware(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it('should redirect unauthenticated users to login for admin routes', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const request = new NextRequest('http://localhost/admin/refunds');

    const response = await middleware(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/login?redirect=%2Fadmin%2Frefunds');
    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    expect(mockGetUser).toHaveBeenCalledTimes(1);
  });

  it('should redirect authenticated non-admin users to home for admin routes', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: { is_admin: false },
      error: null,
    });

    const request = new NextRequest('http://localhost/admin/refunds');

    const response = await middleware(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/');
    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(mockSingle).toHaveBeenCalledTimes(1);
  });

  it('should allow authenticated admin users to access admin routes', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: { is_admin: true },
      error: null,
    });

    const request = new NextRequest('http://localhost/admin/refunds');

    const response = await middleware(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);
    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(mockSingle).toHaveBeenCalledTimes(1);
  });

  it('should redirect to login when authentication fails with error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' } as const,
    });

    const request = new NextRequest('http://localhost/admin/refunds');

    const response = await middleware(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/login?redirect=%2Fadmin%2Frefunds');
  });

  it('should redirect to home when user profile query fails', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'Database error' } as const,
    });

    const request = new NextRequest('http://localhost/admin/refunds');

    const response = await middleware(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/');
  });

  it('should redirect to home when createClient throws', async () => {
    mockCreateClient.mockRejectedValue(new Error('Connection failed'));

    const request = new NextRequest('http://localhost/admin/refunds');

    const response = await middleware(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/');
  });
});