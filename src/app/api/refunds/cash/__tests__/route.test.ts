import { describe, it, expect, mock } from 'bun:test';
import { NextRequest } from 'next/server';

// Mock the auth function with user injection
const mockWithAuth = mock((handler: any) => {
  return async (request: Request, context?: any) => {
    const authenticatedRequest = Object.assign(request, {
      user: { id: 'user-123' }
    });
    return handler(authenticatedRequest, context);
  };
});
mock.module('@/lib/auth/api-middleware', () => ({
  withAuth: mockWithAuth,
}));

// Mock database and Stripe functions
const mockGetEligibleCashRefunds = mock(() => Promise.resolve([{
  purchaseId: 'purchase-123',
  creditsUnused: 50,
  refundAmount100Cents: 500,
  refundAmount90Cents: 450,
}]));
const mockCreateCashRefundRequest = mock(() => Promise.resolve({ id: 'refund-123' }));

mock.module('@/lib/db/refunds', () => ({
  getEligibleCashRefunds: mockGetEligibleCashRefunds,
  createCashRefundRequest: mockCreateCashRefundRequest,
}));

// Mock Stripe refund
const mockCreateStripeRefund = mock(() => Promise.resolve({ id: 'stripe-refund-123' }));
mock.module('@/lib/stripe/refunds', () => ({
  createStripeRefund: mockCreateStripeRefund,
}));

// Mock admin client
const mockAdminClient = {
  from: mock(() => ({
    select: mock(() => ({
      eq: mock(() => ({
        eq: mock(() => ({
          single: mock(() => Promise.resolve({
            data: {
              stripe_payment_intent_id: 'pi_123',
              credits_granted: 100,
              purchase_credit_ledger: [{ credits_consumed: 25, credits_refunded_image: 25, credits_refunded_cash: 0 }]
            }
          }))
        }))
      }))
    }))
  })),
  rpc: mock(() => Promise.resolve({ error: null }))
};
mock.module('@/lib/supabase/admin', () => ({
  createAdminClient: mock(() => mockAdminClient),
}));

// Dynamic import after mocking
const { POST } = await import('@/app/api/refunds/cash/route');

describe('Cash Refund Request API', () => {
  it('should export POST handler', () => {
    expect(typeof POST).toBe('function');
  });

  it('should process 100% refund successfully', async () => {
    const mockRequest = new NextRequest('http://localhost/api/refunds/cash', {
      method: 'POST',
      body: JSON.stringify({
        purchaseId: 'purchase-123',
        percentage: 100,
      }),
    });

    const response = await POST(mockRequest, { params: Promise.resolve({}) });
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(mockCreateStripeRefund).toHaveBeenCalled();
    expect(mockCreateCashRefundRequest).toHaveBeenCalled();
  });
});