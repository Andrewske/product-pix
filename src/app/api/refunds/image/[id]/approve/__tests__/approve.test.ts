import { describe, it, expect, mock } from 'bun:test';

// Create mock function that returns a handler function
const mockWithAuth = mock((handler: unknown) => handler);

// Mock the withAuth function
mock.module('@/lib/auth/api-middleware', () => ({
  withAuth: mockWithAuth,
}));

// Dynamic import after mocking
const { POST } = await import('@/app/api/refunds/image/[id]/approve/route');

describe('Image Refund Approve Route', () => {
  it('should export POST handler wrapped with withAuth', () => {
    // The POST export should be the result of withAuth(postHandler)
    // withAuth is called during module initialization
    expect(mockWithAuth).toHaveBeenCalled();

    // Verify that POST is defined and is a function
    expect(typeof POST).toBe('function');
  });
});