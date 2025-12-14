# Fix Mock Override Pattern in Settings Tests

## Files to Modify
- `src/components/settings/__tests__/settings-tabs.test.tsx` (modify)

## Implementation Details

The current pattern of calling `mock.module` inside a test doesn't properly override the module-level mock. Restructure using nested describe blocks with beforeEach.

### Current (Broken) Pattern
```typescript
mock.module('next/navigation', () => ({
  useSearchParams: mock(() => new URLSearchParams()),
  useRouter: mock(() => ({ push: mock() })),
}));

describe('SettingsTabs', () => {
  it('renders all tab triggers including Privacy', () => {
    // ...
  });

  it('renders PrivacyTab content when privacy tab is selected', () => {
    // This mock.module call inside the test doesn't work
    const mockUseSearchParams = mock(() => new URLSearchParams('tab=privacy'));
    mock.module('next/navigation', () => ({
      useSearchParams: mockUseSearchParams,
      useRouter: mock(() => ({ push: mock() })),
    }));
    // ...
  });
});
```

### Fixed Pattern
```typescript
describe('SettingsTabs', () => {
  describe('with default tab', () => {
    beforeEach(() => {
      mock.module('next/navigation', () => ({
        useSearchParams: mock(() => new URLSearchParams()),
        useRouter: mock(() => ({ push: mock() })),
      }));
    });

    it('renders all tab triggers including Privacy', () => {
      render(
        <CookieConsentProvider>
          <SettingsTabs />
        </CookieConsentProvider>
      );

      expect(screen.getByText('Account')).not.toBeNull();
      expect(screen.getByText('Billing')).not.toBeNull();
      expect(screen.getByText('Credits')).not.toBeNull();
      expect(screen.getByText('Privacy')).not.toBeNull();
    });
  });

  describe('with privacy tab selected', () => {
    beforeEach(() => {
      mock.module('next/navigation', () => ({
        useSearchParams: mock(() => new URLSearchParams('tab=privacy')),
        useRouter: mock(() => ({ push: mock() })),
      }));
    });

    it('renders PrivacyTab content when privacy tab is selected', () => {
      render(
        <CookieConsentProvider>
          <SettingsTabs />
        </CookieConsentProvider>
      );

      expect(screen.getByText('Privacy Settings')).not.toBeNull();
    });
  });
});
```

## Acceptance Criteria
- Tests properly isolate mock configurations
- Privacy tab test actually validates tab switching behavior
- `bun test src/components/settings/__tests__/settings-tabs.test.tsx` passes

## Dependencies
None
