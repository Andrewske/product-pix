# Add Keyboard Navigation Tests for Cookie Banner

## Files to Modify
- `src/components/cookie-consent/__tests__/cookie-consent-banner.test.tsx` (modify)

## Implementation Details

Update mock type and add tests for keyboard navigation behavior.

### Update Mock Type

Add new fields to mock return value type:
```typescript
type MockUseCookieConsent = {
  hasConsented: boolean;
  dismissedThisSession: boolean;
  loading: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  dismissBanner: () => void;
};
```

### Add dismissBanner Mock

In the describe block setup:
```typescript
const mockDismissBanner = mock();

beforeEach(() => {
  mockAcceptAll.mockClear();
  mockRejectAll.mockClear();
  mockDismissBanner.mockClear();
});
```

### Update All Existing Mock Returns

All existing tests need `dismissedThisSession: false` and `dismissBanner: mockDismissBanner` added to their mock return values.

### Add New Tests

**Test: Banner hidden when dismissedThisSession is true**
```typescript
it('hides banner when dismissedThisSession is true', () => {
  (useCookieConsent as ReturnType<typeof mock>).mockReturnValue({
    hasConsented: false,
    dismissedThisSession: true,
    loading: false,
    acceptAll: mockAcceptAll,
    rejectAll: mockRejectAll,
    dismissBanner: mockDismissBanner,
  });

  render(<CookieConsentBanner />);

  const dialog = screen.queryByRole('dialog');
  expect(dialog).toBeNull();
});
```

**Test: Escape key calls dismissBanner**
```typescript
it('dismisses banner when Escape is pressed', () => {
  (useCookieConsent as ReturnType<typeof mock>).mockReturnValue({
    hasConsented: false,
    dismissedThisSession: false,
    loading: false,
    acceptAll: mockAcceptAll,
    rejectAll: mockRejectAll,
    dismissBanner: mockDismissBanner,
  });

  render(<CookieConsentBanner />);
  const dialog = screen.getByRole('dialog');
  fireEvent.keyDown(dialog, { key: 'Escape' });

  expect(mockDismissBanner).toHaveBeenCalledTimes(1);
});
```

## Acceptance Criteria
- All existing tests pass with updated mock structure
- New test verifies dismissedThisSession hides banner
- New test verifies Escape key calls dismissBanner
- `bun test src/components/cookie-consent/__tests__/cookie-consent-banner.test.tsx` passes

## Dependencies
- Task 02 (dismiss-banner-session-state) must be completed first
