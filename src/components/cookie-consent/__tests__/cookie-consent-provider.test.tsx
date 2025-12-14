import { describe, it, expect, mock } from 'bun:test';
import { render, renderHook, waitFor, act } from '@testing-library/react';
import { CookieConsentProvider } from '../cookie-consent-provider';
import { useCookieConsent } from '../use-cookie-consent';

// Mock dependencies
const mockUseUser = mock();
const mockSaveToLocalStorage = mock();
const mockLoadFromLocalStorage = mock();
const mockSaveToDatabase = mock();
const mockLoadFromDatabase = mock();
const mockSyncOnLogin = mock();
const mockGetDefaultConsent = mock();

mock.module('@/lib/auth/hooks', () => ({
  useUser: mockUseUser
}));

mock.module('@/lib/cookie-consent/storage', () => ({
  saveConsentToLocalStorage: mockSaveToLocalStorage,
  loadConsentFromLocalStorage: mockLoadFromLocalStorage,
  saveConsentToDatabase: mockSaveToDatabase,
  loadConsentFromDatabase: mockLoadFromDatabase,
}));

mock.module('@/lib/cookie-consent/sync', () => ({
  syncConsentOnLogin: mockSyncOnLogin,
  getDefaultConsent: mockGetDefaultConsent,
}));

describe('CookieConsentProvider', () => {
  it('provides context value to children', async () => {
    mockUseUser.mockReturnValue({ user: null });
    mockLoadFromLocalStorage.mockReturnValue(null);
    mockGetDefaultConsent.mockReturnValue({ analytics: false, marketing: false, essential: true, consentedAt: null });

    const { result } = renderHook(() => useCookieConsent(), {
      wrapper: ({ children }) => <CookieConsentProvider>{children}</CookieConsentProvider>
    });

    await waitFor(() => {
      expect(result.current).toBeDefined();
      expect(result.current.consent).toBeDefined();
      expect(result.current.loading).toBe(false);
      expect(typeof result.current.updateConsent).toBe('function');
      expect(typeof result.current.acceptAll).toBe('function');
      expect(typeof result.current.rejectAll).toBe('function');
      expect(typeof result.current.canUseAnalytics).toBe('function');
      expect(typeof result.current.canUseMarketing).toBe('function');
    });
  });

  it('hasConsented returns false for default consent', async () => {
    mockUseUser.mockReturnValue({ user: null });
    mockLoadFromLocalStorage.mockReturnValue(null);
    mockGetDefaultConsent.mockReturnValue({ analytics: false, marketing: false, essential: true, consentedAt: null });

    const { result } = renderHook(() => useCookieConsent(), {
      wrapper: ({ children }) => <CookieConsentProvider>{children}</CookieConsentProvider>
    });

    await waitFor(() => {
      expect(result.current.hasConsented).toBe(false);
    });
  });

  it('hasConsented returns true when consentedAt is set', async () => {
    const consent = { analytics: true, marketing: false, essential: true, consentedAt: '2025-01-15' };
    mockUseUser.mockReturnValue({ user: null });
    mockLoadFromLocalStorage.mockReturnValue(consent);

    const { result } = renderHook(() => useCookieConsent(), {
      wrapper: ({ children }) => <CookieConsentProvider>{children}</CookieConsentProvider>
    });

    await waitFor(() => {
      expect(result.current.hasConsented).toBe(true);
    });
  });
});

describe('useCookieConsent', () => {
  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useCookieConsent());
    }).toThrow('useCookieConsent must be used within CookieConsentProvider');
  });
});