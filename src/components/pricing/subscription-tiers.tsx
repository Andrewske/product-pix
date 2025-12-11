'use client';

import { useState } from 'react';
import { type PricingData } from '@/lib/pricing/utils';
import { createSubscriptionCheckout } from '@/lib/stripe/checkout-actions';
import { StudioButton } from '@/components/ui/studio-button';
import { StudioCard } from '@/components/ui/studio-card';
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/ui/section-header';
import { Check } from 'lucide-react';

interface SubscriptionTiersProps {
  pricingData: PricingData | null;
}

export function SubscriptionTiers({ pricingData }: SubscriptionTiersProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const formatPrice = (priceCents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(priceCents / 100);
  };

  const handleSubscribe = async (tier: 'pro' | 'business') => {
    setLoading(tier);
    try {
      const { url } = await createSubscriptionCheckout(tier);
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
      <SectionHeader
        title="Monthly Subscriptions"
        badge="Save with annual billing"
        description="Perfect for regular users who need consistent access"
      />
      <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {Object.entries(pricingData.subscriptions).map(([tierId, tier]) => (
           <StudioCard
             key={tierId}
             className={`relative p-6 ${tierId === 'business' ? 'bg-foreground text-background scale-105' : ''}`}
             hover={tierId !== 'business'}
           >
             <CardHeader className="pb-4">
               <CardTitle className="flex items-center justify-between text-lg">
                 <span className="font-bold text-2xl">{tierId === 'pro' ? 'Pro Plan' : 'Business Plan'}</span>
                 {tierId === 'business' && <Badge variant="secondary">Best Value</Badge>}
               </CardTitle>
               <CardDescription className={`text-base ${tierId === 'business' ? 'text-background/80' : ''}`}>
                 <span className="font-bold text-xl">{formatPrice(tier.priceCents, tier.currency)}</span> per month
               </CardDescription>
            </CardHeader>
             <CardContent>
               <div className={`text-sm mb-4 ${tierId === 'business' ? 'text-background/70' : 'text-muted-foreground'}`}>
                 {tier.creditsPerMonth} credits per month
               </div>
               <ul className={`space-y-2 text-sm ${tierId === 'business' ? 'text-background/80' : ''}`}>
                 <li className="flex items-center">
                   <Check className={`h-4 w-4 mr-2 ${tierId === 'business' ? 'text-background' : 'text-green-500'}`} />
                   {tier.creditsPerMonth} credits monthly
                 </li>
                 <li className="flex items-center">
                   <Check className={`h-4 w-4 mr-2 ${tierId === 'business' ? 'text-background' : 'text-green-500'}`} />
                   Credits never expire
                 </li>
                 <li className="flex items-center">
                   <Check className={`h-4 w-4 mr-2 ${tierId === 'business' ? 'text-background' : 'text-green-500'}`} />
                   Cancel anytime
                 </li>
                 <li className="flex items-center">
                   <Check className={`h-4 w-4 mr-2 ${tierId === 'business' ? 'text-background' : 'text-green-500'}`} />
                   Priority support
                 </li>
               </ul>
             </CardContent>
             <CardFooter className="pt-4">
               <StudioButton
                 className="w-full"
                 studioVariant={tierId === 'business' ? 'secondary' : 'primary'}
                  onClick={() => handleSubscribe(tierId as 'pro' | 'business')}
                 disabled={loading === tierId}
               >
                 {loading === tierId ? 'Creating...' : `Subscribe to ${tierId === 'pro' ? 'Pro' : 'Business'}`}
               </StudioButton>
             </CardFooter>
           </StudioCard>
        ))}
      </div>
    </div>
  );
}
