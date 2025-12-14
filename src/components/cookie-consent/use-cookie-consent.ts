'use client';

import { useContext, useState, useEffect } from 'react';
import { useUser } from '@/lib/auth/hooks';
import type { CookieConsent, CookieConsentContextValue } from '@/lib/cookie-consent';
import { CookieConsentContext_INTERNAL as CookieConsentContext } from './cookie-consent-provider';
import { loadConsentFromLocalStorage } from '@/lib/cookie-consent/storage';
import { syncConsentOnLogin, getDefaultConsent } from '@/lib/cookie-consent/sync';

export function useCookieConsent(): CookieConsentContextValue {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return context;
}

export function useCookieConsentAuth() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    async function handleAuthStateChange() {
      setLoading(true);
      try {
        if (user) {
          // User logged in - sync localStorage → DB
          const localConsent = loadConsentFromLocalStorage();

          // Load consent from database via API
          const response = await fetch('/api/cookie-consent');
          if (!response.ok) {
            throw new Error('Failed to load consent from database');
          }
          const { consent: dbConsent } = await response.json();

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

  return { consent, loading };
}