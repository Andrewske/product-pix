# Core App Integration

## Files to Modify/Create
- `src/app/layout.tsx` (modify)
- `src/lib/auth/hooks.ts` (modify)
- `src/lib/auth/__tests__/hooks.test.ts` (modify)

## Implementation Details

### Task 2.1: Integrate PostHog Provider in Root Layout

Modify `src/app/layout.tsx`:

**Changes:**
- Import PostHogProvider from '@/lib/analytics'
- Wrap children (outside ThemeProvider, wraps everything)

**Example:**
```typescript
import { PostHogProvider } from '@/lib/analytics';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <PostHogProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
```

### Task 2.2: Add User Identification to Auth Hooks

Modify `src/lib/auth/hooks.ts` in `useUserProfile()`:

**Changes:**
- Import `identifyUser`, `resetUser` from '@/lib/analytics'
- Use `useRef` to track if already identified
- Call `resetUser()` when user is null
- Call `identifyUser(user.id, { email, tier, created_at })` when profile loads (only if not already identified)
- **Do NOT include credit_balance** (mutable state)

**Example:**
```typescript
import { useRef } from 'react';
import { identifyUser, resetUser } from '@/lib/analytics';

export function useUserProfile() {
  const identifiedRef = useRef(false);

  // ... existing code ...

  useEffect(() => {
    if (!user) {
      resetUser();
      identifiedRef.current = false;
    } else if (!identifiedRef.current) {
      identifyUser(user.id, {
        email: user.email,
        tier: user.tier,
        created_at: user.createdAt,
      });
      identifiedRef.current = true;
    }
  }, [user]);

  // ... rest of hook ...
}
```

## Acceptance Criteria
- App renders without errors
- PostHog initializes in browser
- Users identified on login with immutable properties only (email, tier, created_at)
- Identity cleared on logout
- No duplicate identification calls on rerenders
- credit_balance NOT in user properties

## Tests Required

Update `src/lib/auth/__tests__/hooks.test.ts`:
- Test: identifyUser called once when profile loads
- Test: identifyUser not called again on rerenders
- Test: resetUser called on logout
- Test: User properties match profile data (email, tier, created_at)
- Test: credit_balance NOT in user properties

## Dependencies
- Task 05 (integration verification) must pass
- Phase 1 complete
