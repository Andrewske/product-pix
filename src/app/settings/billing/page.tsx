import { requireAuth } from '@/lib/auth/server';
import { getUserStripeCustomerId } from '@/lib/stripe/customer';
import { syncStripeDataToKV } from '@/lib/stripe/sync';
import { SubscriptionStatus } from '@/components/billing/subscription-status';
import { PurchaseHistory } from '@/components/billing/purchase-history';

export default async function BillingSettingsPage() {
  const user = await requireAuth();

  // Sync Stripe data to ensure fresh billing information
  const customerId = await getUserStripeCustomerId(user.id);
  if (customerId) {
    await syncStripeDataToKV(customerId);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Billing & Credits</h1>

        <div className="grid gap-8">
          <SubscriptionStatus />
          <PurchaseHistory />
        </div>
      </div>
    </div>
  );
}
