# React Context Provider - Cookie Consent State Management

## Files to Create
- `src/components/cookie-consent/cookie-consent-provider.tsx` (new)
- `src/components/cookie-consent/use-cookie-consent.ts` (new)
- `src/components/cookie-consent/index.ts` (new)
- `src/components/cookie-consent/__tests__/cookie-consent-provider.test.tsx` (new)

## Implementation Details

### cookie-consent-provider.tsx

```typescript
'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from '@/lib/auth/hooks';
import type { CookieConsent, CookieConsentContextValue, CookieConsentUpdates } from '@/lib/cookie-consent';
import {
  saveConsentToLocalStorage,
  loadConsentFromLocalStorage,
  saveConsentToDatabase,
  loadConsentFromDatabase,
} from '@/lib/cookie-consent/storage';
import {
  syncConsentOnLogin,
  getDefaultConsent,
} from '@/lib/cookie-consent/sync';

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  // Consolidated auth state handler (fixes race condition)
  useEffect(() => {
    async function handleAuthStateChange() {
      setLoading(true);
      try {
        if (user) {
          // User logged in - sync localStorage → DB
          const localConsent = loadConsentFromLocalStorage();
          const dbConsent = await loadConsentFromDatabase(user.id);
          const merged = await syncConsentOnLogin(user.id, localConsent, dbConsent);
          setConsent(merged);
        } else {
          // User logged out - load from localStorage
          const localConsent = loadConsentFromLocalStorage();
          setConsent(localConsent || getDefaultConsent());
        }
      } catch (error) {
        console.error('Failed to initialize cookie consent:', error);
        // Fallback: use localStorage if available, otherwise default
        const localConsent = loadConsentFromLocalStorage();
        setConsent(localConsent || getDefaultConsent());
      } finally {
        setLoading(false);
      }
    }

    handleAuthStateChange();
  }, [user?.id]);

  // Update consent (functional state update fixes race condition)
  const updateConsent = useCallback(async (updates: Partial<CookieConsentUpdates>) => {
    let finalConsent: CookieConsent;

    // Functional update - always reads latest state
    setConsent(prev => {
      finalConsent = {
        ...prev!,
        ...updates,
        essential: true,  // Always true
        consentedAt: new Date().toISOString(),
      };
      return finalConsent;
    });

    // Optimistic update - save in background
    try {
      if (user) {
        await saveConsentToDatabase(user.id, { cookies: finalConsent });
      } else {
        saveConsentToLocalStorage(finalConsent);
      }
    } catch (error) {
      console.error('Failed to save cookie consent:', error);
      // Keep optimistic update (will sync on next login)
      // TODO: Show toast notification when Part 2 (UI) is ready
    }
  }, [user]);

  // Accept all
  const acceptAll = useCallback(async () => {
    await updateConsent({
      analytics: true,
      marketing: true,
    });
  }, [updateConsent]);

  // Reject all
  const rejectAll = useCallback(async () => {
    await updateConsent({
      analytics: false,
      marketing: false,
    });
  }, [updateConsent]);

  // Convenience getters
  const canUseAnalytics = useCallback(() => {
    return consent?.analytics === true;
  }, [consent]);

  const canUseMarketing = useCallback(() => {
    return consent?.marketing === true;
  }, [consent]);

  const hasConsented = consent?.consentedAt !== null;

  const value: CookieConsentContextValue = {
    consent,
    loading,
    hasConsented,
    updateConsent,
    acceptAll,
    rejectAll,
    canUseAnalytics,
    canUseMarketing,
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export const CookieConsentContext_INTERNAL = CookieConsentContext; // For testing
```

### use-cookie-consent.ts

```typescript
'use client';

import { useContext } from 'react';
import { CookieConsentContext_INTERNAL as CookieConsentContext } from './cookie-consent-provider';
import type { CookieConsentContextValue } from '@/lib/cookie-consent';

export function useCookieConsent(): CookieConsentContextValue {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return context;
}
```

### index.ts (barrel export)

```typescript
export { CookieConsentProvider } from './cookie-consent-provider';
export { useCookieConsent } from './use-cookie-consent';
```

### cookie-consent-provider.test.tsx

```typescript
import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { render, renderHook, waitFor } from '@testing-library/react';
import { CookieConsentProvider } from '../cookie-consent-provider';
import { useCookieConsent } from '../use-cookie-consent';

// Mock dependencies
mock.module('@/lib/auth/hooks', () => ({
  useUser: mock(() => ({ user: null }))
}));

mock.module('@/lib/cookie-consent/storage', () => ({
  saveConsentToLocalStorage: mock(() => {}),
  loadConsentFromLocalStorage: mock(() => null),
  saveConsentToDatabase: mock(async () => {}),
  loadConsentFromDatabase: mock(async () => null),
}));

describe('CookieConsentProvider', () => {
  // Test initialization, acceptAll, rejectAll, updateConsent
  // Expand based on requirements
});

describe('useCookieConsent', () => {
  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useCookieConsent());
    }).toThrow('useCookieConsent must be used within CookieConsentProvider');
  });
});
```

## Key Changes from Original Plan

**Critical Fix #1**: Consolidated provider effects.
- Original had THREE separate useEffects (init, login sync, logout sync)
- New approach: ONE consolidated auth state handler
- Eliminates race conditions from overlapping effects

**Critical Fix #4**: Functional state updates.
- `setConsent(prev => ...)` instead of `setConsent({ ...consent, ... })`
- Prevents stale closure issues in rapid updates
- Always reads latest state

**Critical Fix #5**: Error handling.
- Try/catch in auth state handler with fallback
- Try/catch in updateConsent with optimistic updates
- Graceful degradation on failures

## Hydration Strategy

**No hydration mismatches because**:
1. `'use client'` directive - component only renders on client
2. Loading state pattern:
   - Server: Component doesn't render (client-only)
   - Client mount: Shows loading state
   - Client hydration: Loads from localStorage, updates state

No `suppressHydrationWarning` needed (entire tree is client-only).

## Acceptance Criteria

- [ ] Provider initializes correctly (logged in: from DB, logged out: from localStorage)
- [ ] Auth state changes trigger re-initialization
- [ ] acceptAll() updates state and saves to storage
- [ ] rejectAll() updates state and saves to storage
- [ ] updateConsent() handles partial updates correctly
- [ ] Functional updates prevent race conditions
- [ ] Error handling doesn't crash app
- [ ] useCookieConsent throws error when used outside provider
- [ ] All tests pass: `bun test src/components/cookie-consent/__tests__/`
- [ ] ≥75% code coverage
- [ ] No hydration warnings in browser console

## Dependencies

**Prerequisites**:
- Phase 2 (Type Definitions)
- Phase 3 (Storage Layer)
- Phase 4 (Sync Logic)

**Internal Dependencies** (existing):
- `@/lib/auth/hooks` - useUser hook

**Used by**:
- Phase 6 (Root Integration)
- Phase 8 (Analytics Components)
