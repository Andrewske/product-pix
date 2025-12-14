import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { PrivacyTab } from '../privacy-tab';
import { useCookieConsent } from '@/components/cookie-consent';

// Mock the hook
mock.module('@/components/cookie-consent', () => ({
  useCookieConsent: mock(),
}));

type MockUseCookieConsent = {
  consent: {
    analytics: boolean;
    marketing: boolean;
    essential: boolean;
    consentedAt: string | null;
  } | null;
  loading: boolean;
  updateConsent: (updates: Partial<{ analytics: boolean; marketing: boolean }>) => void;
};

describe('PrivacyTab', () => {
  const mockUpdateConsent = mock();

  beforeEach(() => {
    mockUpdateConsent.mockClear();
  });

  it('shows loading state when loading is true', () => {
    (useCookieConsent as ReturnType<typeof mock>).mockReturnValue({
      consent: null,
      loading: true,
      updateConsent: mockUpdateConsent,
    });

    render(<PrivacyTab />);

    expect(screen.getByText('Loading preferences...')).not.toBeNull();
  });

  it('shows loading state when consent is null', () => {
    (useCookieConsent as ReturnType<typeof mock>).mockReturnValue({
      consent: null,
      loading: false,
      updateConsent: mockUpdateConsent,
    });

    render(<PrivacyTab />);

    expect(screen.getByText('Loading preferences...')).not.toBeNull();
  });

  it('renders all three sections when consent is loaded', () => {
    (useCookieConsent as ReturnType<typeof mock>).mockReturnValue({
      consent: {
        analytics: true,
        marketing: false,
        essential: true,
        consentedAt: '2024-01-01T12:00:00Z',
      },
      loading: false,
      updateConsent: mockUpdateConsent,
    });

    render(<PrivacyTab />);

    expect(screen.getByText('Privacy Settings')).not.toBeNull();
    expect(screen.getByText('Essential Cookies')).not.toBeNull();
    expect(screen.getByText('Analytics (PostHog)')).not.toBeNull();
    expect(screen.getByText('Marketing (Facebook Pixel)')).not.toBeNull();
  });

  it('essential cookies switch is disabled and checked', () => {
    (useCookieConsent as ReturnType<typeof mock>).mockReturnValue({
      consent: {
        analytics: true,
        marketing: false,
        essential: true,
        consentedAt: null,
      },
      loading: false,
      updateConsent: mockUpdateConsent,
    });

    render(<PrivacyTab />);

    const essentialSwitch = screen.getByTestId('essential-cookies-switch');
    expect(essentialSwitch?.getAttribute('data-disabled')).not.toBeNull();
    expect(essentialSwitch?.getAttribute('data-state')).toBe('checked');
  });

  it('analytics toggle reflects current consent value', () => {
    (useCookieConsent as ReturnType<typeof mock>).mockReturnValue({
      consent: {
        analytics: true,
        marketing: false,
        essential: true,
        consentedAt: null,
      },
      loading: false,
      updateConsent: mockUpdateConsent,
    });

    render(<PrivacyTab />);

    const analyticsSwitch = screen.getByTestId('analytics-switch');
    expect(analyticsSwitch?.getAttribute('data-state')).toBe('checked');
  });

  it('marketing toggle reflects current consent value', () => {
    (useCookieConsent as ReturnType<typeof mock>).mockReturnValue({
      consent: {
        analytics: false,
        marketing: true,
        essential: true,
        consentedAt: null,
      },
      loading: false,
      updateConsent: mockUpdateConsent,
    });

    render(<PrivacyTab />);

    const marketingSwitch = screen.getByTestId('marketing-switch');
    expect(marketingSwitch?.getAttribute('data-state')).toBe('checked');
  });

  it('analytics toggle calls updateConsent when changed', () => {
    (useCookieConsent as ReturnType<typeof mock>).mockReturnValue({
      consent: {
        analytics: true,
        marketing: false,
        essential: true,
        consentedAt: null,
      },
      loading: false,
      updateConsent: mockUpdateConsent,
    });

    render(<PrivacyTab />);

    const analyticsSwitch = screen.getByTestId('analytics-switch');
    fireEvent.click(analyticsSwitch);

    expect(mockUpdateConsent).toHaveBeenCalledWith({ analytics: false });
  });

  it('marketing toggle calls updateConsent when changed', () => {
    (useCookieConsent as ReturnType<typeof mock>).mockReturnValue({
      consent: {
        analytics: false,
        marketing: false,
        essential: true,
        consentedAt: null,
      },
      loading: false,
      updateConsent: mockUpdateConsent,
    });

    render(<PrivacyTab />);

    const marketingSwitch = screen.getByTestId('marketing-switch');
    fireEvent.click(marketingSwitch);

    expect(mockUpdateConsent).toHaveBeenCalledWith({ marketing: true });
  });

  it('shows last updated timestamp when consentedAt exists', () => {
    const consentedAt = '2024-01-15T14:30:00Z';
    (useCookieConsent as ReturnType<typeof mock>).mockReturnValue({
      consent: {
        analytics: true,
        marketing: false,
        essential: true,
        consentedAt,
      },
      loading: false,
      updateConsent: mockUpdateConsent,
    });

    render(<PrivacyTab />);

    const timestampText = screen.getByText(/Last updated:/);
    expect(timestampText).not.toBeNull();
    expect(timestampText.textContent).toContain('January 15, 2024');
  });

  it('does not show timestamp when consentedAt is null', () => {
    (useCookieConsent as ReturnType<typeof mock>).mockReturnValue({
      consent: {
        analytics: true,
        marketing: false,
        essential: true,
        consentedAt: null,
      },
      loading: false,
      updateConsent: mockUpdateConsent,
    } as MockUseCookieConsent);

    render(<PrivacyTab />);

    expect(screen.queryByText(/Last updated:/)).toBeNull();
  });

  it('switches have proper accessibility labels', () => {
    (useCookieConsent as ReturnType<typeof mock>).mockReturnValue({
      consent: {
        analytics: true,
        marketing: false,
        essential: true,
        consentedAt: null,
      },
      loading: false,
      updateConsent: mockUpdateConsent,
    } as MockUseCookieConsent);

    render(<PrivacyTab />);

    // Check essential switch (disabled)
    const essentialSwitch = screen.getByTestId('essential-cookies-switch');
    expect(essentialSwitch?.getAttribute('aria-label')).toBe('Essential cookies switch (always enabled)');

    // Check analytics switch
    const analyticsSwitch = screen.getByTestId('analytics-switch');
    expect(analyticsSwitch?.getAttribute('aria-label')).toBe('Enable analytics cookies for PostHog tracking');

    // Check marketing switch
    const marketingSwitch = screen.getByTestId('marketing-switch');
    expect(marketingSwitch?.getAttribute('aria-label')).toBe('Enable marketing cookies for Facebook Pixel tracking');
  });
});