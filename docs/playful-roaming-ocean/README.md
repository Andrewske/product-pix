# Cookie Consent System - Implementation Tasks

## Overview

Implementation plan for cookie consent system with fixes for race conditions, data loss scenarios, and architectural improvements. Addresses all critical, high, and medium severity issues from plan review.

## Task Sequence

Execute in order (dependencies flow downward):

### 1. [Database Migration](./01-database-migration.md)
**Files**: `supabase/migrations/00035_create_update_user_preferences_rpc.sql`

Create PostgreSQL RPC function for atomic JSONB preference updates. Prevents data loss when updating user preferences.

**Critical Fix #2**: RPC function with JSONB merge prevents overwriting other preference fields.

---

### 2. [Type Definitions](./02-type-definitions.md)
**Files**: `src/lib/cookie-consent/types.ts`, `src/lib/cookie-consent/index.ts`

Define TypeScript interfaces for cookie consent, including type-safe update subset.

**Critical Fix #8**: `CookieConsentUpdates` type prevents essential field modification at compile time.

---

### 3. [Storage Layer](./03-storage-layer.md)
**Files**: `src/lib/cookie-consent/storage.ts`, `src/lib/cookie-consent/__tests__/storage.test.ts`

Implement localStorage and database operations with Bun test examples.

**Dependencies**: Tasks 1, 2

---

### 4. [Sync Logic](./04-sync-logic.md)
**Files**: `src/lib/cookie-consent/sync.ts`, `src/lib/cookie-consent/__tests__/sync.test.ts`

Handle localStorage ↔ database synchronization on auth state changes.

**Critical Fix #3**: Safe localStorage clearing (only after confirmed database save).

**Dependencies**: Tasks 2, 3

---

### 5. [React Provider](./05-react-provider.md)
**Files**:
- `src/components/cookie-consent/cookie-consent-provider.tsx`
- `src/components/cookie-consent/use-cookie-consent.ts`
- `src/components/cookie-consent/index.ts`
- `src/components/cookie-consent/__tests__/cookie-consent-provider.test.tsx`

React Context provider for global consent state management.

**Critical Fixes**:
- #1: Consolidated auth state handler (eliminates race conditions)
- #4: Functional state updates (prevents stale closure)
- #5: Comprehensive error handling

**Dependencies**: Tasks 2, 3, 4

---

### 6. [Install Analytics Dependencies](./06-install-analytics-dependencies.md)
**Command**: `bun add posthog-js react-facebook-pixel`

Install NPM packages for CSP-compliant analytics.

**Critical Fix #9**: NPM packages instead of inline scripts for CSP compliance.

---

### 7. [Analytics Components](./07-analytics-components.md)
**Files**:
- `src/types/global.d.ts`
- `src/components/analytics/posthog-script.tsx`
- `src/components/analytics/facebook-pixel-script.tsx`
- `src/components/analytics/analytics-scripts.tsx`
- `src/components/analytics/index.ts`

PostHog and Facebook Pixel integration with conditional loading.

**Critical Fixes**:
- #7: Anonymous tracking (`person_profiles: 'always'`)
- #11: Manual PageView tracking (ensures initial pageview captured)

**Dependencies**: Tasks 5, 6

---

### 8. [Root Integration and Environment](./08-root-integration-and-environment.md)
**Files**: `src/app/layout.tsx` (modify), `.env.example` (modify), `.env.local` (local)

Wire everything together in root layout + configure environment variables.

**Dependencies**: Tasks 5, 7

---

## Quick Start

```bash
# 1. Run database migration
npx supabase db push

# 2. Install analytics packages
bun add posthog-js react-facebook-pixel

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with actual API keys

# 4. Implement tasks 1-8 in order
# 5. Run tests
bun test src/lib/cookie-consent
bun test src/components/cookie-consent

# 6. Start dev server
bun dev
```

## Testing Strategy

**Unit Tests** (Bun):
- Storage: Mock localStorage, mock Supabase RPC
- Sync: Mock storage functions, test all merge scenarios
- Provider: Mock useUser, storage, sync functions

**Manual Testing**:
- Consent state initialization (logged in/out)
- Auth state transitions (login/logout)
- PostHog/FB Pixel loading based on consent
- Route change tracking
- Missing env vars (graceful degradation)

## Acceptance Criteria

- [ ] All TypeScript compiles without errors
- [ ] All tests pass with ≥75% coverage
- [ ] No race conditions in provider effects
- [ ] No data loss in localStorage clearing or database saves
- [ ] Functional state updates prevent stale closure issues
- [ ] Type system prevents essential field modification
- [ ] PostHog tracks anonymous users with consent
- [ ] Initial pageview reliably tracked
- [ ] Route changes trigger pageview events
- [ ] Missing env vars don't crash app
- [ ] No hydration mismatches
- [ ] CSP-compliant (npm packages, no inline scripts)

## Critical Fixes Summary

1. **Race condition**: Consolidated three useEffects into single auth handler
2. **Data loss**: RPC function with JSONB merge prevents overwriting preferences
3. **Data loss**: localStorage cleared only after confirmed database save
4. **Race condition**: Functional state updates in updateConsent
5. **Error handling**: Try/catch with fallbacks in provider
6. **Type safety**: CookieConsentUpdates type prevents invalid updates
7. **Anonymous tracking**: PostHog person_profiles: 'always'
8. **CSP compliance**: NPM packages instead of inline scripts
9. **Pageview tracking**: Manual tracking ensures initial pageview captured

## Notes

- Part 2 (UI: Banner and Settings) not included in this plan
- If implementing without Part 2, remove `<CookieConsentBanner />` from layout.tsx
- All changes maintain compatibility with future Part 2 implementation
- Follows existing codebase patterns (React Context, Bun tests, FP style)
