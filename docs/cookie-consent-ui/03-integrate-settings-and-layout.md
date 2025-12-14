# Integrate Privacy Tab and Banner into App

## Files to Modify/Create
- `src/components/settings/settings-tabs.tsx` (modify)
- `src/app/layout.tsx` (modify)

## Implementation Details

### Add Privacy Tab to Settings (`settings-tabs.tsx`)

Add the Privacy tab to the existing settings tabs component.

**Import:**
```typescript
import { PrivacyTab } from './privacy-tab';
```

**Add Tab Trigger** (after Credits trigger):
```typescript
<TabsTrigger value="privacy">Privacy</TabsTrigger>
```

**Add Tab Content** (after Credits content):
```typescript
<TabsContent value="privacy" className="space-y-6">
  <PrivacyTab />
</TabsContent>
```

### Add Banner to Root Layout (`layout.tsx`)

Add the cookie consent banner to the root layout so it appears on all pages.

**Import:**
```typescript
import { CookieConsentBanner } from '@/components/cookie-consent';
```

**Add to LayoutWrapper** (inside CookieConsentProvider, typically after children):
```typescript
<CookieConsentProvider>
  <LayoutWrapper>{children}</LayoutWrapper>
  <CookieConsentBanner />
</CookieConsentProvider>
```

Note: The banner must be inside `CookieConsentProvider` to access the consent context.

## Acceptance Criteria
- [ ] Privacy tab appears in Settings tabs navigation
- [ ] Clicking Privacy tab shows PrivacyTab component
- [ ] URL updates to `?tab=privacy` when Privacy tab selected
- [ ] Direct navigation to `/settings?tab=privacy` works
- [ ] Cookie consent banner renders on all pages when user hasn't consented
- [ ] Banner is positioned correctly (bottom-right)
- [ ] No hydration errors or console warnings
- [ ] Tab order in Settings: Account, Billing, Credits, Privacy

## Dependencies
- Task 01: Cookie consent banner component must be complete
- Task 02: Privacy tab component must be complete

## Verification Steps
1. Visit `/settings` - verify Privacy tab appears
2. Click Privacy tab - verify PrivacyTab renders
3. Visit `/settings?tab=privacy` directly - verify Privacy tab is selected
4. Clear localStorage consent - verify banner appears on any page
5. Accept/Reject in banner - verify banner disappears
6. Check browser console for errors
