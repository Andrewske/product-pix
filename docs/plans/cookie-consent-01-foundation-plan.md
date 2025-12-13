# Cookie Consent System - Part 1: Foundation & State Management

## Overview

Build the foundational layer for cookie consent system including TypeScript types, storage abstraction (database + localStorage), sync logic between storage layers, and React Context provider for global state management.

This plan establishes the core infrastructure without UI. Parts 2 and 3 will build on this foundation.

## Architecture Decisions

**Storage Strategy: Dual-layer (Database + localStorage)**
- Rationale: Support both logged-in users (persistent across devices) and logged-out users (immediate functionality)
- Logged-in: Store in `users.preferences.cookies` JSONB column
- Logged-out: Store in `localStorage` key `productpix_cookie_consent`
- Sync on auth state changes (login/logout)

**State Management: React Context**
- Rationale: Matches existing ThemeProvider pattern, no new dependencies
- Alternative considered: Zustand (rejected: not used in codebase, overkill for this use case)

**Sync Logic: localStorage wins on login**
- Rationale: Assumes user made most recent choice on current device
- Timestamp comparison prevents stale data from overwriting recent choices
- Bidirectional: Login (localStorage → DB), Logout (DB → localStorage)

## Implementation Tasks

### Phase 1: Type Definitions

- [ ] Create TypeScript types for cookie consent
  - Files: `src/lib/cookie-consent/types.ts` (new)
  - Tests: N/A (type definitions)
  - Acceptance: TypeScript compiles without errors
  - Details:
    ```typescript
    // Define CookieConsent interface
    export interface CookieConsent {
      analytics: boolean;      // PostHog
      marketing: boolean;      // Facebook Pixel
      essential: boolean;      // Always true (non-toggleable)
      consentedAt: string | null;  // ISO timestamp
      version: number;         // Schema version (start with 1)
    }

    // Define Context value interface
    export interface CookieConsentContextValue {
      consent: CookieConsent | null;
      loading: boolean;
      hasConsented: boolean;  // Derived from consentedAt !== null
      updateConsent: (updates: Partial<CookieConsent>) => Promise<void>;
      acceptAll: () => Promise<void>;
      rejectAll: () => Promise<void>;
      canUseAnalytics: () => boolean;
      canUseMarketing: () => boolean;
    }
    ```

- [ ] Create barrel export for cookie-consent lib
  - Files: `src/lib/cookie-consent/index.ts` (new)
  - Tests: N/A
  - Acceptance: Can import types via `@/lib/cookie-consent`
  - Details: Export all types from types.ts

### Phase 2: Storage Abstraction Layer

- [ ] Implement localStorage utilities
  - Files: `src/lib/cookie-consent/storage.ts` (new)
  - Tests: `src/lib/cookie-consent/__tests__/storage.test.ts` (new)
  - Acceptance: All localStorage operations work, handle edge cases
  - Details:
    ```typescript
    const STORAGE_KEY = 'productpix_cookie_consent';

    // Save consent to localStorage
    export function saveConsentToLocalStorage(consent: CookieConsent): void {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
      } catch (error) {
        console.error('Failed to save consent to localStorage:', error);
        // Graceful degradation: continue without localStorage
      }
    }

    // Load consent from localStorage
    export function loadConsentFromLocalStorage(): CookieConsent | null {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;
        return JSON.parse(stored) as CookieConsent;
      } catch (error) {
        console.error('Failed to load consent from localStorage:', error);
        return null;
      }
    }

    // Clear localStorage consent
    export function clearLocalStorageConsent(): void {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error('Failed to clear localStorage consent:', error);
      }
    }
    ```

