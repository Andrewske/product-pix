'use client';

import { useState } from 'react';
import { type PricingData } from '@/lib/pricing';
import { createPackCheckout } from '@/lib/stripe/checkout-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CreditPacksProps {
  pricingData: PricingData | null;
}

export function CreditPacks({ pricingData }: CreditPacksProps) {
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const handlePurchase = async (packId: string) => {
    setCheckoutLoading(packId);
    try {
      const { url } = await createPackCheckout(packId as 'pack_50' | 'pack_200' | 'pack_500');
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const formatPrice = (priceCents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(priceCents / 100);
  };

  const calculatePerCreditCost = (priceCents: number, credits: number) => {
    const costPerCredit = priceCents / credits / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(costPerCredit);
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
      <h2 className="text-2xl font-semibold mb-6 text-center">Credit Packs</h2>
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {Object.entries(pricingData.packs).map(([packId, pack]) => (
          <Card key={packId} className="relative">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {pack.credits} Credits
                {packId === 'pack_200' && <Badge variant="secondary">Most Popular</Badge>}
              </CardTitle>
              <CardDescription>
                {formatPrice(pack.priceCents, pack.currency)} • {calculatePerCreditCost(pack.priceCents, pack.credits)} per credit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Perfect for occasional use
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handlePurchase(packId)}
                disabled={checkoutLoading === packId}
              >
                {checkoutLoading === packId ? 'Creating...' : `Buy for ${formatPrice(pack.priceCents, pack.currency)}`}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
