# Cookie Consent System - Part 3: Analytics Integration

## Overview

Integrate PostHog and Facebook Pixel analytics scripts with conditional loading based on user consent. Scripts should only load when user has granted permission via the cookie consent system.

**Prerequisites**: Parts 1 (Foundation) and 2 (UI) must be completed first.

## Architecture Decisions

**Conditional Script Loading: Next.js Script component**
- Rationale: Next.js `<Script>` component provides optimal loading strategy, deduplication, and performance
- Strategy: `afterInteractive` (load after page is interactive, before other scripts)
- Conditional rendering: Wrap scripts in consent checks

**Script Management: Separate components per service**
- Rationale: Separation of concerns, easy to add/remove services
- PostHogScript: Loads PostHog snippet and initializes
- FacebookPixelScript: Loads Facebook Pixel snippet and initializes
- AnalyticsScripts: Wrapper that conditionally renders based on consent

**Environment Variables: NEXT_PUBLIC_ prefix**
- Rationale: Client-side access required for script initialization
- Fail gracefully: If env vars missing, don't render scripts (no errors)

## Implementation Tasks

### Phase 1: PostHog Integration

- [ ] Create PostHogScript component
  - Files: `src/components/analytics/posthog-script.tsx` (new)
  - Tests: Manual verification (no automated test needed)
  - Acceptance: PostHog initializes correctly when consent granted
  - Details:
    ```typescript
    'use client';

    import Script from 'next/script';

    export function PostHogScript() {
      const apiKey = process.env.NEXT_PUBLIC_POSTHOG_API_KEY;
      const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

      // Gracefully fail if env vars missing
      if (!apiKey) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('PostHog API key not configured (NEXT_PUBLIC_POSTHOG_API_KEY)');
        }
        return null;
      }

      return (
        <Script
          id="posthog-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
              posthog.init('${apiKey}',{api_host:'${apiHost}',person_profiles:'identified_only'})
            `,
          }}
        />
      );
    }
    ```

- [ ] Add TypeScript window interface for PostHog
  - Files: `src/types/global.d.ts` (new or modify)
  - Tests: N/A (type definitions)
  - Acceptance: TypeScript recognizes window.posthog
  - Details:
    ```typescript
    // Add to global.d.ts or create new file
    declare global {
      interface Window {
        posthog?: {
          init: (apiKey: string, config?: any) => void;
          capture: (event: string, properties?: any) => void;
          identify: (userId: string, properties?: any) => void;
          reset: () => void;
          // Add other PostHog methods as needed
        };
      }
    }

    export {};
    ```

### Phase 2: Facebook Pixel Integration

- [ ] Create FacebookPixelScript component
  - Files: `src/components/analytics/facebook-pixel-script.tsx` (new)
  - Tests: Manual verification (no automated test needed)
  - Acceptance: Facebook Pixel initializes correctly when consent granted
  - Details:
    ```typescript
    'use client';

    import Script from 'next/script';

    export function FacebookPixelScript() {
      const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

      // Gracefully fail if env var missing
      if (!pixelId) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Facebook Pixel ID not configured (NEXT_PUBLIC_FACEBOOK_PIXEL_ID)');
        }
        return null;
      }

      return (
        <>
          <Script
            id="facebook-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${pixelId}');
                fbq('track', 'PageView');
              `,
            }}
          />
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={\`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1\`}
              alt=""
            />
          </noscript>
        </>
      );
    }
    ```

- [ ] Add TypeScript window interface for Facebook Pixel
  - Files: `src/types/global.d.ts` (modify)
  - Tests: N/A (type definitions)
  - Acceptance: TypeScript recognizes window.fbq
  - Details:
    ```typescript
    // Add to existing global.d.ts
    declare global {
      interface Window {
        fbq?: {
          (command: 'init', pixelId: string): void;
          (command: 'track', event: string, params?: any): void;
          (command: 'trackCustom', event: string, params?: any): void;
          // Add other fbq methods as needed
        };
      }
    }
    ```

### Phase 3: Conditional Loading Wrapper

- [ ] Create AnalyticsScripts wrapper component
  - Files: `src/components/analytics/analytics-scripts.tsx` (new)
  - Tests: `src/components/analytics/__tests__/analytics-scripts.test.tsx` (new)
  - Acceptance: Scripts only render when consent granted
  - Dependencies: Requires Part 1 (useCookieConsent hook)
  - Details:
    ```typescript
    'use client';

    import { useCookieConsent } from '@/components/cookie-consent';
    import { PostHogScript } from './posthog-script';
    import { FacebookPixelScript } from './facebook-pixel-script';

    export function AnalyticsScripts() {
      const { canUseAnalytics, canUseMarketing, loading } = useCookieConsent();

      // Don't render anything while loading consent state
      if (loading) return null;

      return (
        <>
          {canUseAnalytics() && <PostHogScript />}
          {canUseMarketing() && <FacebookPixelScript />}
        </>
      );
    }
    ```

- [ ] Write AnalyticsScripts tests
  - Files: `src/components/analytics/__tests__/analytics-scripts.test.tsx` (new)
  - Tests: Self (unit tests)
  - Acceptance: Conditional rendering logic works correctly
  - Details:
    - Mock useCookieConsent hook
    - Test nothing renders when loading === true
    - Test PostHogScript renders when canUseAnalytics() === true
    - Test PostHogScript doesn't render when canUseAnalytics() === false
    - Test FacebookPixelScript renders when canUseMarketing() === true
    - Test FacebookPixelScript doesn't render when canUseMarketing() === false
    - Test both render when both consents true

- [ ] Create barrel export for analytics
  - Files: `src/components/analytics/index.ts` (new)
  - Tests: N/A
  - Acceptance: Can import AnalyticsScripts via `@/components/analytics`
  - Details:
    ```typescript
    export { AnalyticsScripts } from './analytics-scripts';
    export { PostHogScript } from './posthog-script';
    export { FacebookPixelScript } from './facebook-pixel-script';
    ```

### Phase 4: Root Layout Integration

- [ ] Add AnalyticsScripts to root layout
  - Files: `src/app/layout.tsx` (modify)
  - Tests: Manual verification
  - Acceptance: Scripts load when consent granted, don't load when rejected
  - Details:
    ```typescript
    // Add import
    import { AnalyticsScripts } from '@/components/analytics';

    // Add to body (before closing </body> tag, after LayoutWrapper)
    <body className={`${geist.className} antialiased`}>
      <ThemeProvider>
        <CookieConsentProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
          <CookieConsentBanner />
          <AnalyticsScripts />
        </CookieConsentProvider>
      </ThemeProvider>
    </body>
    ```

### Phase 5: Environment Variables

- [ ] Add environment variables
  - Files: `.env.local` (modify - not committed)
  - Tests: N/A
  - Acceptance: Scripts initialize with correct API keys
  - Details:
    ```bash
    # PostHog Analytics
    NEXT_PUBLIC_POSTHOG_API_KEY=phc_your_actual_key_here
    NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

    # Facebook Pixel
    NEXT_PUBLIC_FACEBOOK_PIXEL_ID=your_pixel_id_here
    ```

- [ ] Document environment variables
  - Files: `.env.example` (modify)
  - Tests: N/A
  - Acceptance: Developers know what env vars to set
  - Details:
    ```bash
    # Add to existing .env.example

    # Analytics & Tracking (optional)
    # PostHog API key for product analytics and session recording
    NEXT_PUBLIC_POSTHOG_API_KEY=phc_xxxxx
    NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

    # Facebook Pixel ID for marketing conversion tracking
    NEXT_PUBLIC_FACEBOOK_PIXEL_ID=123456789
    ```

### Phase 6: Testing & Validation

- [ ] Test PostHog initialization
  - Files: N/A (manual testing)
  - Tests: Manual
  - Acceptance: PostHog loads and tracks events when analytics consent granted
  - Details:
    - Accept analytics in banner
    - Open browser DevTools → Network tab
    - Verify PostHog script loads (us.i.posthog.com/array.js)
    - Open Console → Type `window.posthog` → Verify object exists
    - Trigger a page view → Verify event in PostHog dashboard
    - Reject analytics → Reload page → Verify PostHog script doesn't load

- [ ] Test Facebook Pixel initialization
  - Files: N/A (manual testing)
  - Tests: Manual
  - Acceptance: FB Pixel loads and fires PageView when marketing consent granted
  - Details:
    - Accept marketing in banner
    - Open browser DevTools → Network tab
    - Verify Facebook Pixel script loads (connect.facebook.net/en_US/fbevents.js)
    - Install Facebook Pixel Helper browser extension
    - Verify PageView event fires (green checkmark in extension)
    - Reject marketing → Reload page → Verify FB Pixel script doesn't load

- [ ] Test consent state changes
  - Files: N/A (manual testing)
  - Tests: Manual
  - Acceptance: Scripts load/unload when consent changes
  - Details:
    - Start with consent rejected
    - Verify no analytics scripts load
    - Go to Settings → Privacy tab → Enable Analytics
    - Reload page → Verify PostHog script loads
    - Disable Analytics in Settings
    - Reload page → Verify PostHog script doesn't load

- [ ] Test with missing environment variables
  - Files: N/A (manual testing)
  - Tests: Manual
  - Acceptance: App doesn't crash, shows warning in dev mode
  - Details:
    - Remove NEXT_PUBLIC_POSTHOG_API_KEY from .env.local
    - Reload page (dev mode)
    - Verify warning in console: "PostHog API key not configured"
    - Verify app still works (no crashes)
    - Verify no PostHog script attempts to load

### Phase 7: Production Readiness

- [ ] Create staging environment test checklist
  - Files: N/A (documentation/manual)
  - Tests: Manual
  - Acceptance: All scenarios tested in staging before production
  - Details:
    - [ ] PostHog test environment configured
    - [ ] Facebook Pixel test account configured
    - [ ] Test full consent flow (Accept → Events tracked)
    - [ ] Test rejection flow (Reject → No events tracked)
    - [ ] Test granular toggles in Settings
    - [ ] Verify no PII sent to PostHog or Facebook
    - [ ] Test on multiple devices (desktop, mobile)
    - [ ] Test in multiple browsers (Chrome, Safari, Firefox)

- [ ] Document analytics events to track
  - Files: `docs/analytics-events.md` (new - optional)
  - Tests: N/A (documentation)
  - Acceptance: Team knows what events to track
  - Details:
    ```markdown
    # Analytics Events

    ## PostHog Events (Analytics)
    - PageView (automatic)
    - Signup (user creates account)
    - Login (user logs in)
    - Credit Purchase (user buys credits)
    - Generation Start (user starts image generation)
    - Generation Complete (image generated successfully)
    - Generation Failed (generation errors)

    ## Facebook Pixel Events (Marketing)
    - PageView (automatic)
    - CompleteRegistration (user signs up)
    - Purchase (user buys credits)
    - ViewContent (user views generated image)
    - Lead (user provides email on landing page)

    ## Implementation
    Use window.posthog.capture() and window.fbq() to track custom events.
    Always check consent before tracking:
    ```typescript
    if (canUseAnalytics()) {
      window.posthog?.capture('Signup', { plan: 'free' });
    }
    if (canUseMarketing()) {
      window.fbq?.('trackCustom', 'Signup', { plan: 'free' });
    }
    ```
    ```

## Acceptance Criteria

- [ ] PostHog script loads when analytics consent granted
- [ ] PostHog script doesn't load when analytics consent rejected
- [ ] Facebook Pixel loads when marketing consent granted
- [ ] Facebook Pixel doesn't load when marketing consent rejected
- [ ] Scripts don't load while consent state is loading
- [ ] Missing env vars don't crash app (fail gracefully)
- [ ] Dev mode shows warnings for missing env vars
- [ ] TypeScript recognizes window.posthog and window.fbq
- [ ] PostHog tracks PageView events
- [ ] Facebook Pixel tracks PageView events
- [ ] Consent state changes trigger script loading/unloading
- [ ] No hydration errors
- [ ] No console errors in production
- [ ] Scripts use Next.js `<Script>` component with `afterInteractive` strategy

## Files to Create

**Components**:
- `src/components/analytics/analytics-scripts.tsx` - Conditional wrapper
- `src/components/analytics/posthog-script.tsx` - PostHog initialization
- `src/components/analytics/facebook-pixel-script.tsx` - Facebook Pixel initialization
- `src/components/analytics/index.ts` - Barrel export

**Types**:
- `src/types/global.d.ts` - Window interface extensions for posthog and fbq

**Tests**:
- `src/components/analytics/__tests__/analytics-scripts.test.tsx` - Conditional rendering tests

**Documentation** (optional):
- `docs/analytics-events.md` - Event tracking guide

## Files to Modify

- `src/app/layout.tsx` - Add AnalyticsScripts component
- `.env.example` - Document environment variables

## Dependencies

**Internal**:
- Part 1 (Foundation) - useCookieConsent hook
- Part 2 (UI) - Cookie banner and settings (for user to grant consent)

**External**:
- `next/script` - Next.js Script component (already installed)

**Environment Variables**:
- `NEXT_PUBLIC_POSTHOG_API_KEY` - PostHog project API key
- `NEXT_PUBLIC_POSTHOG_HOST` - PostHog instance URL (optional, defaults to US cloud)
- `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` - Facebook Pixel ID

## Testing Strategy

**Unit Tests**:
- AnalyticsScripts: Mock useCookieConsent, test conditional rendering

**Manual Testing**:
- PostHog initialization with consent granted
- Facebook Pixel initialization with consent granted
- Scripts blocked when consent rejected
- Consent state changes trigger script loading
- Missing env vars handled gracefully
- Browser DevTools Network tab verification
- Facebook Pixel Helper extension verification
- PostHog dashboard event verification

**Integration Testing** (manual):
- Full user flow: Banner → Accept → Verify tracking
- Full user flow: Banner → Reject → Verify no tracking
- Settings flow: Toggle Analytics on → Reload → Verify PostHog loads
- Settings flow: Toggle Marketing off → Reload → Verify FB Pixel doesn't load

## Notes

- PostHog snippet is the official array.js snippet (from PostHog docs)
- Facebook Pixel snippet is the official pixel base code (from Facebook Business)
- Scripts use `afterInteractive` strategy for optimal performance
- Scripts gracefully handle missing env vars (no crashes)
- TypeScript types for window.posthog and window.fbq prevent type errors
- Custom event tracking can be added after this plan is complete
- Consider adding custom PostHog/FB Pixel wrapper utilities for easier event tracking
- PostHog config includes `person_profiles: 'identified_only'` to reduce costs (only track identified users)

## Future Enhancements (Out of Scope)

- Custom event tracking utilities (wrapper functions)
- PostHog feature flags integration
- Facebook Conversion API (server-side tracking)
- Google Analytics integration (if needed)
- Error tracking integration (Sentry)
- Custom dashboards for analytics data
