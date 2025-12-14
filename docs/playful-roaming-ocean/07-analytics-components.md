# Analytics Components - PostHog and Facebook Pixel

## Files to Create
- `src/types/global.d.ts` (new or modify)
- `src/components/analytics/posthog-script.tsx` (new)
- `src/components/analytics/facebook-pixel-script.tsx` (new)
- `src/components/analytics/analytics-scripts.tsx` (new)
- `src/components/analytics/index.ts` (new)

## Implementation Details

### global.d.ts (Window type extensions)

```typescript
declare global {
  interface Window {
    posthog?: typeof import('posthog-js').default;
    fbq?: {
      (command: 'init', pixelId: string): void;
      (command: 'track', event: string, params?: any): void;
      (command: 'trackCustom', event: string, params?: any): void;
    };
  }
}

export {};
```

### posthog-script.tsx

```typescript
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
```

### facebook-pixel-script.tsx

```typescript
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
```

### analytics-scripts.tsx (wrapper)

```typescript
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
```

### index.ts (barrel export)

```typescript
export { AnalyticsScripts } from './analytics-scripts';
export { PostHogScript } from './posthog-script';
export { FacebookPixelScript } from './facebook-pixel-script';
```

## Key Changes from Original Plan

**Critical Fix #7**: Anonymous tracking enabled.
- `person_profiles: 'always'` instead of `'identified_only'`
- Tracks logged-out users with consent (full user journey)
- Required for acquisition analytics, conversion funnels

**Critical Fix #11**: Manual PageView tracking.
- `capture_pageview: false` in PostHog config
- Manual `posthog.capture('$pageview')` in loaded callback
- Ensures initial pageview is captured reliably
- Route change tracking via pathname/searchParams

**Event Timing**:
PostHog initializes in ~100-200ms with npm package. Events tracked immediately after consent may be lost. For critical events, use retry pattern:

```typescript
const trackEvent = (name: string, props?: any) => {
  const attempt = () => {
    if (window.posthog) {
      window.posthog.capture(name, props);
    } else {
      setTimeout(attempt, 50); // Retry after 50ms
    }
  };
  attempt();
};
```

## Acceptance Criteria

- [ ] PostHog initializes when analytics consent granted
- [ ] Facebook Pixel initializes when marketing consent granted
- [ ] Initial pageview tracked after script initialization
- [ ] Route changes trigger pageview events
- [ ] Scripts don't load when consent rejected
- [ ] Scripts don't load while consent state is loading
- [ ] Missing env vars don't crash app (graceful degradation)
- [ ] Development mode shows warnings for missing env vars
- [ ] TypeScript recognizes window.posthog and window.fbq
- [ ] No console errors in browser

## Testing Notes

**Manual Testing**:
1. Accept analytics → Verify PostHog loads (Network tab: us.i.posthog.com)
2. Check console: `window.posthog` exists
3. Navigate to different page → Verify pageview event
4. Reject analytics → Reload → Verify PostHog doesn't load
5. Repeat for Facebook Pixel (marketing consent)

**Browser DevTools**:
- Network tab: Check for posthog/facebook requests
- Console: `window.posthog` and `window.fbq`
- React DevTools: Inspect AnalyticsScripts component state

## Dependencies

**Prerequisites**:
- Phase 5 (React Provider) - useCookieConsent hook
- Phase 6 (NPM Packages) - posthog-js, react-facebook-pixel

**Internal Dependencies** (existing):
- `next/navigation` - usePathname, useSearchParams

**Used by**:
- Phase 8 (Root Integration)
