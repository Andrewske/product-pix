'use client';

import { useState } from 'react';
import type { PricingData } from '@/lib/pricing';
import { createPackCheckout } from '@/lib/stripe/checkout-actions';
import { SectionHeader } from '@/components/ui/section-header';
import { PricingCard } from '@/components/pricing/pricing-card';

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
          const formattedPrice = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: pack.currency.toUpperCase(),
          }).format(pack.priceCents / 100);

          return (
            <PricingCard
              key={packId}
              title={`${pack.credits} Credits`}
              price={formattedPrice}
              description="Perfect for occasional use"
              onClick={() => handlePurchase(packId)}
              variant={isFeatured ? 'featured' : 'default'}
              isLoading={checkoutLoading === packId}
              buttonText={`Buy for ${formattedPrice}`}
            />
          );
        })}
      </div>
    </div>
  );
}
