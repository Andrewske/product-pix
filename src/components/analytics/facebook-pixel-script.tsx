'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import ReactPixel from 'react-facebook-pixel';
import { useCookieConsent } from '@/components/cookie-consent';

export function FacebookPixelScript() {
  const { canUseMarketing } = useCookieConsent();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initializedRef = useRef(false);

  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

  // Initialize Facebook Pixel when consent granted
  useEffect(() => {
    if (!pixelId) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Facebook Pixel ID not configured (NEXT_PUBLIC_FACEBOOK_PIXEL_ID)');
      }
      return;
    }

    if (!canUseMarketing() || initializedRef.current) return;

    ReactPixel.init(pixelId);
    ReactPixel.pageView(); // Initial pageview
    initializedRef.current = true;
  }, [canUseMarketing, pixelId]);

  // Track pageview on route changes
  useEffect(() => {
    if (!initializedRef.current || !canUseMarketing()) return;

    // Use pathname to ensure effect runs on route changes
    if (pathname) {
      ReactPixel.pageView();
    }
  }, [pathname, searchParams, canUseMarketing]);

  return null;
}