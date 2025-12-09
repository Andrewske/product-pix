import { NextRequest, NextResponse } from 'next/server';
import { User } from '@supabase/supabase-js';
import { withAuth, AuthenticatedRequest, AuthenticatedHandler } from '@/lib/auth/api-middleware';

// Mock the supabase server client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

import { createClient } from '@/lib/supabase/server';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('withAuth', () => {
  let mockSupabaseClient: {
    auth: {
      getUser: jest.MockedFunction<() => Promise<{ data: { user: User | null }; error: { message: string } | null }>>;
    };
  };
  let mockUser: User;
  let mockRequest: NextRequest;
  let mockParams: { id: string };

  beforeEach(() => {
    mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    } as User;

    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabaseClient as unknown as ReturnType<typeof createClient>);

    mockRequest = new NextRequest('http://localhost/api/test');
    mockParams = { id: 'test-id' };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call handler with authenticated user when user is authenticated', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockHandler: AuthenticatedHandler = jest.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    );

    const wrappedHandler = withAuth(mockHandler);
    const response = await wrappedHandler(mockRequest, { params: mockParams });

    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledTimes(1);
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
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Invalid token'),
    });

    const mockHandler: AuthenticatedHandler = jest.fn();

    const wrappedHandler = withAuth(mockHandler);
    const response = await wrappedHandler(mockRequest, { params: mockParams });

    expect(mockHandler).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('should return 401 when user is null', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const mockHandler: AuthenticatedHandler = jest.fn();

    const wrappedHandler = withAuth(mockHandler);
    const response = await wrappedHandler(mockRequest, { params: mockParams });

    expect(mockHandler).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('should return 401 when createClient throws', async () => {
    mockCreateClient.mockRejectedValue(new Error('Connection failed'));

    const mockHandler: AuthenticatedHandler = jest.fn();

    const wrappedHandler = withAuth(mockHandler);
    const response = await wrappedHandler(mockRequest, { params: mockParams });

    expect(mockHandler).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: 'Authentication failed' });
  });

  it('should return 401 when getUser throws', async () => {
    mockSupabaseClient.auth.getUser.mockRejectedValue(new Error('Database error'));

    const mockHandler: AuthenticatedHandler = jest.fn();

    const wrappedHandler = withAuth(mockHandler);
    const response = await wrappedHandler(mockRequest, { params: mockParams });

    expect(mockHandler).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: 'Authentication failed' });
  });

  it('should support custom params type', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    type CustomParams = { batchId: string; action: string };
    const customParams: CustomParams = { batchId: 'batch-123', action: 'cancel' };

    const mockHandler: AuthenticatedHandler<CustomParams> = jest.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    );

    const wrappedHandler = withAuth<CustomParams>(mockHandler);
    const response = await wrappedHandler(mockRequest, { params: customParams });

    expect(mockHandler).toHaveBeenCalledWith(
      expect.objectContaining({ user: mockUser }),
      { params: customParams }
    );
    expect(response.status).toBe(200);
  });

  it('should preserve request properties on authenticated request', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockHandler: AuthenticatedHandler = jest.fn().mockImplementation(
      (request: AuthenticatedRequest) => {
        // Verify the request has both original properties and user
        expect(request.url).toBe(mockRequest.url);
        expect(request.method).toBe(mockRequest.method);
        expect(request.user).toBe(mockUser);
        return NextResponse.json({ userId: request.user.id });
      }
    );

    const wrappedHandler = withAuth(mockHandler);
    const response = await wrappedHandler(mockRequest, { params: mockParams });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ userId: mockUser.id });
  });
});