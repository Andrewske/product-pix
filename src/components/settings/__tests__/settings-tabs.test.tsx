import { render, screen } from '@testing-library/react';
import { describe, it, expect, mock } from 'bun:test';
import { SettingsTabs } from '../settings-tabs';
import { CookieConsentProvider } from '@/components/cookie-consent';

// Mock Next.js navigation
mock.module('next/navigation', () => ({
  useSearchParams: mock(() => new URLSearchParams()),
  useRouter: mock(() => ({ push: mock() })),
}));

describe('SettingsTabs', () => {
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

  it('renders PrivacyTab content when privacy tab is selected', () => {
    // Mock search params to return 'privacy'
    const mockUseSearchParams = mock(() => new URLSearchParams('tab=privacy'));
    mock.module('next/navigation', () => ({
      useSearchParams: mockUseSearchParams,
      useRouter: mock(() => ({ push: mock() })),
    }));

    render(
      <CookieConsentProvider>
        <SettingsTabs />
      </CookieConsentProvider>
    );

    // Should render the PrivacyTab which contains "Privacy Settings"
    expect(screen.getByText('Privacy Settings')).not.toBeNull();
  });
});