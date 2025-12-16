'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useCookieConsent } from '@/components/cookie-consent';

export function PostHogScript() {
  const { canUseAnalytics } = useCookieConsent();
  const [initialized, setInitialized] = useState(false);
  const pathname = usePathname();
  const _searchParams = useSearchParams();

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  // Initialize PostHog when consent granted
  useEffect(() => {
    // Disable PostHog in development environment
    if (process.env.NODE_ENV === 'development') {
      return;
    }

    if (!apiKey) {
      return;
    }

    if (!canUseAnalytics() || initialized) return;

    // Dynamic import to avoid SSR issues
    import('posthog-js').then((posthog) => {
      posthog.default.init(apiKey, {
        api_host: apiHost,
        person_profiles: 'always',  // Track all users with consent (not just identified)
        capture_pageview: false,    // Manual pageview tracking
        loaded: (posthog_instance: typeof import('posthog-js').default) => {
          // Track initial pageview after initialization
          posthog_instance.capture('$pageview');
          setInitialized(true);
        }
      });
    });
  }, [canUseAnalytics, initialized, apiKey, apiHost]);

  // Track pageview on route changes
  useEffect(() => {
    if (!initialized || !canUseAnalytics()) return;

    // Dynamic import to avoid SSR issues
    import('posthog-js').then((posthog) => {
      posthog.default.capture('$pageview');
    });
  }, [initialized, canUseAnalytics]);

  return null;
}