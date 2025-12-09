import { requireAuth } from '@/lib/auth/hooks';
import { getUserStripeCustomerId } from '@/lib/stripe/customer';
import { syncStripeDataToKV } from '@/lib/stripe/sync';
import { CreditPacks } from '@/components/pricing/credit-packs';
import { SubscriptionTiers } from '@/components/pricing/subscription-tiers';

export default async function PricingPage() {
  // Sync Stripe data on page load to ensure fresh subscription status
  const user = await requireAuth();
  const customerId = await getUserStripeCustomerId(user.id);
  if (customerId) {
    await syncStripeDataToKV(customerId);
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
        <CreditPacks />
        <SubscriptionTiers />
      </div>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>All prices in USD. Credits never expire. Cancel anytime.</p>
        <p className="mt-2">Questions? Contact support@productpix.ai</p>
      </div>
    </div>
  );
}
