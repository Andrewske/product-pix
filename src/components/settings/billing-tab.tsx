import { SubscriptionStatus } from '@/components/billing/subscription-status';
import { PurchaseHistory } from '@/components/billing/purchase-history';
import { CreditPacks } from '@/components/pricing/credit-packs';
import { getPricing } from '@/lib/pricing/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CreditBalanceDisplay } from './credit-balance-display';
import type { PricingData } from '@/lib/pricing/utils';

export async function BillingTab() {
  // Fetch pricing data server-side
  let pricingData: PricingData | null = null;
  try {
    pricingData = await getPricing();
  } catch (error) {
    console.error('[BillingTab] Failed to fetch pricing data:', error);
  }

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
          {pricingData ? (
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
