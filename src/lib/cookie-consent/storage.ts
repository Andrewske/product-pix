import { createAdminClient } from '@/lib/supabase/admin';
import type { CookieConsent, UserPreferences } from './types';

const STORAGE_KEY = 'productpix_cookie_consent';

// ============ localStorage utilities ============

export function saveConsentToLocalStorage(consent: CookieConsent): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  } catch (error) {
    console.error('Failed to save consent to localStorage', { error });
    // Graceful degradation: continue without localStorage
  }
}

export function loadConsentFromLocalStorage(): CookieConsent | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as CookieConsent;
  } catch (error) {
    console.error('Failed to load consent from localStorage', { error });
    return null;
  }
}

export function clearLocalStorageConsent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear localStorage consent', { error });
  }
}

// ============ Database utilities ============

// Save consent to database using RPC function
export async function saveConsentToDatabase(
  userId: string,
  preferences: { cookies: CookieConsent }
): Promise<void> {
  try {
    const supabase = createAdminClient();
    // Type assertion needed until RPC function is added to generated types
    const result = await (supabase as unknown as { rpc: (name: string, params: Record<string, unknown>) => Promise<{ error: Error | null }> }).rpc('update_user_preferences', {
      user_id: userId,
      prefs: preferences
    });
    const { error } = result;

    if (error) throw error;
  } catch (error) {
    console.error('Failed to save consent to database', { error });
    throw error; // Propagate for error handling in caller
  }
}

