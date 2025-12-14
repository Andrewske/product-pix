# Root Integration and Environment Configuration

## Files to Modify
- `src/app/layout.tsx` (modify)
- `.env.example` (modify)

## Files to Create (not committed)
- `.env.local` (modify - local only)

## Implementation Details

### src/app/layout.tsx

Add both providers to root layout:

```typescript
import { CookieConsentProvider } from '@/components/cookie-consent';
import { AnalyticsScripts } from '@/components/analytics';

// In return statement:
return (
  <html lang="en" suppressHydrationWarning>
    <body className={`${geist.className} antialiased`}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <CookieConsentProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
          <CookieConsentBanner />
          <AnalyticsScripts />
        </CookieConsentProvider>
      </ThemeProvider>
    </body>
  </html>
);
```

**Order matters**:
1. `CookieConsentProvider` wraps everything (provides consent state)
2. `LayoutWrapper` and `CookieConsentBanner` inside provider (can use `useCookieConsent`)
3. `AnalyticsScripts` at end (loads scripts based on consent)

### .env.local (not committed)

```bash
# PostHog Analytics
NEXT_PUBLIC_POSTHOG_API_KEY=phc_your_actual_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Facebook Pixel
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=your_pixel_id_here
```

**Note**: Get actual keys from:
- PostHog: https://app.posthog.com/project/settings
- Facebook Pixel: https://business.facebook.com/events_manager

### .env.example (document for team)

```bash
# Analytics & Tracking (optional)
# PostHog API key for product analytics and session recording
NEXT_PUBLIC_POSTHOG_API_KEY=phc_xxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Facebook Pixel ID for marketing conversion tracking
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=123456789
```

## Acceptance Criteria

- [ ] CookieConsentProvider wraps application in layout.tsx
- [ ] AnalyticsScripts rendered inside CookieConsentProvider
- [ ] No hydration errors in browser console
- [ ] No runtime errors on page load
- [ ] Environment variables documented in .env.example
- [ ] Local .env.local configured with actual keys (not committed)
- [ ] TypeScript compiles without errors
- [ ] App runs: `bun dev`
- [ ] Page loads without console errors

## Manual Testing Checklist

### Consent State
- [ ] Page loads, consent banner shows (Part 2 dependency)
- [ ] Default state: all false (analytics/marketing rejected)
- [ ] Accept all → consent state updates
- [ ] Reject all → consent state updates

### Analytics Integration
- [ ] Accept analytics → PostHog script loads
- [ ] Check Network tab: us.i.posthog.com requests
- [ ] Console: `window.posthog` exists
- [ ] Navigate pages → PageView events tracked
- [ ] Reject analytics → Reload → PostHog doesn't load

### Facebook Pixel
- [ ] Accept marketing → FB Pixel script loads
- [ ] Check Network tab: connect.facebook.net requests
- [ ] Console: `window.fbq` exists
- [ ] Navigate pages → PageView events tracked
- [ ] Reject marketing → Reload → FB Pixel doesn't load

### Auth State Sync
- [ ] Logged out: Set consent in banner
- [ ] Log in → Consent persists (synced to database)
- [ ] Log out → Consent persists (synced to localStorage)
- [ ] Different device login → Consent synced from database

### Error Handling
- [ ] Remove POSTHOG_API_KEY from .env.local
- [ ] Reload → Warning in console (dev mode)
- [ ] App doesn't crash
- [ ] Accept analytics → No PostHog (graceful degradation)

## Dependencies

**Prerequisites**:
- Phase 5 (React Provider) - CookieConsentProvider
- Phase 7 (Analytics Components) - AnalyticsScripts

**Assumes Part 2 exists**:
- CookieConsentBanner component (not implemented in this plan)
- If Part 2 doesn't exist, remove `<CookieConsentBanner />` line

## Notes

**Environment Variables**:
- `NEXT_PUBLIC_` prefix required for client-side access
- Variables loaded at build time (restart dev server after changes)
- Missing variables don't crash app (graceful degradation)

**CSP Compliance**:
- NPM packages (Phase 6) ensure CSP compatibility
- If adding CSP headers later, no code changes needed

**Production Deployment**:
- Add env vars to Vercel/hosting platform
- Test in staging environment first
- Verify PostHog/FB Pixel work in production
- Check browser console for errors
