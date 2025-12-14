# Type Definitions - Cookie Consent Types

## Files to Create
- `src/lib/cookie-consent/types.ts` (new)
- `src/lib/cookie-consent/index.ts` (new)

## Implementation Details

### types.ts

```typescript
// Base consent interface
export interface CookieConsent {
  analytics: boolean;      // PostHog
  marketing: boolean;      // Facebook Pixel
  essential: boolean;      // Always true (non-toggleable)
  consentedAt: string | null;  // ISO timestamp
}

// Updatable fields only (excludes essential, enforces type safety)
export type CookieConsentUpdates = Pick<CookieConsent, 'analytics' | 'marketing'>;

// Context value interface
export interface CookieConsentContextValue {
  consent: CookieConsent | null;
  loading: boolean;
  hasConsented: boolean;  // Derived from consentedAt !== null
  updateConsent: (updates: Partial<CookieConsentUpdates>) => Promise<void>;
  acceptAll: () => Promise<void>;
  rejectAll: () => Promise<void>;
  canUseAnalytics: () => boolean;
  canUseMarketing: () => boolean;
}
```

### index.ts (barrel export)

```typescript
export * from './types';
```

## Key Changes from Original Plan

**Critical Fix #8**: Type-safe updates prevent essential field modification.

- **Removed**: `version` field (YAGNI - can add later if schema evolves)
- **Added**: `CookieConsentUpdates` type (type-safe subset for updates)
- **Changed**: `updateConsent` accepts `Partial<CookieConsentUpdates>` instead of `Partial<CookieConsent>`

**Why CookieConsentUpdates?**
- TypeScript prevents `updateConsent({ essential: false })` at compile time
- Also prevents updating `consentedAt` (managed internally)
- Self-documenting: type signature shows exactly what's updatable

## Acceptance Criteria

- [ ] All types compile without errors
- [ ] Can import via `@/lib/cookie-consent`
- [ ] TypeScript prevents updating `essential` field
- [ ] TypeScript prevents updating `consentedAt` manually
- [ ] `CookieConsentUpdates` only contains `analytics` and `marketing`

## Dependencies

**Prerequisites**: None

**Used by**:
- Phase 3 (Storage Layer)
- Phase 4 (Sync Logic)
- Phase 5 (React Provider)
