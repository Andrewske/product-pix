'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createAdminClient } from '@/lib/supabase/admin';

interface SubscriptionData {
  status: string;
  tier: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export function SubscriptionStatus() {
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);

  // Fetch subscription data on mount
  useState(() => {
    const fetchSubscription = async () => {
      try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
          .from('stripe_subscriptions')
          .select('status, tier, current_period_end, cancel_at_period_end')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          setSubscription(data);
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      }
    };

    fetchSubscription();
  });

  const handleManageSubscription = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

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
          <Button asChild>
            <a href="/pricing">View Plans</a>
          </Button>
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
            disabled={loading}
            variant="outline"
          >
            {loading ? 'Loading...' : 'Manage Subscription'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
