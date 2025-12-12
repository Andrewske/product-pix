import { describe, it, expect, mock } from 'bun:test';

// Create mock function that returns a handler function
const mockWithAuth = mock((handler: unknown) => handler);

// Mock the withAuth function
mock.module('@/lib/auth/api-middleware', () => ({
  withAuth: mockWithAuth,
}));

// Dynamic import after mocking
const { POST, GET } = await import('@/app/api/refunds/image/route');

describe('Image Refund Route', () => {
  it('should export POST handler wrapped with withAuth', () => {
    // The POST export should be the result of withAuth(postHandler)
    // withAuth is called during module initialization
    expect(mockWithAuth).toHaveBeenCalled();

    // Verify that POST is defined and is a function
    expect(typeof POST).toBe('function');
  });

  it('should export GET handler wrapped with withAuth', () => {
    // The GET export should be the result of withAuth(getHandler)
    // withAuth is called during module initialization
    expect(mockWithAuth).toHaveBeenCalled();

    // Verify that GET is defined and is a function
    expect(typeof GET).toBe('function');
  });
});