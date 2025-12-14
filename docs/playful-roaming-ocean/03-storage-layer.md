# Storage Layer - localStorage and Database Operations

## Files to Create
- `src/lib/cookie-consent/storage.ts` (new)
- `src/lib/cookie-consent/__tests__/storage.test.ts` (new)

## Implementation Details

### storage.ts

```typescript
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@/lib/supabase/server';
import type { CookieConsent } from './types';

const STORAGE_KEY = 'productpix_cookie_consent';

// ============ localStorage utilities ============

export function saveConsentToLocalStorage(consent: CookieConsent): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  } catch (error) {
    console.error('Failed to save consent to localStorage:', error);
    // Graceful degradation: continue without localStorage
  }
}

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

export function clearLocalStorageConsent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear localStorage consent:', error);
  }
}

// ============ Database utilities ============

// Save consent to database using RPC function
export async function saveConsentToDatabase(
  userId: string,
  preferences: { cookies: CookieConsent }
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.rpc('update_user_preferences', {
      user_id: userId,
      prefs: preferences
    });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to save consent to database:', error);
    throw error; // Propagate for error handling in caller
  }
}

// Load consent from database
export async function loadConsentFromDatabase(
  userId: string
): Promise<CookieConsent | null> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('users')
      .select('preferences')
      .eq('id', userId)
      .single();

    if (error) throw error;
    if (!data?.preferences) return null;

    const prefs = data.preferences as any; // JSONB type
    return prefs.cookies || null;
  } catch (error) {
    console.error('Failed to load consent from database:', error);
    return null;
  }
}
```

### storage.test.ts (Bun test framework)

```typescript
import { describe, it, expect, beforeEach, mock } from 'bun:test';
import {
  saveConsentToLocalStorage,
  loadConsentFromLocalStorage,
  clearLocalStorageConsent,
  saveConsentToDatabase,
  loadConsentFromDatabase,
} from '../storage';

// Mock localStorage
const localStorageMock = {
  getItem: mock(() => null),
  setItem: mock(() => {}),
  removeItem: mock(() => {}),
};
global.localStorage = localStorageMock as any;

// Mock Supabase admin client
mock.module('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    rpc: mock(async () => ({ error: null }))
  })
}));

// Mock Supabase server client
mock.module('@/lib/supabase/server', () => ({
  createServerClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: mock(async () => ({ data: { preferences: { cookies: null } }, error: null }))
        })
      })
    })
  })
}));

describe('storage', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  describe('localStorage', () => {
    it('saves consent to localStorage', () => {
      const consent = { analytics: true, marketing: false, essential: true, consentedAt: '2025-01-15' };
      saveConsentToLocalStorage(consent);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'productpix_cookie_consent',
        JSON.stringify(consent)
      );
    });

    it('loads consent from localStorage', () => {
      const consent = { analytics: true, marketing: false, essential: true, consentedAt: '2025-01-15' };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(consent));
      const result = loadConsentFromLocalStorage();
      expect(result).toEqual(consent);
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      const result = loadConsentFromLocalStorage();
      expect(result).toBeNull();
    });
  });

  describe('database', () => {
    it('saves consent to database via RPC', async () => {
      // Test implementation - expand based on mock setup
    });

    it('loads consent from database', async () => {
      // Test implementation - expand based on mock setup
    });
  });
});
```

## Key Changes from Original Plan

- `saveConsentToDatabase` uses RPC function (from Phase 1) instead of direct update
- Parameters: `preferences: { cookies: CookieConsent }` matches RPC signature
- Bun-specific mocking examples provided (not Jest)

## Acceptance Criteria

- [ ] All localStorage operations work correctly
- [ ] Database operations integrate with RPC function
- [ ] Error handling is graceful (doesn't crash on localStorage full or DB errors)
- [ ] All tests pass: `bun test src/lib/cookie-consent/__tests__/storage.test.ts`
- [ ] ≥75% code coverage
- [ ] localStorage mock works with Bun test framework
- [ ] Supabase client mocks work correctly

## Testing Notes

**Bun Test Mocking**:
- Use `mock()` for functions: `mock(() => null)`
- Use `mock.module()` for module mocking
- Clear mocks in `beforeEach`: `mockFunction.mockClear()`
- No `jest.fn()` or `@testing-library/jest-dom` (Bun-native only)

## Dependencies

**Prerequisites**:
- Phase 1 (Database Migration) - RPC function must exist
- Phase 2 (Type Definitions) - `CookieConsent` interface

**Internal Dependencies** (existing):
- `@/lib/supabase/admin` - Admin client
- `@/lib/supabase/server` - Server client

**Used by**:
- Phase 4 (Sync Logic)
- Phase 5 (React Provider)
