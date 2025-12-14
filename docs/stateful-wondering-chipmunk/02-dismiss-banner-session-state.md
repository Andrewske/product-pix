# Escape Key Dismisses Banner (Session-Only)

## Files to Modify
- `src/components/cookie-consent/types.ts` (modify)
- `src/components/cookie-consent/cookie-consent-provider.tsx` (modify)
- `src/components/cookie-consent/cookie-consent-banner.tsx` (modify)

## Implementation Details

Add session-only `dismissedThisSession` state to provider (no persistence). This allows users to dismiss the banner with Escape, hiding it for the current session without saving any preference.

### types.ts

Add to `CookieConsentContextValue`:
```typescript
dismissedThisSession: boolean;
dismissBanner: () => void;
```

### cookie-consent-provider.tsx

Add state and expose in context:
```typescript
const [dismissedThisSession, setDismissedThisSession] = useState(false);
// ...
const dismissBanner = useCallback(() => setDismissedThisSession(true), []);
```

Include `dismissedThisSession` and `dismissBanner` in the context value object.

### cookie-consent-banner.tsx

Update destructuring and visibility logic:
```typescript
const { hasConsented, dismissedThisSession, dismissBanner, acceptAll, rejectAll, loading } = useCookieConsent();
// ...
if (hasConsented || dismissedThisSession || loading) return null;
```

Update Escape handler (line 28-32):
```typescript
if (e.key === 'Escape') {
  dismissBanner();
  return;
}
```

## Acceptance Criteria
- Pressing Escape on banner hides it visually
- Banner reappears on page reload (not persisted)
- TypeScript compiles without errors
- `bun test src/components/cookie-consent` passes (after test updates in task 04)

## Dependencies
None
