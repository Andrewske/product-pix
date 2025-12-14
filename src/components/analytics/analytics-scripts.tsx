'use client';

import { useCookieConsent } from '@/components/cookie-consent';
import { PostHogScript } from './posthog-script';
import { FacebookPixelScript } from './facebook-pixel-script';

export function AnalyticsScripts() {
  const { loading } = useCookieConsent();

  // Don't render anything while loading consent state
  if (loading) return null;

  return (
    <>
      <PostHogScript />
      <FacebookPixelScript />
    </>
  );
}