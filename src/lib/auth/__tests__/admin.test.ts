import { describe, it, expect, mock } from 'bun:test';
import { requireAdmin, getAdminStatus } from '../admin';

// Mock Supabase client
const mockCreateClient = mock(async () => ({
  from: mock(() => ({
    select: mock(() => ({
      eq: mock(() => ({
        single: mock(() => Promise.resolve({ data: { is_admin: true }, error: null }))
      }))
    }))
  }))
}));

mock.module('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}));

describe('admin utilities', () => {
  describe('requireAdmin', () => {
    it('returns true for admin user', async () => {
      mockCreateClient.mockResolvedValueOnce({
        from: mock(() => ({
          select: mock(() => ({
            eq: mock(() => ({
              single: mock(() => Promise.resolve({ data: { is_admin: true }, error: null }))
            }))
          }))
        }))
      });

      const result = await requireAdmin('user-123');
      expect(result).toBe(true);
    });

    it('returns false for non-admin user', async () => {
      mockCreateClient.mockResolvedValueOnce({
        from: mock(() => ({
          select: mock(() => ({
            eq: mock(() => ({
              single: mock(() => Promise.resolve({ data: { is_admin: false }, error: null }))
            }))
          }))
        }))
      });

      const result = await requireAdmin('user-123');
      expect(result).toBe(false);
    });

    it('returns false on database error', async () => {
      mockCreateClient.mockResolvedValueOnce({
        from: mock(() => ({
          select: mock(() => ({
            eq: mock(() => ({
              single: mock(() => Promise.resolve({ data: null, error: { message: 'DB error' } }))
            }))
          }))
        }))
      });

      const result = await requireAdmin('user-123');
      expect(result).toBe(false);
    });
  });

  describe('getAdminStatus', () => {
    it('returns admin status with no error for admin user', async () => {
      mockCreateClient.mockResolvedValueOnce({
        from: mock(() => ({
          select: mock(() => ({
            eq: mock(() => ({
              single: mock(() => Promise.resolve({ data: { is_admin: true }, error: null }))
            }))
          }))
        }))
      });

      const result = await getAdminStatus('user-123');
      expect(result).toEqual({ isAdmin: true });
    });

    it('returns admin status with no error for non-admin user', async () => {
      mockCreateClient.mockResolvedValueOnce({
        from: mock(() => ({
          select: mock(() => ({
            eq: mock(() => ({
              single: mock(() => Promise.resolve({ data: { is_admin: false }, error: null }))
            }))
          }))
        }))
      });

      const result = await getAdminStatus('user-123');
      expect(result).toEqual({ isAdmin: false });
    });

    it('returns error message on database failure', async () => {
      mockCreateClient.mockResolvedValueOnce({
        from: mock(() => ({
          select: mock(() => ({
            eq: mock(() => ({
              single: mock(() => Promise.resolve({ data: null, error: { message: 'DB error' } }))
            }))
          }))
        }))
      });

      const result = await getAdminStatus('user-123');
      expect(result).toEqual({ isAdmin: false, error: 'DB error' });
    });
  });
});