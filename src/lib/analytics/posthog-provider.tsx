'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { createClientConfig } from './config';

/**
 * Hook to initialize PostHog with privacy-first configuration
 */
export function usePostHogInit() {
  useEffect(() => {
    const initPostHog = async () => {
      const posthog = await import('posthog-js');

      // @ts-ignore - PostHog library typing issue with loaded callback
      posthog.default.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, createClientConfig());

      // Enable debug mode in development
      if (process.env.NODE_ENV === 'development') {
        posthog.default.debug();
      }
    };

    initPostHog();
  }, []);
}

/**
 * Hook to track pageviews on route changes and initial mount
 */
export function usePageviewTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track pageview on route change (including initial load)
    import('posthog-js').then((posthog) => {
      if (posthog.default.__loaded) {
        posthog.default.capture('$pageview');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);
}

/**
 * PostHog Provider component that wraps the app
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  usePostHogInit();
  usePageviewTracking();

  return <>{children}</>;
}