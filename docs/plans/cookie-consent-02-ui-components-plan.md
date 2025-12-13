# Cookie Consent System - Part 2: UI Components

## Overview

Build the user-facing UI components for cookie consent system including the bottom-corner consent banner and the Privacy settings tab with granular toggles.

**Prerequisites**: Part 1 (Foundation & State Management) must be completed first.

## Architecture Decisions

**Banner Design: Small bottom-corner placement**
- Rationale: Non-intrusive, matches PostHog's example design, aligns with ProductPix's minimal aesthetic
- Position: Fixed bottom-right, max-width 400px, responsive on mobile
- Tone: Playful and transparent ("We use cookies (the digital kind)")

**Banner Behavior: Show once per session**
- Rationale: Balance between compliance and UX
- Show if `hasConsented === false` (no consentedAt timestamp)
- Reappear every session until user makes a choice
- Not dismissible without choosing (Accept/Reject required)

**Settings Integration: New Privacy tab**
- Rationale: Follows existing tab pattern (Account, Billing, Credits)
- Granular toggles for Analytics (PostHog) and Marketing (Facebook Pixel)
- Essential cookies section (disabled toggle, always on)

## Implementation Tasks

### Phase 1: Cookie Consent Banner

- [ ] Create banner component structure
  - Files: `src/components/cookie-consent/cookie-consent-banner.tsx` (new)
  - Tests: `src/components/cookie-consent/__tests__/cookie-consent-banner.test.tsx` (new)
  - Acceptance: Banner renders, positioned correctly, accessible
  - Dependencies: Requires Part 1 (useCookieConsent hook)
  - Details:
    ```typescript
    'use client';

    import { useCookieConsent } from './use-cookie-consent';
    import { Button } from '@/components/ui/button';
    import Link from 'next/link';

    export function CookieConsentBanner() {
      const { hasConsented, acceptAll, rejectAll, loading } = useCookieConsent();

      // Don't show if user has already consented or still loading
      if (hasConsented || loading) return null;

      return (
        <div
          role="dialog"
          aria-labelledby="cookie-banner-title"
          aria-describedby="cookie-banner-description"
          className="fixed bottom-4 right-4 z-50 max-w-[400px] rounded-lg border border-border bg-card p-6 shadow-lg"
          style={{ maxWidth: 'calc(100vw - 2rem)' }} // Responsive on mobile
        >
          <h2 id="cookie-banner-title" className="text-lg font-semibold mb-2">
            We use cookies (the digital kind) 🍪
          </h2>
          <p id="cookie-banner-description" className="text-sm text-muted-foreground mb-4">
            PostHog helps us understand what works, and Facebook helps us show you relevant stuff.
            You can change your preferences anytime in settings.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={acceptAll}
              className="flex-1"
              variant="default"
            >
              Accept All
            </Button>
            <Button
              onClick={rejectAll}
              className="flex-1"
              variant="outline"
            >
              Reject All
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            <Link href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
          </p>
        </div>
      );
    }
    ```

- [ ] Write banner component tests
  - Files: `src/components/cookie-consent/__tests__/cookie-consent-banner.test.tsx` (new)
  - Tests: Self (unit tests)
  - Acceptance: Banner visibility logic works, buttons trigger correct functions
  - Details:
    - Mock useCookieConsent hook
    - Test banner hidden when hasConsented === true
    - Test banner hidden when loading === true
    - Test banner visible when hasConsented === false && loading === false
    - Test Accept All button calls acceptAll()
    - Test Reject All button calls rejectAll()
    - Test Privacy Policy link href

- [ ] Add accessibility features
  - Files: `src/components/cookie-consent/cookie-consent-banner.tsx` (modify)
  - Tests: Manual accessibility audit
  - Acceptance: WCAG AA compliant, keyboard navigable, screen reader friendly
  - Details:
    - Add focus trap (banner captures focus until choice made)
    - Keyboard navigation: Tab between buttons, Enter to activate, Escape to focus outside (no dismiss)
    - Ensure color contrast ≥4.5:1 (test with contrast checker)
    - Test with screen reader (announcement on mount)

- [ ] Update barrel export
  - Files: `src/components/cookie-consent/index.ts` (modify)
  - Tests: N/A
  - Acceptance: Can import CookieConsentBanner via `@/components/cookie-consent`
  - Details: Add `export { CookieConsentBanner } from './cookie-consent-banner';`

