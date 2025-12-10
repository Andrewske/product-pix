'use client';

import { useState } from 'react';
import { type PricingData } from '@/lib/pricing/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

interface SubscriptionTiersProps {
  pricingData: PricingData | null;
}

export function SubscriptionTiers({ pricingData }: SubscriptionTiersProps) {
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

  if (!pricingData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No pricing data available</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6 text-center">Monthly Subscriptions</h2>
      <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {Object.entries(pricingData.subscriptions).map(([tierId, tier]) => (
          <Card key={tierId} className="relative">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {tierId === 'pro' ? 'Pro Plan' : 'Business Plan'}
                {tierId === 'business' && <Badge variant="secondary">Best Value</Badge>}
              </CardTitle>
              <CardDescription>
                ${(tier.priceCents / 100).toFixed(2)}/{tier.currency.toUpperCase()} per month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                {tier.creditsPerMonth} credits per month
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  {tier.creditsPerMonth} credits monthly
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
