'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { useCookieConsent } from '@/components/cookie-consent';

export function PostHogScript() {
  const { canUseAnalytics, hasConsented } = useCookieConsent();
  const [initialized, setInitialized] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_API_KEY;
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  // Initialize PostHog when consent granted
  useEffect(() => {
    if (!apiKey) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('PostHog API key not configured (NEXT_PUBLIC_POSTHOG_API_KEY)');
      }
      return;
    }

    if (!canUseAnalytics() || initialized) return;

    posthog.init(apiKey, {
      api_host: apiHost,
      person_profiles: 'always',  // Track all users with consent (not just identified)
      capture_pageview: false,    // Manual pageview tracking
      loaded: (posthog) => {
        // Track initial pageview after initialization
        posthog.capture('$pageview');
        setInitialized(true);
      }
    });
  }, [canUseAnalytics, initialized, apiKey, apiHost]);

  // Track pageview on route changes
  useEffect(() => {
    if (!initialized || !canUseAnalytics()) return;

    posthog.capture('$pageview');
  }, [pathname, searchParams, initialized, canUseAnalytics]);

  return null;
}