- [ ] Implement database utilities
  - Files: `src/lib/cookie-consent/storage.ts` (modify)
  - Tests: `src/lib/cookie-consent/__tests__/storage.test.ts` (modify)
  - Acceptance: Database operations work, integrate with existing `updateUser()` function
  - Dependencies: Requires `src/lib/db/users.ts` (exists)
  - Details:
    ```typescript
    import { updateUser, getCurrentUser } from '@/lib/db/users';

    // Save consent to database (users.preferences.cookies)
    export async function saveConsentToDatabase(
      userId: string,
      consent: CookieConsent
    ): Promise<void> {
      try {
        await updateUser(userId, {
          preferences: {
            cookies: consent
          }
        });
      } catch (error) {
        console.error('Failed to save consent to database:', error);
        throw error; // Propagate for retry logic
      }
    }

    // Load consent from database
    export async function loadConsentFromDatabase(
      userId: string
    ): Promise<CookieConsent | null> {
      try {
        const user = await getCurrentUser();
        if (!user?.preferences) return null;

        const prefs = user.preferences as any; // JSONB type
        return prefs.cookies || null;
      } catch (error) {
        console.error('Failed to load consent from database:', error);
        return null;
      }
    }
    ```

- [ ] Write storage layer tests
  - Files: `src/lib/cookie-consent/__tests__/storage.test.ts` (new)
  - Tests: Self (unit tests)
  - Acceptance: 100% coverage of storage.ts
  - Details:
    - Mock localStorage (use bun:test mock)
    - Mock database functions (mock @/lib/db/users)
    - Test success paths
    - Test error handling (localStorage full, database errors)
    - Test null/undefined cases

### Phase 3: Sync Logic

- [ ] Implement default consent helper
  - Files: `src/lib/cookie-consent/sync.ts` (new)
  - Tests: `src/lib/cookie-consent/__tests__/sync.test.ts` (new)
  - Acceptance: Returns consistent default state
  - Details:
    ```typescript
    import type { CookieConsent } from './types';

    export function getDefaultConsent(): CookieConsent {
      return {
        analytics: false,
        marketing: false,
        essential: true,  // Always true
        consentedAt: null, // No consent yet
        version: 1
      };
    }
    ```

- [ ] Implement login sync logic
  - Files: `src/lib/cookie-consent/sync.ts` (modify)
  - Tests: `src/lib/cookie-consent/__tests__/sync.test.ts` (modify)
  - Acceptance: Correctly merges localStorage and database consent
  - Details:
    ```typescript
    export async function syncConsentOnLogin(
      userId: string,
      localConsent: CookieConsent | null,
      dbConsent: CookieConsent | null
    ): Promise<CookieConsent> {
      // No consent anywhere: return default
      if (!localConsent && !dbConsent) {
        return getDefaultConsent();
      }

      // Only local consent exists: save to DB
      if (!dbConsent && localConsent) {
        await saveConsentToDatabase(userId, localConsent);
        clearLocalStorageConsent(); // Now in DB
        return localConsent;
      }

      // Only DB consent exists: use it
      if (!localConsent && dbConsent) {
        return dbConsent;
      }

      // Both exist: use newer one (compare timestamps)
      const localTime = new Date(localConsent!.consentedAt || 0).getTime();
      const dbTime = new Date(dbConsent!.consentedAt || 0).getTime();

      const winner = localTime > dbTime ? localConsent! : dbConsent!;

      // Save winner to DB if it was local
      if (winner === localConsent) {
        await saveConsentToDatabase(userId, localConsent!);
      }

      clearLocalStorageConsent(); // Synced to DB
      return winner;
    }
    ```

- [ ] Implement logout sync logic
  - Files: `src/lib/cookie-consent/sync.ts` (modify)
  - Tests: `src/lib/cookie-consent/__tests__/sync.test.ts` (modify)
  - Acceptance: Copies database consent to localStorage on logout
  - Details:
    ```typescript
    export async function syncConsentOnLogout(
      dbConsent: CookieConsent | null
    ): Promise<void> {
      if (dbConsent) {
        saveConsentToLocalStorage(dbConsent);
      }
    }
    ```

