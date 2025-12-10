 import { requireAuth } from '@/lib/auth/server';
 import { getUserStripeCustomerId } from '@/lib/stripe/customer';
 import { syncStripeDataToKV } from '@/lib/stripe/sync';
 import { getPricing, type PricingData } from '@/lib/pricing/actions';
 import { CreditPacks } from '@/components/pricing/credit-packs';
 import { SubscriptionTiers } from '@/components/pricing/subscription-tiers';

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
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Get high-quality AI product photos with flexible credit packs or monthly subscriptions.
          Credits never expire and can be used anytime.
        </p>
      </div>

      <div className="grid gap-12">
        <CreditPacks pricingData={pricingData} />
        <SubscriptionTiers pricingData={pricingData} />
      </div>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>All prices in USD. Credits never expire. Cancel anytime.</p>
        <p className="mt-2">Questions? Contact support@productpix.ai</p>
      </div>
    </div>
  );
}
