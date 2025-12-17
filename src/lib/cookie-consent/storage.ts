import { createClient } from '@/lib/supabase/client';
import type { CookieConsent } from './types';
import type { Json } from '@/types/database';
import { logger } from '@/lib/logging';

const STORAGE_KEY = 'productpix_cookie_consent';

// ============ localStorage utilities ============

export function saveConsentToLocalStorage(consent: CookieConsent): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  } catch (error) {
    logger.error('Failed to save consent to localStorage', { error });
    // Graceful degradation: continue without localStorage
  }
}

export function loadConsentFromLocalStorage(): CookieConsent | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as CookieConsent;
  } catch (error) {
    logger.error('Failed to load consent from localStorage', { error });
    return null;
  }
}

export function clearLocalStorageConsent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    logger.error('Failed to clear localStorage consent', { error });
  }
}

// ============ Database utilities ============

// Save consent to database using RPC function
export async function saveConsentToDatabase(
  userId: string,
  preferences: { cookies: CookieConsent }
): Promise<void> {
  try {
    const supabase = createClient();
    const { error } = await supabase.rpc('update_user_preferences', {
      user_id: userId,
      prefs: preferences as unknown as Json
    });

    if (error) throw error;
  } catch (error) {
    logger.error('Failed to save consent to database', { error });
    throw error; // Propagate for error handling in caller
  }
}

