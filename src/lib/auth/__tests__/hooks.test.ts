import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { renderHook, waitFor } from '@testing-library/react';
import { User } from '@supabase/supabase-js';
import { useUserProfile } from '../hooks';
import type { User as DbUser } from '@/types';

// Mock analytics
const mockIdentifyUser = mock(() => {});
const mockResetUser = mock(() => {});

mock.module('@/lib/analytics', () => ({
  identifyUser: mockIdentifyUser,
  resetUser: mockResetUser,
}));

// Mock supabase
const mockSupabaseClient = {
  auth: {
    getUser: mock(),
    onAuthStateChange: mock(() => ({
      data: { subscription: { unsubscribe: mock(() => {}) } },
    })),
  },
  from: mock(),
};

mock.module('@/lib/supabase/client', () => ({
  createClient: mock(() => mockSupabaseClient),
}));

// Mock logger
mock.module('@/lib/logging', () => ({
  logger: {
    error: mock(() => {}),
  },
}));

describe('useUserProfile', () => {
  it('should call identifyUser once when profile loads', async () => {
    const mockUser: User = {
      id: 'user-1',
      email: 'test@example.com',
    } as User;

    const mockProfile: DbUser = {
      id: 'user-1',
      email: 'test@example.com',
      tier: 'free',
      created_at: '2023-01-01T00:00:00Z',
      credit_balance: 100,
      deleted_at: null,
      display_name: null,
      is_admin: false,
      original_email: null,
      preferences: {},
      stripe_customer_id: null,
      updated_at: '2023-01-01T00:00:00Z',
    };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabaseClient.from.mockReturnValue({
      select: mock(() => ({
        eq: mock(() => ({
          maybeSingle: mock(() => Promise.resolve({ data: mockProfile, error: null })),
        })),
      })),
    });

    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => {
      expect(result.current.profile).toBe(mockProfile);
    });

    expect(mockIdentifyUser).toHaveBeenCalledTimes(1);
    expect(mockIdentifyUser).toHaveBeenCalledWith('user-1', {
      email: 'test@example.com',
      tier: 'free',
      created_at: '2023-01-01T00:00:00Z',
    });
  });

  it('should not call identifyUser again on rerenders', async () => {
    const mockUser: User = {
      id: 'user-1',
      email: 'test@example.com',
    } as User;

    const mockProfile: DbUser = {
      id: 'user-1',
      email: 'test@example.com',
      tier: 'free',
      created_at: '2023-01-01T00:00:00Z',
      credit_balance: 100,
      deleted_at: null,
      display_name: null,
      is_admin: false,
      original_email: null,
      preferences: {},
      stripe_customer_id: null,
      updated_at: '2023-01-01T00:00:00Z',
    };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabaseClient.from.mockReturnValue({
      select: mock(() => ({
        eq: mock(() => ({
          maybeSingle: mock(() => Promise.resolve({ data: mockProfile, error: null })),
        })),
      })),
    });

    const { result, rerender } = renderHook(() => useUserProfile());

    await waitFor(() => {
      expect(result.current.profile).toBe(mockProfile);
    });

    expect(mockIdentifyUser).toHaveBeenCalledTimes(1);

    // Rerender
    rerender();

    expect(mockIdentifyUser).toHaveBeenCalledTimes(1);
  });

  it('should call resetUser on logout', async () => {
    const mockUser: User = {
      id: 'user-1',
      email: 'test@example.com',
    } as User;

    const mockProfile: DbUser = {
      id: 'user-1',
      email: 'test@example.com',
      tier: 'free',
      created_at: '2023-01-01T00:00:00Z',
      credit_balance: 100,
      deleted_at: null,
      display_name: null,
      is_admin: false,
      original_email: null,
      preferences: {},
      stripe_customer_id: null,
      updated_at: '2023-01-01T00:00:00Z',
    };

    // First logged in
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    mockSupabaseClient.from.mockReturnValueOnce({
      select: mock(() => ({
        eq: mock(() => ({
          maybeSingle: mock(() => Promise.resolve({ data: mockProfile, error: null })),
        })),
      })),
    });

    const { result, rerender } = renderHook(() => useUserProfile());

    await waitFor(() => {
      expect(result.current.profile).toBe(mockProfile);
    });

    expect(mockIdentifyUser).toHaveBeenCalledTimes(1);

    // Now logout - user becomes null
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    mockSupabaseClient.from.mockReturnValueOnce({
      select: mock(() => ({
        eq: mock(() => ({
          maybeSingle: mock(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    });

    rerender();

    await waitFor(() => {
      expect(result.current.profile).toBeNull();
    });

    expect(mockResetUser).toHaveBeenCalledTimes(1);
  });

  it('should include email, tier, created_at but exclude credit_balance in user properties', async () => {
    const mockUser: User = {
      id: 'user-1',
      email: 'test@example.com',
    } as User;

    const mockProfile: DbUser = {
      id: 'user-1',
      email: 'test@example.com',
      tier: 'pro',
      created_at: '2023-01-01T00:00:00Z',
      credit_balance: 500,
      deleted_at: null,
      display_name: null,
      is_admin: false,
      original_email: null,
      preferences: {},
      stripe_customer_id: null,
      updated_at: '2023-01-01T00:00:00Z',
    };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabaseClient.from.mockReturnValue({
      select: mock(() => ({
        eq: mock(() => ({
          maybeSingle: mock(() => Promise.resolve({ data: mockProfile, error: null })),
        })),
      })),
    });

    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => {
      expect(result.current.profile).toBe(mockProfile);
    });

    expect(mockIdentifyUser).toHaveBeenCalledWith('user-1', {
      email: 'test@example.com',
      tier: 'pro',
      created_at: '2023-01-01T00:00:00Z',
    });
  });
});