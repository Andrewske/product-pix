import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerClient } from '@/lib/supabase/server';
import type { CookieConsent } from './types';

const STORAGE_KEY = 'productpix_cookie_consent';

// ============ localStorage utilities ============

export function saveConsentToLocalStorage(consent: CookieConsent): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  } catch (error) {
    console.error('Failed to save consent to localStorage:', error);
    // Graceful degradation: continue without localStorage
  }
}

export function loadConsentFromLocalStorage(): CookieConsent | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as CookieConsent;
  } catch (error) {
    console.error('Failed to load consent from localStorage:', error);
    return null;
  }
}

export function clearLocalStorageConsent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear localStorage consent:', error);
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
    const { error } = await (supabase.rpc as any)('update_user_preferences', {
      user_id: userId,
      prefs: preferences
    });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to save consent to database:', error);
    throw error; // Propagate for error handling in caller
  }
}

// Load consent from database
export async function loadConsentFromDatabase(
  userId: string
): Promise<CookieConsent | null> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('users')
      .select('preferences')
      .eq('id', userId)
      .single();

    if (error) throw error;
    if (!data?.preferences) return null;

    const prefs = data.preferences as any; // JSONB type
    return prefs.cookies || null;
  } catch (error) {
    console.error('Failed to load consent from database:', error);
    return null;
  }
}