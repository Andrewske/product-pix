 import { requireAuth } from '@/lib/auth/server';
 import { getUserStripeCustomerId } from '@/lib/stripe/customer';
 import { syncStripeDataToKV } from '@/lib/stripe/sync';
 import { getPricing } from '@/lib/pricing/actions';
 import { type PricingData } from '@/lib/pricing/utils';
 import { CreditPacks } from '@/components/pricing/credit-packs';
 import { SubscriptionTiers } from '@/components/pricing/subscription-tiers';
 import { PageContainer } from '@/components/layout/page-container';
 import { SectionHeader } from '@/components/ui/section-header';

export default async function PricingPage() {
  // Sync Stripe data on page load to ensure fresh subscription status
  // If sync fails, still render page - components will show cached/stale data
  const user = await requireAuth();
  const customerId = await getUserStripeCustomerId(user.id);
  if (customerId) {
    try {
      await syncStripeDataToKV(customerId);
    } catch (error) {
      // Log but don't block page render - components can work with stale data
      console.error('[Pricing Page] Sync failed, rendering with cached data:', error);
    }
  }

  // Fetch pricing data once for the entire page
  let pricingData: PricingData | null = null;
  try {
    pricingData = await getPricing();
  } catch (error) {
    console.error('[Pricing Page] Failed to fetch pricing data:', error);
    // Continue rendering - components will handle null pricing data gracefully
  }

  return (
    <PageContainer spotlight>
      <SectionHeader
        title="Choose Your Plan"
        description="Get high-quality AI product photos with flexible credit packs or monthly subscriptions. Credits never expire and can be used anytime."
      />

      <div className="space-y-16">
        <CreditPacks pricingData={pricingData} />
        <div className="flex items-center justify-center py-8">
          <div className="h-px bg-border flex-1 max-w-xs" />
          <span className="px-4 text-sm text-muted-foreground font-medium">or</span>
          <div className="h-px bg-border flex-1 max-w-xs" />
        </div>
        <SubscriptionTiers pricingData={pricingData} />
      </div>

      <div className="mt-16 text-center text-sm text-muted-foreground">
        <p>All prices in USD. Credits never expire. Cancel anytime.</p>
        <p className="mt-2">Questions? Contact support@productpix.ai</p>
      </div>
    </PageContainer>
  );
}