- [ ] Add banner to root layout
  - Files: `src/app/layout.tsx` (modify)
  - Tests: Manual verification
  - Acceptance: Banner renders on pages, positioned correctly, no hydration errors
  - Details:
    ```typescript
    // Add import
    import { CookieConsentBanner } from '@/components/cookie-consent';

    // Add to LayoutWrapper (inside CookieConsentProvider)
    <CookieConsentProvider>
      <LayoutWrapper>{children}</LayoutWrapper>
      <CookieConsentBanner />
    </CookieConsentProvider>
    ```

### Phase 2: Privacy Settings Tab

- [ ] Create PrivacyTab component
  - Files: `src/components/settings/privacy-tab.tsx` (new)
  - Tests: `src/components/settings/__tests__/privacy-tab.test.tsx` (new)
  - Acceptance: Tab renders, toggles work, updates consent
  - Dependencies:
    - Requires Part 1 (useCookieConsent hook)
    - Requires shadcn/ui components (Switch, Label, Card)
  - Details:
    ```typescript
    'use client';

    import { useCookieConsent } from '@/components/cookie-consent';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
    import { Label } from '@/components/ui/label';
    import { Switch } from '@/components/ui/switch';
    import { useCallback } from 'react';

    export function PrivacyTab() {
      const { consent, updateConsent, loading } = useCookieConsent();

      const handleToggle = useCallback((key: 'analytics' | 'marketing', value: boolean) => {
        updateConsent({ [key]: value });
      }, [updateConsent]);

      if (loading || !consent) {
        return <div>Loading preferences...</div>;
      }

      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Privacy Settings</h2>
            <p className="text-muted-foreground">
              Manage your cookie preferences and data collection settings.
            </p>
          </div>

          {/* Essential Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Essential Cookies
                <Switch checked disabled />
              </CardTitle>
              <CardDescription>
                Required for the site to function. These cookies enable core functionality
                like authentication and security. They cannot be disabled.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Analytics (PostHog)
                <Switch
                  checked={consent.analytics}
                  onCheckedChange={(checked) => handleToggle('analytics', checked)}
                />
              </CardTitle>
              <CardDescription>
                Help us understand how you use ProductPix. We use PostHog for product analytics
                and session recordings to improve your experience. No personal data is shared
                with third parties.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Marketing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Marketing (Facebook Pixel)
                <Switch
                  checked={consent.marketing}
                  onCheckedChange={(checked) => handleToggle('marketing', checked)}
                />
              </CardTitle>
              <CardDescription>
                Allow us to show you relevant ads and track conversion events. We use Facebook
                Pixel for advertising optimization. You can disable this without affecting
                core functionality.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Last Updated */}
          {consent.consentedAt && (
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date(consent.consentedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
      );
    }
    ```

- [ ] Write PrivacyTab tests
  - Files: `src/components/settings/__tests__/privacy-tab.test.tsx` (new)
  - Tests: Self (unit tests)
  - Acceptance: Toggles work, updateConsent called correctly
  - Details:
    - Mock useCookieConsent hook
    - Test loading state renders "Loading preferences..."
    - Test all three sections render (Essential, Analytics, Marketing)
    - Test Essential switch is disabled
    - Test Analytics toggle calls updateConsent({ analytics: true/false })
    - Test Marketing toggle calls updateConsent({ marketing: true/false })
    - Test last updated timestamp displays correctly

- [ ] Export PrivacyTab from settings
  - Files: `src/components/settings/index.ts` (modify)
  - Tests: N/A
  - Acceptance: Can import PrivacyTab via `@/components/settings`
  - Details: Add `export { PrivacyTab } from './privacy-tab';`

### Phase 3: Integrate Privacy Tab with Settings

- [ ] Add Privacy tab to SettingsTabs
  - Files: `src/components/settings/settings-tabs.tsx` (modify)
  - Tests: Manual verification
  - Acceptance: Privacy tab appears in tabs, routing works
  - Details:
    ```typescript
    // Add import
    import { PrivacyTab } from './privacy-tab';

    // Add tab trigger (line 24, after Credits trigger)
    <TabsTrigger value="privacy">Privacy</TabsTrigger>

    // Add tab content (line 36, after Credits content)
    <TabsContent value="privacy" className="space-y-6">
      <PrivacyTab />
    </TabsContent>
    ```

- [ ] Test tab navigation
  - Files: N/A (manual testing)
  - Tests: Manual
  - Acceptance: Can navigate to Privacy tab via URL (?tab=privacy) and UI click
  - Details:
    - Visit /settings?tab=privacy
    - Click Privacy tab trigger
    - Verify PrivacyTab component renders
    - Verify URL updates to ?tab=privacy

