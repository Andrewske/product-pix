'use client';

import { useCookieConsent } from './use-cookie-consent';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

export function CookieConsentBanner() {
  const { hasConsented, acceptAll, rejectAll, loading } = useCookieConsent();
  const bannerRef = useRef<HTMLDivElement>(null);
  const acceptButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap and keyboard navigation
  useEffect(() => {
    const banner = bannerRef.current;
    if (!banner || hasConsented || loading) return;

    const focusableElements = banner.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = acceptButtonRef.current || focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Auto-focus first button when banner opens
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // For MVP, just blur focus. Could be enhanced to reject all
        (document.activeElement as HTMLElement)?.blur();
        return;
      }

      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    banner.addEventListener('keydown', handleKeyDown);
    return () => banner.removeEventListener('keydown', handleKeyDown);
  }, [hasConsented, loading]);

  // Don't show if user has already consented or still loading
  if (hasConsented || loading) return null;

  return (
    <div
      ref={bannerRef}
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-description"
      aria-modal="true"
      className="fixed bottom-4 right-4 z-50 max-w-[400px] rounded-lg border border-border bg-card p-6 shadow-lg"
      style={{ maxWidth: 'calc(100vw - 2rem)' }} // Responsive on mobile
    >
      <h2 id="cookie-banner-title" className="text-lg font-semibold mb-2">
        We use cookies (the digital kind)
      </h2>
      <p id="cookie-banner-description" className="text-sm text-muted-foreground mb-4">
        PostHog helps us understand what works, and Facebook helps us show you relevant stuff.
        You can change your preferences anytime in settings.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          ref={acceptButtonRef}
          onClick={acceptAll}
          className="flex-1"
          variant="default"
        >
          Accept All
        </Button>
        <Button
          onClick={rejectAll}
          className="flex-1"
          variant="outline"
        >
          Reject All
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        <Link href="/privacy" className="underline hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}