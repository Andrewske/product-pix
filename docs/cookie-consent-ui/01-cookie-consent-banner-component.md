# Cookie Consent Banner Component

## Files to Modify/Create
- `src/components/cookie-consent/cookie-consent-banner.tsx` (new)
- `src/components/cookie-consent/__tests__/cookie-consent-banner.test.tsx` (new)
- `src/components/cookie-consent/index.ts` (modify)

## Implementation Details

Create the cookie consent banner component that appears in the bottom-right corner for users who haven't consented yet.

### Banner Component (`cookie-consent-banner.tsx`)

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
        We use cookies (the digital kind)
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

### Test File (`__tests__/cookie-consent-banner.test.tsx`)

Write tests covering:
- Banner hidden when `hasConsented === true`
- Banner hidden when `loading === true`
- Banner visible when `hasConsented === false && loading === false`
- Accept All button calls `acceptAll()`
- Reject All button calls `rejectAll()`
- Privacy Policy link href is `/privacy`
- Accessibility: role="dialog", aria-labelledby, aria-describedby

### Barrel Export (`index.ts`)

Add to existing exports:
```typescript
export { CookieConsentBanner } from './cookie-consent-banner';
```

## Acceptance Criteria
- [ ] Banner renders when `hasConsented === false` and `loading === false`
- [ ] Banner is hidden when user has already consented
- [ ] Banner is hidden while loading consent state
- [ ] Accept All button triggers `acceptAll()` from hook
- [ ] Reject All button triggers `rejectAll()` from hook
- [ ] Privacy Policy link navigates to `/privacy`
- [ ] ARIA attributes present for accessibility
- [ ] All tests pass

## Dependencies
- Requires existing `useCookieConsent` hook from `@/components/cookie-consent`
- Requires `@/components/ui/button` (shadcn/ui)
