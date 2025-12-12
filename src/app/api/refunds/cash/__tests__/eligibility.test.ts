import { describe, it, expect, mock } from 'bun:test';

// Mock the auth function with user injection
const mockWithAuth = mock((handler: any) => {
  return async (request: Request) => {
    const authenticatedRequest = Object.assign(request, {
      user: { id: 'user-123' }
    });
    return handler(authenticatedRequest);
  };
});
mock.module('@/lib/auth/api-middleware', () => ({
  withAuth: mockWithAuth,
}));

// Mock the database function
const mockGetEligibleCashRefunds = mock(() => Promise.resolve([]));
mock.module('@/lib/db/refunds', () => ({
  getEligibleCashRefunds: mockGetEligibleCashRefunds,
}));

// Dynamic import after mocking
const { GET } = await import('@/app/api/refunds/cash/eligibility/route');

describe('Cash Refund Eligibility API', () => {
  it('should export GET handler', () => {
    expect(typeof GET).toBe('function');
  });

  it('should call getEligibleCashRefunds with user ID', async () => {
    const mockRequest = new Request('http://localhost/api/refunds/cash/eligibility');
    const response = await GET(mockRequest);

    expect(mockGetEligibleCashRefunds).toHaveBeenCalledWith('user-123');
    expect(response.status).toBe(200);
  });
});