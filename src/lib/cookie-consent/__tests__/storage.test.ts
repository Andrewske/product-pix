import { describe, it, expect, beforeEach, mock } from 'bun:test';
import {
  saveConsentToLocalStorage,
  loadConsentFromLocalStorage,
  clearLocalStorageConsent,
  saveConsentToDatabase,
} from '../storage';

// Mock localStorage
const localStorageMock = {
  getItem: mock(),
  setItem: mock(),
  removeItem: mock(),
};
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock Supabase admin client
mock.module('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    rpc: mock(async () => ({ error: null }))
  })
}));



describe('storage', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReset();
    localStorageMock.setItem.mockReset();
    localStorageMock.removeItem.mockReset();
  });

  describe('localStorage', () => {
    it('saves consent to localStorage', () => {
      const consent = { analytics: true, marketing: false, essential: true, consentedAt: '2025-01-15' };
      saveConsentToLocalStorage(consent);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'productpix_cookie_consent',
        JSON.stringify(consent)
      );
    });

    it('loads consent from localStorage', () => {
      const consent = { analytics: true, marketing: false, essential: true, consentedAt: '2025-01-15' };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(consent));
      const result = loadConsentFromLocalStorage();
      expect(result).toEqual(consent);
    });

    it('handles localStorage errors gracefully', () => {
      // Mock getItem to throw an error
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      });
      const result = loadConsentFromLocalStorage();
      expect(result).toBeNull();
      expect(localStorageMock.getItem).toHaveBeenCalledWith('productpix_cookie_consent');
    });
  });

  describe('database', () => {
    it('saves consent to database via RPC', async () => {
      const userId = 'user-123';
      const preferences = { cookies: { analytics: true, marketing: false, essential: true, consentedAt: '2025-01-15' } };

      // Should not throw with mocked client
      try {
        await saveConsentToDatabase(userId, preferences);
        expect(true).toBe(true); // Test passes if no error thrown
      } catch (error) {
        expect(error).toBeUndefined(); // Should not reach here
      }
    });


  });
});