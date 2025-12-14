# Cookie Consent Code Review Fixes

Address all action items from code review of commit `93688ce` (cookie consent UI system).

## Task Sequence

Execute in order (dependencies flow downward):

### 1. [Trivial Fixes](./01-trivial-fixes.md)
**Files**: `src/app/layout.tsx`, `src/components/settings/privacy-tab.tsx`

Combine duplicate imports and style loading state. Quick wins.

---

### 2. [Dismiss Banner Session State](./02-dismiss-banner-session-state.md)
**Files**: `src/components/cookie-consent/types.ts`, `cookie-consent-provider.tsx`, `cookie-consent-banner.tsx`

Add `dismissedThisSession` state so Escape key hides banner without persisting preference.

---

### 3. [Privacy Tab TestIDs](./03-privacy-tab-testids.md)
**Files**: `src/components/settings/privacy-tab.tsx`, `__tests__/privacy-tab.test.tsx`

Add data-testid attributes to switches and update tests to use robust selectors.

---

### 4. [Cookie Banner Tests](./04-cookie-banner-tests.md)
**Files**: `src/components/cookie-consent/__tests__/cookie-consent-banner.test.tsx`

Update mocks and add tests for dismissBanner and Escape key behavior.

**Depends on**: Task 02

---

### 5. [Settings Tabs Test Fix](./05-settings-tabs-test-fix.md)
**Files**: `src/components/settings/__tests__/settings-tabs.test.tsx`

Fix mock override pattern using nested describe blocks.

---

## Verification

After implementation:
```bash
bun test src/components/cookie-consent
bun test src/components/settings
bun run build
```
