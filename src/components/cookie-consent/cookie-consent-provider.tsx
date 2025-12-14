'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from '@/lib/auth/hooks';
import type { CookieConsent, CookieConsentContextValue, CookieConsentUpdates } from '@/lib/cookie-consent';
import {
  saveConsentToLocalStorage,
  loadConsentFromLocalStorage,
  saveConsentToDatabase,
  loadConsentFromDatabase,
} from '@/lib/cookie-consent/storage';
import {
  syncConsentOnLogin,
  getDefaultConsent,
} from '@/lib/cookie-consent/sync';

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  // Consolidated auth state handler (fixes race condition)
  useEffect(() => {
    async function handleAuthStateChange() {
      setLoading(true);
      try {
        if (user) {
          // User logged in - sync localStorage → DB
          const localConsent = loadConsentFromLocalStorage();
          const dbConsent = await loadConsentFromDatabase(user.id);
          const merged = await syncConsentOnLogin(user.id, localConsent, dbConsent);
          setConsent(merged);
        } else {
          // User logged out - load from localStorage
          const localConsent = loadConsentFromLocalStorage();
          setConsent(localConsent || getDefaultConsent());
        }
      } catch (error) {
        console.error('Failed to initialize cookie consent:', error);
        // Fallback: use localStorage if available, otherwise default
        const localConsent = loadConsentFromLocalStorage();
        setConsent(localConsent || getDefaultConsent());
      } finally {
        setLoading(false);
      }
    }

    handleAuthStateChange();
  }, [user]);

  // Update consent (functional state update fixes race condition)
  const updateConsent = useCallback(async (updates: Partial<CookieConsentUpdates>) => {
    // Functional update - always reads latest state
    const finalConsent = await new Promise<CookieConsent>((resolve) => {
      setConsent(prev => {
        const newConsent = {
          ...prev!,
          ...updates,
          essential: true,  // Always true
          consentedAt: new Date().toISOString(),
        };
        resolve(newConsent);
        return newConsent;
      });
    });

    // Optimistic update - save in background
    try {
      if (user) {
        await saveConsentToDatabase(user.id, { cookies: finalConsent });
      } else {
        saveConsentToLocalStorage(finalConsent);
      }
    } catch (error) {
      console.error('Failed to save cookie consent:', error);
      // Keep optimistic update (will sync on next login)
      // TODO: Show toast notification when Part 2 (UI) is ready
    }
  }, [user]);

  // Accept all
  const acceptAll = useCallback(async () => {
    await updateConsent({
      analytics: true,
      marketing: true,
    });
  }, [updateConsent]);

  // Reject all
  const rejectAll = useCallback(async () => {
    await updateConsent({
      analytics: false,
      marketing: false,
    });
  }, [updateConsent]);

  // Convenience getters
  const canUseAnalytics = useCallback(() => {
    return consent?.analytics === true;
  }, [consent]);

  const canUseMarketing = useCallback(() => {
    return consent?.marketing === true;
  }, [consent]);

  const hasConsented = consent?.consentedAt !== null;

  const value: CookieConsentContextValue = {
    consent,
    loading,
    hasConsented,
    updateConsent,
    acceptAll,
    rejectAll,
    canUseAnalytics,
    canUseMarketing,
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export const CookieConsentContext_INTERNAL = CookieConsentContext; // For testing