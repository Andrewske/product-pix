'use client';

import { useState, useEffect } from 'react';
import { PurchaseHistory } from '@/components/billing/purchase-history';
import { CreditPacks } from '@/components/pricing/credit-packs';
import { getPricing } from '@/lib/pricing/actions';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditBalanceDisplay } from './credit-balance-display';
import { CashRefundSection } from '@/components/refunds/cash-refund-section';
import type { PricingData } from '@/lib/pricing/utils';

export function BillingTab(): React.ReactElement {
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPricing();
        setPricingData(data);
      } catch (err) {
        console.error('[BillingTab] Failed to fetch pricing data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load pricing');
      } finally {
        setLoading(false);
      }
    };

    fetchPricing();
  }, []);

  return (
    <div className="space-y-6">
        {/* Credit packs section - moved to top */}
        <Card  className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold font-display">Buy Credit Packs</h3>
               <p className="text-sm text-muted-foreground">
                 Purchase one-time credit packs that never expire
               </p>
             </div>
             <CreditBalanceDisplay />
           </div>

           {loading ? (
             <div className="grid md:grid-cols-3 gap-4">
               {[1, 2, 3].map((i) => (
                 <div key={i} className="p-6 border rounded-lg space-y-4">
                   <Skeleton className="h-6 w-24" />
                   <Skeleton className="h-8 w-32" />
                   <Skeleton className="h-4 w-full" />
                   <Skeleton className="h-10 w-full" />
                 </div>
               ))}
             </div>
           ) : error ? (
             <p className="text-center text-destructive py-4">
               {error}
             </p>
           ) : pricingData ? (
             <CreditPacks pricingData={pricingData} />
           ) : (
             <p className="text-center text-muted-foreground py-4">
               Pricing temporarily unavailable. Please try again later.
             </p>
           )}
          </div>
        </Card>

        <CashRefundSection />

        {/* Section divider */}
        <div className="relative py-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/40" />
          </div>
        </div>

        <PurchaseHistory />
    </div>
  );
}
