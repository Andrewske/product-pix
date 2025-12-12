import { describe, it, expect, mock } from 'bun:test';

// Mock Stripe client
const mockStripeRefundsCreate = mock(() => Promise.resolve({ id: 'refund-123' }));
mock.module('@/lib/stripe/client', () => ({
  stripe: {
    refunds: {
      create: mockStripeRefundsCreate,
    },
  },
}));

// Dynamic import after mocking
const { createStripeRefund } = await import('@/lib/stripe/refunds');

describe('Stripe Refunds Helper', () => {
  it('should create a Stripe refund with correct parameters', async () => {
    const params = {
      paymentIntentId: 'pi_123',
      amountCents: 500,
      metadata: {
        userId: 'user-123',
        purchaseId: 'purchase-123',
        creditsRefunded: '50',
        percentage: '100',
      },
    };

    const result = await createStripeRefund(params);

    expect(mockStripeRefundsCreate).toHaveBeenCalledWith({
      payment_intent: 'pi_123',
      amount: 500,
      metadata: params.metadata,
    });
    expect(result.id).toBe('refund-123');
  });
});