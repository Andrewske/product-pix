import { SubscriptionStatus } from '@/components/billing/subscription-status';
import { PurchaseHistory } from '@/components/billing/purchase-history';

export function BillingTab() {
  return (
    <div className="space-y-6">
      <SubscriptionStatus />
      <PurchaseHistory />
    </div>
  );
}