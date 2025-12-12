import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { User } from '@supabase/supabase-js';
import { withAuth, AuthenticatedRequest, AuthenticatedHandler } from '@/lib/auth/api-middleware';

// Mock the supabase server client
const mockCreateClient = mock(async () => null);
mock.module('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}));

describe('withAuth', () => {
  let mockSupabaseClient: {
    auth: {
      getUser: ReturnType<typeof mock<() => Promise<{ data: { user: User | null }; error: { message: string } | null }>>>;
    };
  };
  let mockUser: User;
  let mockRequest: NextRequest;
  let mockParams: { id: string };
  let mockGetUser: ReturnType<typeof mock<() => Promise<{ data: { user: User | null }; error: { message: string } | null }>>>;

  beforeEach(() => {
    mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    } as User;

    mockGetUser = mock(() => Promise.resolve({ data: { user: null }, error: null }));

    mockSupabaseClient = {
      auth: {
        getUser: mockGetUser,
      },
    };

    mockCreateClient.mockReset();
    mockCreateClient.mockResolvedValue(mockSupabaseClient as any);

    mockRequest = new NextRequest('http://localhost/api/test');
    mockParams = { id: 'test-id' };
  });

  afterEach(() => {
    mockCreateClient.mockReset();
    mockGetUser.mockReset();
  });

  it('should call handler with authenticated user when user is authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockHandler = mock(() => Promise.resolve(NextResponse.json({ success: true })));

    const wrappedHandler = withAuth(mockHandler as unknown as AuthenticatedHandler);
    const response = await wrappedHandler(mockRequest, { params: Promise.resolve(mockParams) });

    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(mockHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        user: mockUser,
        url: mockRequest.url,
      }),
      { params: mockParams }
    );
    expect(response.status).toBe(200);
  });

  it('should return 401 when getUser returns error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Invalid token') as any,
    });

    const mockHandler = mock(() => Promise.resolve(NextResponse.json({ success: true })));

    const wrappedHandler = withAuth(mockHandler as unknown as AuthenticatedHandler);
    const response = await wrappedHandler(mockRequest, { params: Promise.resolve(mockParams) });

    expect(mockHandler).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('should return 401 when user is null', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const mockHandler = mock(() => Promise.resolve(NextResponse.json({ success: true })));

    const wrappedHandler = withAuth(mockHandler as unknown as AuthenticatedHandler);
    const response = await wrappedHandler(mockRequest, { params: Promise.resolve(mockParams) });

    expect(mockHandler).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('should return 401 when createClient throws', async () => {
    mockCreateClient.mockRejectedValue(new Error('Connection failed'));

    const mockHandler = mock(() => Promise.resolve(NextResponse.json({ success: true })));

    const wrappedHandler = withAuth(mockHandler as unknown as AuthenticatedHandler);
    const response = await wrappedHandler(mockRequest, { params: Promise.resolve(mockParams) });

    expect(mockHandler).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: 'Authentication failed' });
  });

  it('should return 401 when getUser throws', async () => {
    mockGetUser.mockRejectedValue(new Error('Database error'));

    const mockHandler = mock(() => Promise.resolve(NextResponse.json({ success: true })));

    const wrappedHandler = withAuth(mockHandler as unknown as AuthenticatedHandler);
    const response = await wrappedHandler(mockRequest, { params: Promise.resolve(mockParams) });

    expect(mockHandler).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: 'Authentication failed' });
  });

  it('should support custom params type', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    type CustomParams = { batchId: string; action: string };
    const customParams: CustomParams = { batchId: 'batch-123', action: 'cancel' };

    const mockHandler = mock(() => Promise.resolve(NextResponse.json({ success: true })));

    const wrappedHandler = withAuth<CustomParams>(mockHandler as unknown as AuthenticatedHandler<CustomParams>);
    const response = await wrappedHandler(mockRequest, { params: Promise.resolve(customParams) });

    expect(mockHandler).toHaveBeenCalledWith(
      expect.objectContaining({ user: mockUser }),
      { params: customParams }
    );
    expect(response.status).toBe(200);
  });

  it('should preserve request properties on authenticated request', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockHandler = mock((request: AuthenticatedRequest) => {
      // Verify the request has both original properties and user
      expect(request.url).toBe(mockRequest.url);
      expect(request.method).toBe(mockRequest.method);
      expect(request.user).toBe(mockUser);
      return NextResponse.json({ userId: request.user.id });
    });

    const wrappedHandler = withAuth(mockHandler as unknown as AuthenticatedHandler);
    const response = await wrappedHandler(mockRequest, { params: Promise.resolve(mockParams) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ userId: mockUser.id });
  });
});
