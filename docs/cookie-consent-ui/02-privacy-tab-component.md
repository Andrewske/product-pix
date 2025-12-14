# Privacy Tab Component

## Files to Modify/Create
- `src/components/settings/privacy-tab.tsx` (new)
- `src/components/settings/__tests__/privacy-tab.test.tsx` (new)
- `src/components/settings/index.ts` (modify)

## Implementation Details

Create the Privacy settings tab with granular cookie toggles for Analytics and Marketing.

### PrivacyTab Component (`privacy-tab.tsx`)

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

### Test File (`__tests__/privacy-tab.test.tsx`)

Write tests covering:
- Loading state renders "Loading preferences..."
- All three sections render (Essential, Analytics, Marketing)
- Essential switch is disabled (always on)
- Analytics toggle calls `updateConsent({ analytics: true/false })`
- Marketing toggle calls `updateConsent({ marketing: true/false })`
- Last updated timestamp displays correctly when `consentedAt` present
- No timestamp shown when `consentedAt` is null

### Barrel Export (`index.ts`)

Add to existing exports:
```typescript
export { PrivacyTab } from './privacy-tab';
```

## Acceptance Criteria
- [ ] Loading state shows "Loading preferences..."
- [ ] Three card sections render (Essential, Analytics, Marketing)
- [ ] Essential cookies switch is disabled and checked
- [ ] Analytics toggle is functional and calls `updateConsent`
- [ ] Marketing toggle is functional and calls `updateConsent`
- [ ] Toggle states reflect current consent values
- [ ] Last updated timestamp shows when consent exists
- [ ] All tests pass

## Dependencies
- Requires existing `useCookieConsent` hook from `@/components/cookie-consent`
- Requires `@/components/ui/card` (shadcn/ui Card, CardHeader, CardTitle, CardDescription)
- Requires `@/components/ui/switch` (shadcn/ui)
- Requires `@/components/ui/label` (shadcn/ui)
