# Add data-testid to Privacy Tab Switches

## Files to Modify
- `src/components/settings/privacy-tab.tsx` (modify)
- `src/components/settings/__tests__/privacy-tab.test.tsx` (modify)

## Implementation Details

### privacy-tab.tsx

Add `data-testid` attributes to all Switch components:

**Essential Cookies Switch:**
```tsx
<Switch
  data-testid="essential-cookies-switch"
  checked
  disabled
  aria-label="Essential cookies switch (always enabled)"
/>
```

**Analytics Switch:**
```tsx
<Switch
  data-testid="analytics-switch"
  checked={consent.analytics}
  onCheckedChange={(checked) => handleToggle('analytics', checked)}
  aria-label="Enable analytics cookies for PostHog tracking"
/>
```

**Marketing Switch:**
```tsx
<Switch
  data-testid="marketing-switch"
  checked={consent.marketing}
  onCheckedChange={(checked) => handleToggle('marketing', checked)}
  aria-label="Enable marketing cookies for Facebook Pixel tracking"
/>
```

### privacy-tab.test.tsx

Replace brittle selectors like:
```typescript
const analyticsSwitch = screen.getByText('Analytics (PostHog)').parentElement?.querySelector('[data-slot="switch"]');
```

With robust selectors:
```typescript
const analyticsSwitch = screen.getByTestId('analytics-switch');
```

Update all affected tests:
- `it('essential cookies switch is disabled and checked'...)`
- `it('analytics toggle reflects current consent value'...)`
- `it('marketing toggle reflects current consent value'...)`
- `it('analytics toggle calls updateConsent when changed'...)`
- `it('marketing toggle calls updateConsent when changed'...)`
- `it('switches have proper accessibility labels'...)`

## Acceptance Criteria
- All three switches have data-testid attributes
- Tests use getByTestId instead of querySelector pattern
- `bun test src/components/settings/__tests__/privacy-tab.test.tsx` passes

## Dependencies
None
