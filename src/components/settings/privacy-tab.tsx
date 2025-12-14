'use client';

import { useCallback } from 'react';
import { useCookieConsent } from '@/components/cookie-consent';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

export function PrivacyTab() {
  const { consent, updateConsent, loading } = useCookieConsent();

  const handleToggle = useCallback((key: 'analytics' | 'marketing', value: boolean) => {
    updateConsent({ [key]: value });
  }, [updateConsent]);

  if (loading || !consent) {
    return <div>Loading preferences...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Privacy Settings</h2>
        <p className="text-muted-foreground">
          Manage your cookie preferences and data collection settings.
        </p>
      </div>

      {/* Essential Cookies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Essential Cookies</span>
            <Switch
              checked
              disabled
              aria-label="Essential cookies switch (always enabled)"
            />
          </CardTitle>
          <CardDescription>
            Required for the site to function. These cookies enable core functionality
            like authentication and security. They cannot be disabled.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Analytics (PostHog)</span>
            <Switch
              checked={consent.analytics}
              onCheckedChange={(checked) => handleToggle('analytics', checked)}
              aria-label="Enable analytics cookies for PostHog tracking"
            />
          </CardTitle>
          <CardDescription>
            Help us understand how you use ProductPix. We use PostHog for product analytics
            and session recordings to improve your experience. No personal data is shared
            with third parties.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Marketing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Marketing (Facebook Pixel)</span>
            <Switch
              checked={consent.marketing}
              onCheckedChange={(checked) => handleToggle('marketing', checked)}
              aria-label="Enable marketing cookies for Facebook Pixel tracking"
            />
          </CardTitle>
          <CardDescription>
            Allow us to show you relevant ads and track conversion events. We use Facebook
            Pixel for advertising optimization. You can disable this without affecting
            core functionality.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Last Updated */}
      {consent.consentedAt && (
        <p className="text-xs text-muted-foreground">
          Last updated: {new Date(consent.consentedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}
    </div>
  );
}