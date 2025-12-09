'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchUserSubscription, type SubscriptionData } from '@/lib/db/billing';

export function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetchUserSubscription()
      .then(setSubscription)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Portal error:', error);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
          <CardDescription className="text-destructive">
            Error loading subscription: {error}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
          <CardDescription>You don't have an active subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Subscribe to get monthly credits automatically.
          </p>
          <a href="/pricing" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
            View Plans
          </a>
        </CardContent>
      </Card>
    );
  }

  const endDate = new Date(subscription.current_period_end);
  const isActive = subscription.status === 'active';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Subscription Status
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {subscription.status}
          </Badge>
        </CardTitle>
        <CardDescription>
          {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} Plan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">Current Period</p>
            <p className="text-sm text-muted-foreground">
              {isActive ? 'Renews' : 'Ends'} on {endDate.toLocaleDateString()}
            </p>
          </div>

          {subscription.cancel_at_period_end && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                Your subscription will be cancelled at the end of the current period.
              </p>
            </div>
          )}

          <Button
            onClick={handleManageSubscription}
            disabled={portalLoading}
            variant="outline"
          >
            {portalLoading ? 'Loading...' : 'Manage Subscription'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
