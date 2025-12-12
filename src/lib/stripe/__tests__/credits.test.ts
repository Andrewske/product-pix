import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { grantCreditsForPayment } from '../credits';

// Mock the admin client
const mockSupabase = {
  from: mock(() => ({
    insert: mock(() => ({
      select: mock(() => ({
        single: mock(() => Promise.resolve({
          data: { id: 'purchase-123' },
          error: null
        }))
      }))
    })),
    select: mock(() => ({
      eq: mock(() => ({
        single: mock(() => Promise.resolve({
          data: { id: 'purchase-123' },
          error: null
        }))
      }))
    }))
  }))
};

mock.module('@/lib/supabase/admin', () => ({
  createAdminClient: mock(() => mockSupabase)
}));

// Mock addCredits function
mock.module('@/lib/db/credits', () => ({
  addCredits: mock(() => Promise.resolve({ success: true, newBalance: 100 }))
}));

describe('grantCreditsForPayment', () => {
  beforeEach(() => {
    // Reset mocks
    mockSupabase.from.mockClear();
  });

  it('should grant credits for new purchase and create ledger entry', async () => {
    const params = {
      userId: 'user-123',
      paymentIntentId: 'pi_1234567890',
      customerId: 'cus_123',
      credits: 50,
      amountCents: 500,
      purchaseType: 'pack_purchase' as const,
      metadata: { test: true }
    };

    const result = await grantCreditsForPayment(params);

    expect(result.granted).toBe(true);

    // Verify stripe_purchases insert was called
    expect(mockSupabase.from).toHaveBeenCalledWith('stripe_purchases');

    // Verify purchase_credit_ledger insert was called
    expect(mockSupabase.from).toHaveBeenCalledWith('purchase_credit_ledger');
  });

  it('should handle duplicate payment intents gracefully', async () => {
    // Mock unique violation error for stripe_purchases insert
    mockSupabase.from.mockReturnValueOnce({
      insert: () => ({
        select: () => ({
        single: () => Promise.resolve({
          data: null,
          error: { code: '23505' } // POSTGRES_UNIQUE_VIOLATION
        })
        })
      })
    } as any);

    const params = {
      userId: 'user-123',
      paymentIntentId: 'pi_duplicate',
      customerId: 'cus_123',
      credits: 50,
      amountCents: 500,
      purchaseType: 'pack_purchase' as const
    };

    const result = await grantCreditsForPayment(params);

    expect(result.granted).toBe(false);
  });

  it('should throw error on unexpected database errors', async () => {
    // Mock unexpected error for stripe_purchases insert
    mockSupabase.from.mockReturnValueOnce({
      insert: () => ({
        select: () => ({
        single: () => Promise.resolve({
          data: null,
          error: { code: '99999', message: 'Unexpected error' }
        })
        })
      })
    } as any);

    const params = {
      userId: 'user-123',
      paymentIntentId: 'pi_error',
      customerId: 'cus_123',
      credits: 50,
      amountCents: 500,
      purchaseType: 'pack_purchase' as const
    };

    await expect(grantCreditsForPayment(params)).rejects.toThrow();
  });
});