import type { CookieConsent } from './types';
import { saveConsentToDatabase, clearLocalStorageConsent } from './storage';

export function getDefaultConsent(): CookieConsent {
  return {
    analytics: false,
    marketing: false,
    essential: true,  // Always true
    consentedAt: null, // No consent yet
  };
}

export async function syncConsentOnLogin(
  userId: string,
  localConsent: CookieConsent | null,
  dbConsent: CookieConsent | null
): Promise<CookieConsent> {
  // No consent anywhere: return default
  if (!localConsent && !dbConsent) {
    return getDefaultConsent();
  }

  // Only local consent exists: save to DB
  if (!dbConsent && localConsent) {
    try {
      await saveConsentToDatabase(userId, { cookies: localConsent });
      clearLocalStorageConsent(); // Only clear after successful save
    } catch (error) {
      console.error('Failed to sync consent to database, keeping localStorage backup:', error);
      // Keep localStorage as backup, will retry on next login
      throw error;
    }
    return localConsent;
  }

  // Only DB consent exists: use it
  if (!localConsent && dbConsent) {
    return dbConsent;
  }

  // Both exist: use newer one (compare timestamps)
  const localTime = new Date(localConsent!.consentedAt || 0).getTime();
  const dbTime = new Date(dbConsent!.consentedAt || 0).getTime();

  const winner = localTime > dbTime ? localConsent! : dbConsent!;

  // Save winner to DB if it was local
  if (winner === localConsent) {
    try {
      await saveConsentToDatabase(userId, { cookies: localConsent! });
      clearLocalStorageConsent(); // Only clear after successful save
    } catch (error) {
      console.error('Failed to sync consent to database, keeping localStorage backup:', error);
      throw error;
    }
  }

  return winner;
}