### Phase 4: Polish & Responsive Design

- [ ] Verify dark mode styling
  - Files: `src/components/cookie-consent/cookie-consent-banner.tsx` (modify if needed)
  - Tests: Manual dark mode verification
  - Acceptance: Banner looks correct in both light and dark modes
  - Details:
    - Test banner in dark mode (default theme)
    - Verify text contrast is readable
    - Verify card background is distinct from page background
    - Adjust colors if needed (use Tailwind dark: variants)

- [ ] Mobile responsiveness
  - Files:
    - `src/components/cookie-consent/cookie-consent-banner.tsx` (modify if needed)
    - `src/components/settings/privacy-tab.tsx` (modify if needed)
  - Tests: Manual mobile testing
  - Acceptance: Banner and settings work on mobile (320px+)
  - Details:
    - Banner: Stack buttons vertically on mobile (flex-col sm:flex-row)
    - Banner: Reduce padding on mobile if needed
    - Settings: Cards stack properly on mobile
    - Settings: Switch labels wrap correctly

- [ ] Test with real user flow
  - Files: N/A (manual E2E testing)
  - Tests: Manual
  - Acceptance: Full flow works smoothly
  - Details:
    - As anonymous user: See banner → Accept All → Banner disappears → Check localStorage
    - As anonymous user: See banner → Reject All → Banner disappears → Check localStorage
    - As logged-in user: Go to Settings → Privacy tab → Toggle Analytics off → Reload page → Verify persisted
    - As logged-in user: Accept in banner → Go to Settings → Verify toggles reflect choice

## Acceptance Criteria

- [ ] Cookie banner renders on first visit (logged in and logged out)
- [ ] Banner positioned bottom-right, responsive on mobile
- [ ] Accept All button enables both analytics and marketing
- [ ] Reject All button disables both analytics and marketing
- [ ] Banner disappears after user makes choice
- [ ] Privacy tab appears in Settings tabs
- [ ] Privacy tab toggles work (Analytics, Marketing)
- [ ] Essential cookies toggle is disabled (always on)
- [ ] Toggle changes persist (localStorage for logged out, database for logged in)
- [ ] Last updated timestamp displays correctly
- [ ] Dark mode styling looks correct
- [ ] Mobile responsive (works on 320px+ screens)
- [ ] WCAG AA accessibility compliance
- [ ] Keyboard navigation works
- [ ] No console errors or warnings
- [ ] No hydration mismatches

## Files to Create

**Components**:
- `src/components/cookie-consent/cookie-consent-banner.tsx` - Banner UI
- `src/components/settings/privacy-tab.tsx` - Settings tab UI

**Tests**:
- `src/components/cookie-consent/__tests__/cookie-consent-banner.test.tsx` - Banner tests
- `src/components/settings/__tests__/privacy-tab.test.tsx` - Privacy tab tests

## Files to Modify

- `src/components/cookie-consent/index.ts` - Export banner
- `src/components/settings/index.ts` - Export PrivacyTab
- `src/components/settings/settings-tabs.tsx` - Add Privacy tab
- `src/app/layout.tsx` - Add banner to layout

## Dependencies

**Internal**:
- Part 1 (Foundation) must be completed first
- `@/components/cookie-consent` - useCookieConsent hook (from Part 1)
- `@/components/ui/button` - shadcn/ui Button
- `@/components/ui/card` - shadcn/ui Card components
- `@/components/ui/switch` - shadcn/ui Switch
- `@/components/ui/label` - shadcn/ui Label

**External**:
- None (uses existing dependencies)

## Testing Strategy

**Unit Tests**:
- Banner: Mock useCookieConsent, test visibility logic, button clicks
- PrivacyTab: Mock useCookieConsent, test toggle interactions

**Manual Testing**:
- Banner appearance on first visit
- Accept/Reject flow
- Settings tab navigation
- Toggle persistence
- Mobile responsiveness (Chrome DevTools)
- Dark mode verification
- Keyboard navigation
- Screen reader testing (optional but recommended)

**Accessibility Audit**:
- Color contrast checker (WebAIM or Chrome DevTools)
- Keyboard-only navigation test
- Screen reader test (NVDA, VoiceOver, or JAWS)
- Focus indicators visible

## Notes

- Banner copy is playful but can be adjusted based on user feedback
- Privacy tab follows existing tab pattern (Account, Billing, Credits)
- No backend changes needed (Part 1 handles all storage)
- Part 3 will wire up PostHog and Facebook Pixel based on consent state
