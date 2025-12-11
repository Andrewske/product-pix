'use client';

import { useState } from 'react';
import { type PricingData } from '@/lib/pricing';
import { createPackCheckout } from '@/lib/stripe/checkout-actions';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/ui/section-header';
import { Card } from '@/components/ui/card';

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
      <SectionHeader
        title="Credit Packs"
        badge="Pay as you go"
        description="Perfect for occasional use or testing our service"
      />
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {Object.entries(pricingData.packs).map(([packId, pack]) => (
           <Card key={packId} variant="studio" className={`relative p-6 ${packId === 'pack_200' ? 'bg-foreground text-background' : ''}`} hover>
             <CardHeader className="p-0 mb-4">
               <CardTitle className="flex items-center justify-between text-lg">
                 <span className="font-bold text-2xl">{pack.credits} Credits</span>
                 {packId === 'pack_200' && <Badge className="bg-accent text-accent-foreground">Most Popular</Badge>}
               </CardTitle>
              <CardDescription className="text-base">
                <span className="font-bold text-xl">{formatPrice(pack.priceCents, pack.currency)}</span> • {calculatePerCreditCost(pack.priceCents, pack.credits)} per credit
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 mb-6">
              <div className="text-sm text-muted-foreground">
                Perfect for occasional use
              </div>
            </CardContent>
             <CardFooter className="p-0">
                <Button
                  className="w-full"
                  variant={packId === 'pack_200' ? 'outline' : 'studio'}
                  size="xl"
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
