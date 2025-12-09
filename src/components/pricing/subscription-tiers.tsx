'use client';

import { useState } from 'react';
import { SUBSCRIPTION_TIERS } from '@/lib/stripe/products';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

export function SubscriptionTiers() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (tier: string) => {
    setLoading(tier);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'subscription', tier }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6 text-center">Monthly Subscriptions</h2>
      <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {Object.entries(SUBSCRIPTION_TIERS).map(([tierId, tier]) => (
          <Card key={tierId} className="relative">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {tierId === 'pro' ? 'Pro Plan' : 'Business Plan'}
                {tierId === 'business' && <Badge variant="secondary">Best Value</Badge>}
              </CardTitle>
              <CardDescription>
                {tier.credits} credits per month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                ${(tier.priceCents / 100).toFixed(2)}
                <span className="text-lg font-normal text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  {tier.credits} credits monthly
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Credits never expire
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Cancel anytime
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Priority support
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={tierId === 'business' ? 'default' : 'outline'}
                onClick={() => handleSubscribe(tierId)}
                disabled={loading === tierId}
              >
                {loading === tierId ? 'Creating...' : `Subscribe to ${tierId === 'pro' ? 'Pro' : 'Business'}`}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
