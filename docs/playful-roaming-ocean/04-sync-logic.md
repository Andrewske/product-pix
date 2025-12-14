# Sync Logic - localStorage ↔ Database Synchronization

## Files to Create
- `src/lib/cookie-consent/sync.ts` (new)
- `src/lib/cookie-consent/__tests__/sync.test.ts` (new)

## Implementation Details

### sync.ts

```typescript
import type { CookieConsent } from './types';
import { saveConsentToDatabase, clearLocalStorageConsent } from './storage';

export function getDefaultConsent(): CookieConsent {
  return {
    analytics: false,
    marketing: false,
    essential: true,  // Always true
    consentedAt: null, // No consent yet
  };
}

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
    try {
      await saveConsentToDatabase(userId, { cookies: localConsent });
      clearLocalStorageConsent(); // Only clear after successful save
    } catch (error) {
      console.error('Failed to sync consent to database, keeping localStorage backup:', error);
      // Keep localStorage as backup, will retry on next login
      throw error;
    }
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
    try {
      await saveConsentToDatabase(userId, { cookies: localConsent! });
      clearLocalStorageConsent(); // Only clear after successful save
    } catch (error) {
      console.error('Failed to sync consent to database, keeping localStorage backup:', error);
      throw error;
    }
  }

  return winner;
}
```

### sync.test.ts

```typescript
import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { syncConsentOnLogin, getDefaultConsent } from '../sync';
import type { CookieConsent } from '../types';

// Mock storage functions
const mockSaveToDatabase = mock(async () => {});
const mockClearLocalStorage = mock(() => {});

mock.module('../storage', () => ({
  saveConsentToDatabase: mockSaveToDatabase,
  clearLocalStorageConsent: mockClearLocalStorage,
}));

describe('sync', () => {
  beforeEach(() => {
    mockSaveToDatabase.mockClear();
    mockClearLocalStorage.mockClear();
  });

  it('returns default when no consent exists', async () => {
    const result = await syncConsentOnLogin('user-123', null, null);
    expect(result).toEqual(getDefaultConsent());
  });

  it('saves localStorage consent to DB when only local exists', async () => {
    const localConsent: CookieConsent = {
      analytics: true,
      marketing: false,
      essential: true,
      consentedAt: '2025-01-15',
    };

    const result = await syncConsentOnLogin('user-123', localConsent, null);

    expect(mockSaveToDatabase).toHaveBeenCalledWith('user-123', { cookies: localConsent });
    expect(mockClearLocalStorage).toHaveBeenCalled();
    expect(result).toEqual(localConsent);
  });

  it('uses DB consent when only DB exists', async () => {
    const dbConsent: CookieConsent = {
      analytics: false,
      marketing: true,
      essential: true,
      consentedAt: '2025-01-10',
    };

    const result = await syncConsentOnLogin('user-123', null, dbConsent);

    expect(result).toEqual(dbConsent);
    expect(mockSaveToDatabase).not.toHaveBeenCalled();
  });

  it('uses newer consent when both exist (localStorage newer)', async () => {
    const localConsent: CookieConsent = {
      analytics: true,
      marketing: false,
      essential: true,
      consentedAt: '2025-01-15',
    };

    const dbConsent: CookieConsent = {
      analytics: false,
      marketing: true,
      essential: true,
      consentedAt: '2025-01-10',
    };

    const result = await syncConsentOnLogin('user-123', localConsent, dbConsent);

    expect(result).toEqual(localConsent);
    expect(mockSaveToDatabase).toHaveBeenCalled();
    expect(mockClearLocalStorage).toHaveBeenCalled();
  });

  it('uses newer consent when both exist (database newer)', async () => {
    const localConsent: CookieConsent = {
      analytics: true,
      marketing: false,
      essential: true,
      consentedAt: '2025-01-10',
    };

    const dbConsent: CookieConsent = {
      analytics: false,
      marketing: true,
      essential: true,
      consentedAt: '2025-01-15',
    };

    const result = await syncConsentOnLogin('user-123', localConsent, dbConsent);

    expect(result).toEqual(dbConsent);
    expect(mockSaveToDatabase).not.toHaveBeenCalled();
  });

  it('keeps localStorage backup when database save fails', async () => {
    const localConsent: CookieConsent = {
      analytics: true,
      marketing: false,
      essential: true,
      consentedAt: '2025-01-15',
    };

    mockSaveToDatabase.mockRejectedValueOnce(new Error('Network error'));

    await expect(syncConsentOnLogin('user-123', localConsent, null)).rejects.toThrow();

    expect(mockClearLocalStorage).not.toHaveBeenCalled(); // localStorage preserved
  });
});
```

## Key Changes from Original Plan

**Critical Fix #3**: Safe localStorage clearing.

- `clearLocalStorageConsent()` moved **inside** try block, **after** await
- Only clears if `saveConsentToDatabase` succeeds
- If save fails, localStorage preserved as backup
- Error propagates to caller for proper handling

**Why this matters:**
```
Before (BROKEN):
  await saveConsentToDatabase(...);  // Fails
  clearLocalStorageConsent();         // Executes anyway - DATA LOSS!

After (FIXED):
  try {
    await saveConsentToDatabase(...); // Fails
    clearLocalStorageConsent();        // Never reached - data safe!
  } catch (error) {
    throw error;  // localStorage still has backup
  }
```

## Acceptance Criteria

- [ ] All merge scenarios handled correctly
- [ ] Timestamp comparison works (newer wins)
- [ ] localStorage cleared ONLY after successful database save
- [ ] Database errors don't cause data loss
- [ ] Default consent returned when no consent exists
- [ ] All tests pass: `bun test src/lib/cookie-consent/__tests__/sync.test.ts`
- [ ] ≥75% code coverage
- [ ] Mock functions work correctly with Bun

## Dependencies

**Prerequisites**:
- Phase 2 (Type Definitions) - `CookieConsent` interface
- Phase 3 (Storage Layer) - `saveConsentToDatabase`, `clearLocalStorageConsent`

**Used by**:
- Phase 5 (React Provider) - Login sync logic
