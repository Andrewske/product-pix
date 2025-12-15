import type { CookieConsent } from './types';
import { saveConsentToDatabase, clearLocalStorageConsent } from './storage';
import { logger } from '@/lib/logging';

export function getDefaultConsent(): CookieConsent {
  return {
    analytics: false,
    marketing: false,
    essential: true,  // Always true
    consentedAt: null, // No consent yet
  };
}

function getNewerConsent(
  localConsent: CookieConsent,
  dbConsent: CookieConsent
): CookieConsent {
  const localTime = new Date(localConsent.consentedAt || 0).getTime();
  const dbTime = new Date(dbConsent.consentedAt || 0).getTime();
  return localTime > dbTime ? localConsent : dbConsent;
}

async function syncLocalConsentToDatabase(
  userId: string,
  consent: CookieConsent
): Promise<void> {
  try {
    await saveConsentToDatabase(userId, { cookies: consent });
    clearLocalStorageConsent(); // Only clear after successful save
  } catch (error) {
    logger.error('Failed to sync consent to database, keeping localStorage backup', { error });
    throw error;
  }
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
    await syncLocalConsentToDatabase(userId, localConsent);
    return localConsent;
  }

  // Only DB consent exists: use it
  if (!localConsent && dbConsent) {
    return dbConsent;
  }

  // Both exist: use newer one (compare timestamps)
  const winner = getNewerConsent(localConsent!, dbConsent!);

  // Save winner to DB if it was local
  if (winner === localConsent) {
    await syncLocalConsentToDatabase(userId, localConsent!);
  }

  return winner;
}