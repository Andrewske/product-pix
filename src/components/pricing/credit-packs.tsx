'use client';

import { useState } from 'react';
import type { PricingData } from '@/lib/pricing';
import { createPackCheckout } from '@/lib/stripe/checkout-actions';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
        {Object.entries(pricingData.packs).map(([packId, pack]) => {
          const isFeatured = packId === 'pack_200';
          
          return (
           <Card 
             key={packId} 
             variant="studio" 
             className={cn(
               "relative p-8 flex flex-col",
               isFeatured && "bg-foreground text-background border-2 scale-105",
               isFeatured && "[border-color:oklch(var(--success))]",
               !isFeatured && "border"
             )} 
             hover
           >
             <CardHeader className="p-0 mb-6 flex-shrink-0">
               <CardTitle className="text-2xl font-bold leading-tight mb-4">
                 {pack.credits} Credits
               </CardTitle>
               <div className="space-y-2">
                 <div className="text-3xl font-bold">
                   {formatPrice(pack.priceCents, pack.currency)}
                 </div>
                 <CardDescription className="text-sm">
                   {calculatePerCreditCost(pack.priceCents, pack.credits)} per credit
                 </CardDescription>
               </div>
            </CardHeader>
            <CardContent className="p-0 flex-grow flex flex-col justify-end">
              <p className="text-sm text-muted-foreground mb-6">
                Perfect for occasional use
              </p>
            </CardContent>
             <CardFooter className="p-0 mt-auto">
                <Button
                  className={cn(
                    "w-full",
                    isFeatured && "bg-background text-foreground hover:bg-background/90"
                  )}
                  variant={isFeatured ? "default" : "studio"}
                  size="xl"
                  onClick={() => handlePurchase(packId)}
                  disabled={checkoutLoading === packId}
                >
                  {checkoutLoading === packId ? 'Creating...' : `Buy for ${formatPrice(pack.priceCents, pack.currency)}`}
                </Button>
              </CardFooter>
           </Card>
          );
        })}
      </div>
    </div>
  );
}
