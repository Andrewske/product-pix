import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { syncConsentOnLogin, getDefaultConsent } from '../sync';
import type { CookieConsent } from '../types';

// Mock storage functions
const mockSaveToDatabase = mock(async () => {});
const mockClearLocalStorage = mock(() => {});

mock.module('../storage', () => ({
  saveConsentToDatabase: mockSaveToDatabase,
  clearLocalStorageConsent: mockClearLocalStorage,
}));

describe('sync', () => {
  beforeEach(() => {
    mockSaveToDatabase.mockClear();
    mockClearLocalStorage.mockClear();
  });

  it('returns default when no consent exists', async () => {
    const result = await syncConsentOnLogin('user-123', null, null);
    expect(result).toEqual(getDefaultConsent());
  });

  it('saves localStorage consent to DB when only local exists', async () => {
    const localConsent: CookieConsent = {
      analytics: true,
      marketing: false,
      essential: true,
      consentedAt: '2025-01-15',
    };

    const result = await syncConsentOnLogin('user-123', localConsent, null);

    expect(mockSaveToDatabase).toHaveBeenCalledWith('user-123', { cookies: localConsent });
    expect(mockClearLocalStorage).toHaveBeenCalled();
    expect(result).toEqual(localConsent);
  });

  it('uses DB consent when only DB exists', async () => {
    const dbConsent: CookieConsent = {
      analytics: false,
      marketing: true,
      essential: true,
      consentedAt: '2025-01-10',
    };

    const result = await syncConsentOnLogin('user-123', null, dbConsent);

    expect(result).toEqual(dbConsent);
    expect(mockSaveToDatabase).not.toHaveBeenCalled();
  });

  it('uses newer consent when both exist (localStorage newer)', async () => {
    const localConsent: CookieConsent = {
      analytics: true,
      marketing: false,
      essential: true,
      consentedAt: '2025-01-15',
    };

    const dbConsent: CookieConsent = {
      analytics: false,
      marketing: true,
      essential: true,
      consentedAt: '2025-01-10',
    };

    const result = await syncConsentOnLogin('user-123', localConsent, dbConsent);

    expect(result).toEqual(localConsent);
    expect(mockSaveToDatabase).toHaveBeenCalled();
    expect(mockClearLocalStorage).toHaveBeenCalled();
  });

  it('uses newer consent when both exist (database newer)', async () => {
    const localConsent: CookieConsent = {
      analytics: true,
      marketing: false,
      essential: true,
      consentedAt: '2025-01-10',
    };

    const dbConsent: CookieConsent = {
      analytics: false,
      marketing: true,
      essential: true,
      consentedAt: '2025-01-15',
    };

    const result = await syncConsentOnLogin('user-123', localConsent, dbConsent);

    expect(result).toEqual(dbConsent);
    expect(mockSaveToDatabase).not.toHaveBeenCalled();
  });

  it('keeps localStorage backup when database save fails', async () => {
    const localConsent: CookieConsent = {
      analytics: true,
      marketing: false,
      essential: true,
      consentedAt: '2025-01-15',
    };

    mockSaveToDatabase.mockRejectedValueOnce(new Error('Network error'));

    await expect(syncConsentOnLogin('user-123', localConsent, null)).rejects.toThrow();

    expect(mockClearLocalStorage).not.toHaveBeenCalled(); // localStorage preserved
  });
});