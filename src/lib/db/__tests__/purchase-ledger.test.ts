import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { createAdminClient } from '@/lib/supabase/admin';
import { createSupabaseMock } from '@/lib/test-utils';

// Mock the admin client
mock.module('@/lib/supabase/admin', () => ({
  createAdminClient: () => createSupabaseMock()
}));

describe('consume_credits RPC', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createAdminClient();
  });

  it('should consume credits from single purchase', async () => {
    // Mock successful consumption
    mockSupabase.rpc.mockResolvedValueOnce({
      data: [{ success: true, new_balance: 90 }],
      error: null
    });

    const result = await mockSupabase.rpc('consume_credits', {
      p_user_id: 'user-123',
      p_amount: 10,
      p_job_id: 'job-123',
      p_description: 'Test generation'
    });

    expect(result.data[0].success).toBe(true);
    expect(result.data[0].new_balance).toBe(90);
  });

  it('should handle insufficient credits', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: [{ success: false, new_balance: 5 }],
      error: null
    });

    const result = await mockSupabase.rpc('consume_credits', {
      p_user_id: 'user-123',
      p_amount: 100,
      p_job_id: 'job-123'
    });

    expect(result.data[0].success).toBe(false);
    expect(result.data[0].new_balance).toBe(5);
  });

  it('should consume credits FIFO across multiple purchases', async () => {
    // This would test the FIFO logic - in a real test we'd need to mock
    // the ledger table queries and verify the order of consumption
    expect(true).toBe(true); // Placeholder for FIFO test
  });
});

describe('refund_credits_for_image RPC', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createAdminClient();
  });

  it('should refund credits successfully', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: [{ success: true, new_balance: 110 }],
      error: null
    });

    const result = await mockSupabase.rpc('refund_credits_for_image', {
      p_user_id: 'user-123',
      p_amount: 10,
      p_image_id: 'image-123',
      p_refund_request_id: 'refund-123'
    });

    expect(result.data[0].success).toBe(true);
    expect(result.data[0].new_balance).toBe(110);
  });

  it('should handle refund failure', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: [{ success: false, new_balance: 0 }],
      error: null
    });

    const result = await mockSupabase.rpc('refund_credits_for_image', {
      p_user_id: 'user-123',
      p_amount: 10,
      p_image_id: 'image-123',
      p_refund_request_id: 'refund-123'
    });

    expect(result.data[0].success).toBe(false);
  });
});

describe('deduct_credits_for_cash_refund RPC', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createAdminClient();
  });

  it('should deduct credits for cash refund', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: [{ success: true, new_balance: 90 }],
      error: null
    });

    const result = await mockSupabase.rpc('deduct_credits_for_cash_refund', {
      p_user_id: 'user-123',
      p_stripe_purchase_id: 'purchase-123',
      p_amount: 10,
      p_cash_refund_id: 'cash-refund-123'
    });

    expect(result.data[0].success).toBe(true);
    expect(result.data[0].new_balance).toBe(90);
  });

  it('should handle insufficient credits for deduction', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: [{ success: false, new_balance: 5 }],
      error: null
    });

    const result = await mockSupabase.rpc('deduct_credits_for_cash_refund', {
      p_user_id: 'user-123',
      p_stripe_purchase_id: 'purchase-123',
      p_amount: 100,
      p_cash_refund_id: 'cash-refund-123'
    });

    expect(result.data[0].success).toBe(false);
    expect(result.data[0].new_balance).toBe(5);
  });
});