// Base consent interface
export interface CookieConsent {
  analytics: boolean;      // PostHog
  marketing: boolean;      // Facebook Pixel
  essential: boolean;      // Always true (non-toggleable)
  consentedAt: string | null;  // ISO timestamp
}

// Updatable fields only (excludes essential, enforces type safety)
export type CookieConsentUpdates = Pick<CookieConsent, 'analytics' | 'marketing'>;

// Context value interface
export interface CookieConsentContextValue {
  consent: CookieConsent | null;
  loading: boolean;
  hasConsented: boolean;  // Derived from consentedAt !== null
  updateConsent: (updates: Partial<CookieConsentUpdates>) => Promise<void>;
  acceptAll: () => Promise<void>;
  rejectAll: () => Promise<void>;
  canUseAnalytics: () => boolean;
  canUseMarketing: () => boolean;
}