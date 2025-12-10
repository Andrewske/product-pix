'use client';

import { useState, useEffect } from 'react';
import { SubscriptionStatus } from '@/components/billing/subscription-status';
import { PurchaseHistory } from '@/components/billing/purchase-history';
import { CreditPacks } from '@/components/pricing/credit-packs';
import { getPricing } from '@/lib/pricing/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditBalanceDisplay } from './credit-balance-display';
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
      {/* Existing components */}
      <SubscriptionStatus />
      <PurchaseHistory />

      {/* New credit packs section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Buy Credit Packs</CardTitle>
              <CardDescription>
                Purchase one-time credit packs that never expire
              </CardDescription>
            </div>
            <CreditBalanceDisplay />
          </div>
        </CardHeader>
        <CardContent>
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
            <div className="grid md:grid-cols-3 gap-4">
              <CreditPacks pricingData={pricingData} />
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              Pricing temporarily unavailable. Please try again later.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
