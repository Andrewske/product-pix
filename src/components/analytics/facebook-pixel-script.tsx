'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import ReactPixel from 'react-facebook-pixel';
import { useCookieConsent } from '@/components/cookie-consent';

export function FacebookPixelScript() {
  const { canUseMarketing } = useCookieConsent();
  const [initialized, setInitialized] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

  // Initialize Facebook Pixel when consent granted
  useEffect(() => {
    if (!pixelId) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Facebook Pixel ID not configured (NEXT_PUBLIC_FACEBOOK_PIXEL_ID)');
      }
      return;
    }

    if (!canUseMarketing() || initialized) return;

    ReactPixel.init(pixelId);
    ReactPixel.pageView(); // Initial pageview
    setInitialized(true);
  }, [canUseMarketing, initialized, pixelId]);

  // Track pageview on route changes
  useEffect(() => {
    if (!initialized || !canUseMarketing()) return;

    ReactPixel.pageView();
  }, [pathname, searchParams, initialized, canUseMarketing]);

  return null;
}