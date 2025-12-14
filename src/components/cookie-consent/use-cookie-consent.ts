'use client';

import { useContext } from 'react';
import { CookieConsentContext_INTERNAL as CookieConsentContext } from './cookie-consent-provider';
import type { CookieConsentContextValue } from '@/lib/cookie-consent';

export function useCookieConsent(): CookieConsentContextValue {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return context;
}