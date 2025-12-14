import { render, screen } from '@testing-library/react';
import { act } from '@testing-library/react';
import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { SettingsTabs } from '../settings-tabs';
import { CookieConsentProvider } from '@/components/cookie-consent';

describe('SettingsTabs', () => {
  describe('with default tab', () => {
    beforeEach(() => {
      mock.module('next/navigation', () => ({
        useSearchParams: mock(() => new URLSearchParams()),
        useRouter: mock(() => ({ push: mock() })),
      }));
    });

    it('renders all tab triggers including Privacy', () => {
      act(() => {
        render(
          <CookieConsentProvider>
            <SettingsTabs />
          </CookieConsentProvider>
        );
      });

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
      act(() => {
        render(
          <CookieConsentProvider>
            <SettingsTabs />
          </CookieConsentProvider>
        );
      });

      // Should render the PrivacyTab which contains "Privacy Settings"
      expect(screen.getByText('Privacy Settings')).not.toBeNull();
    });
  });
});