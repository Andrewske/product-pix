import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { CookieConsentBanner } from '../cookie-consent-banner';
import { useCookieConsent } from '../use-cookie-consent';

type MockUseCookieConsent = {
  hasConsented: boolean;
  loading: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
};

// Mock the hook
mock.module('../use-cookie-consent', () => ({
  useCookieConsent: mock(),
}));

describe('CookieConsentBanner', () => {
  const mockAcceptAll = mock();
  const mockRejectAll = mock();

  beforeEach(() => {
    mockAcceptAll.mockClear();
    mockRejectAll.mockClear();
  });

  it('renders banner when hasConsented is false and loading is false', () => {
    (useCookieConsent as ReturnType<typeof mock>).mockReturnValue({
      hasConsented: false,
      loading: false,
      acceptAll: mockAcceptAll,
      rejectAll: mockRejectAll,
    } as MockUseCookieConsent);

    render(<CookieConsentBanner />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).not.toBeNull();
    expect(screen.getByText('We use cookies (the digital kind)')).not.toBeNull();
    expect(screen.getByText('Accept All')).not.toBeNull();
    expect(screen.getByText('Reject All')).not.toBeNull();
  });

  it('hides banner when hasConsented is true', () => {
    (useCookieConsent as ReturnType<typeof mock>).mockReturnValue({
      hasConsented: true,
      loading: false,
      acceptAll: mockAcceptAll,
      rejectAll: mockRejectAll,
    } as MockUseCookieConsent);

    render(<CookieConsentBanner />);

    const dialog = screen.queryByRole('dialog');
    expect(dialog).toBeNull();
  });

  it('hides banner when loading is true', () => {
    (useCookieConsent as ReturnType<typeof mock>).mockReturnValue({
      hasConsented: false,
      loading: true,
      acceptAll: mockAcceptAll,
      rejectAll: mockRejectAll,
    } as MockUseCookieConsent);

    render(<CookieConsentBanner />);

    const dialog = screen.queryByRole('dialog');
    expect(dialog).toBeNull();
  });

  it('calls acceptAll when Accept All button is clicked', () => {
    (useCookieConsent as ReturnType<typeof mock>).mockReturnValue({
      hasConsented: false,
      loading: false,
      acceptAll: mockAcceptAll,
      rejectAll: mockRejectAll,
    } as MockUseCookieConsent);

    render(<CookieConsentBanner />);

    const acceptButton = screen.getByText('Accept All');
    acceptButton.click();

    expect(mockAcceptAll).toHaveBeenCalledTimes(1);
  });

  it('calls rejectAll when Reject All button is clicked', () => {
    (useCookieConsent as ReturnType<typeof mock>).mockReturnValue({
      hasConsented: false,
      loading: false,
      acceptAll: mockAcceptAll,
      rejectAll: mockRejectAll,
    } as MockUseCookieConsent);

    render(<CookieConsentBanner />);

    const rejectButton = screen.getByText('Reject All');
    rejectButton.click();

    expect(mockRejectAll).toHaveBeenCalledTimes(1);
  });

  it('has correct Privacy Policy link', () => {
    (useCookieConsent as ReturnType<typeof mock>).mockReturnValue({
      hasConsented: false,
      loading: false,
      acceptAll: mockAcceptAll,
      rejectAll: mockRejectAll,
    } as MockUseCookieConsent);

    render(<CookieConsentBanner />);

    const link = screen.getByText('Privacy Policy');
    expect(link?.getAttribute('href')).toBe('/privacy');
  });

  it('has correct ARIA attributes', () => {
    (useCookieConsent as ReturnType<typeof mock>).mockReturnValue({
      hasConsented: false,
      loading: false,
      acceptAll: mockAcceptAll,
      rejectAll: mockRejectAll,
    } as MockUseCookieConsent);

    render(<CookieConsentBanner />);

    const dialog = screen.getByRole('dialog');
    expect(dialog?.getAttribute('aria-labelledby')).toBe('cookie-banner-title');
    expect(dialog?.getAttribute('aria-describedby')).toBe('cookie-banner-description');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');

    const title = screen.getByText('We use cookies (the digital kind)');
    expect(title?.getAttribute('id')).toBe('cookie-banner-title');

    const description = screen.getByText(/PostHog helps us understand/);
    expect(description?.getAttribute('id')).toBe('cookie-banner-description');
  });

  it('has focus management and keyboard navigation', () => {
    (useCookieConsent as ReturnType<typeof mock>).mockReturnValue({
      hasConsented: false,
      loading: false,
      acceptAll: mockAcceptAll,
      rejectAll: mockRejectAll,
    } as MockUseCookieConsent);

    render(<CookieConsentBanner />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).not.toBeNull();

    // Check that Privacy Policy link has focus styles
    const privacyLink = screen.getByText('Privacy Policy');
    expect(privacyLink?.classList.contains('focus-visible:outline-none')).toBe(true);
    expect(privacyLink?.classList.contains('focus-visible:ring-2')).toBe(true);
  });
});