- [ ] Write sync logic tests
  - Files: `src/lib/cookie-consent/__tests__/sync.test.ts` (new)
  - Tests: Self (unit tests)
  - Acceptance: 100% coverage of sync.ts, all merge scenarios tested
  - Details:
    - Test no consent anywhere (returns default)
    - Test only localStorage consent (saves to DB)
    - Test only database consent (returns it)
    - Test both exist, localStorage newer (localStorage wins)
    - Test both exist, database newer (database wins)
    - Test logout sync (DB → localStorage)
    - Mock storage functions (saveConsentToDatabase, etc.)

### Phase 4: React Context Provider

- [ ] Create CookieConsentProvider component
  - Files: `src/components/cookie-consent/cookie-consent-provider.tsx` (new)
  - Tests: `src/components/cookie-consent/__tests__/cookie-consent-provider.test.tsx` (new)
  - Acceptance: Provider initializes state, listens to auth changes, provides context value
  - Dependencies:
    - Requires `src/lib/cookie-consent/storage.ts` (from Phase 2)
    - Requires `src/lib/cookie-consent/sync.ts` (from Phase 3)
    - Requires `src/lib/auth/hooks.ts` (exists: useUser hook)
  - Details:
    ```typescript
    'use client';

    import { createContext, useContext, useState, useEffect, useCallback } from 'react';
    import { useUser } from '@/lib/auth/hooks';
    import type { CookieConsent, CookieConsentContextValue } from '@/lib/cookie-consent';
    import {
      saveConsentToLocalStorage,
      loadConsentFromLocalStorage,
      saveConsentToDatabase,
      loadConsentFromDatabase,
    } from '@/lib/cookie-consent/storage';
    import {
      syncConsentOnLogin,
      syncConsentOnLogout,
      getDefaultConsent,
    } from '@/lib/cookie-consent/sync';

    const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

    export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
      const [consent, setConsent] = useState<CookieConsent | null>(null);
      const [loading, setLoading] = useState(true);
      const { user } = useUser();

      // Initialize consent on mount
      useEffect(() => {
        async function initConsent() {
          setLoading(true);
          try {
            if (user) {
              // Logged in: load from database
              const dbConsent = await loadConsentFromDatabase(user.id);
              setConsent(dbConsent || getDefaultConsent());
            } else {
              // Logged out: load from localStorage
              const localConsent = loadConsentFromLocalStorage();
              setConsent(localConsent || getDefaultConsent());
            }
          } catch (error) {
            console.error('Failed to initialize consent:', error);
            setConsent(getDefaultConsent());
          } finally {
            setLoading(false);
          }
        }
        initConsent();
      }, [user?.id]); // Re-run when auth state changes

      // Sync on login
      useEffect(() => {
        if (!user || !consent) return;

        async function handleLogin() {
          const localConsent = loadConsentFromLocalStorage();
          const dbConsent = await loadConsentFromDatabase(user!.id);
          const merged = await syncConsentOnLogin(user!.id, localConsent, dbConsent);
          setConsent(merged);
        }
        handleLogin();
      }, [user?.id]);

      // Sync on logout
      useEffect(() => {
        if (user || !consent) return;

        async function handleLogout() {
          await syncConsentOnLogout(consent);
        }
        handleLogout();
      }, [user?.id, consent]);

      // Update consent (saves to current storage layer)
      const updateConsent = useCallback(async (updates: Partial<CookieConsent>) => {
        const updated: CookieConsent = {
          ...consent!,
          ...updates,
          consentedAt: new Date().toISOString(),
        };
        setConsent(updated);

        // Save to appropriate storage
        if (user) {
          await saveConsentToDatabase(user.id, updated);
        } else {
          saveConsentToLocalStorage(updated);
        }
      }, [consent, user]);

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

- [ ] Create useCookieConsent hook
  - Files: `src/components/cookie-consent/use-cookie-consent.ts` (new)
  - Tests: N/A (tested via provider tests)
  - Acceptance: Hook consumes context, throws error if used outside provider
  - Details:
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

- [ ] Create barrel export for cookie-consent components
  - Files: `src/components/cookie-consent/index.ts` (new)
  - Tests: N/A
  - Acceptance: Can import provider and hook via `@/components/cookie-consent`
  - Details: Export CookieConsentProvider and useCookieConsent

- [ ] Write provider tests
  - Files: `src/components/cookie-consent/__tests__/cookie-consent-provider.test.tsx` (new)
  - Tests: Self (integration tests)
  - Acceptance: Provider initializes correctly, handles auth changes, updates state
  - Details:
    - Mock useUser hook (logged in vs logged out states)
    - Mock storage functions
    - Mock sync functions
    - Test initialization (logged in: loads from DB, logged out: loads from localStorage)
    - Test acceptAll() updates state and saves to storage
    - Test rejectAll() updates state and saves to storage
    - Test updateConsent() with partial updates
    - Test canUseAnalytics() and canUseMarketing() getters
    - Test hasConsented derived property

### Phase 5: Root Integration

- [ ] Add CookieConsentProvider to root layout
  - Files: `src/app/layout.tsx` (modify)
  - Tests: Manual verification (no automated test needed)
  - Acceptance: Provider wraps app, no hydration errors
  - Details:
    ```typescript
    // Add import
    import { CookieConsentProvider } from '@/components/cookie-consent';

    // Modify return statement (wrap inside ThemeProvider)
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
            </CookieConsentProvider>
          </ThemeProvider>
        </body>
      </html>
    );
    ```

## Acceptance Criteria

- [ ] All TypeScript compiles without errors
- [ ] All tests pass with ≥75% coverage
- [ ] Storage layer handles localStorage and database operations
- [ ] Sync logic correctly merges consent between storage layers
- [ ] CookieConsentProvider initializes state from storage
- [ ] Provider listens to auth state changes and syncs accordingly
- [ ] acceptAll() and rejectAll() functions work correctly
- [ ] useCookieConsent hook can be consumed in components
- [ ] No runtime errors or console warnings
- [ ] No hydration mismatches

## Files to Create

**Types & Utilities**:
- `src/lib/cookie-consent/types.ts` - TypeScript interfaces
- `src/lib/cookie-consent/storage.ts` - Storage abstraction layer
- `src/lib/cookie-consent/sync.ts` - Sync logic between storage layers
- `src/lib/cookie-consent/index.ts` - Barrel export

**Components**:
- `src/components/cookie-consent/cookie-consent-provider.tsx` - Context provider
- `src/components/cookie-consent/use-cookie-consent.ts` - Consumer hook
- `src/components/cookie-consent/index.ts` - Barrel export

**Tests**:
- `src/lib/cookie-consent/__tests__/storage.test.ts` - Storage layer tests
- `src/lib/cookie-consent/__tests__/sync.test.ts` - Sync logic tests
- `src/components/cookie-consent/__tests__/cookie-consent-provider.test.tsx` - Provider tests

## Files to Modify

- `src/app/layout.tsx` - Add CookieConsentProvider wrapper

## Dependencies

**Internal**:
- `src/lib/db/users.ts` - Provides updateUser() and getCurrentUser() (exists)
- `src/lib/auth/hooks.ts` - Provides useUser() hook (exists)
- `src/components/ui/` - shadcn/ui components (for future UI in Part 2)

**External**:
- None (uses existing dependencies: Next.js, React, Supabase client)

## Testing Strategy

**Unit Tests** (bun test framework):
- Storage layer: Mock localStorage, mock database functions
- Sync logic: Mock storage functions, test all merge scenarios
- Provider: Mock useUser, mock storage/sync functions

**Manual Testing**:
- Verify no console errors on page load
- Verify provider initializes with default state
- Verify auth state changes trigger re-initialization
- Use React DevTools to inspect context value

## Notes

- This plan focuses on infrastructure only (no UI)
- Part 2 will add banner and settings UI components
- Part 3 will add PostHog and Facebook Pixel script loading
- Database schema already supports this (users.preferences JSONB is flexible)
- No database migration needed
