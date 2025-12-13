'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { env } from '@/lib/env';

export function PostHogProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!env.NEXT_PUBLIC_POSTHOG_API_KEY) return;

    posthog.init(env.NEXT_PUBLIC_POSTHOG_API_KEY, {
      api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
      // Manual pageview tracking for Next.js App Router SPA navigation
      capture_pageview: false,
    });
  }, []);

  useEffect(() => {
    if (!pathname) return;

    // Track pageviews on route change (SPA navigation)
    posthog.capture('$pageview', {
      $current_url: `${pathname}${searchParams?.toString() ? `?${searchParams}` : ''}`,
    });
  }, [pathname, searchParams]);

  return <>{children}</>;
}