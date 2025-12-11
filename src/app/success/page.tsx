import { requireAuth } from '@/lib/auth/server';
import { getUserStripeCustomerId } from '@/lib/stripe/customer';
import { syncStripeDataToKV } from '@/lib/stripe/sync';
import { logger } from '@/lib/logging';
import { SuccessDisplay } from './success-display';

export default async function SuccessPage() {
  const user = await requireAuth();

  // Sync immediately to beat webhooks (per notes-on-stripe.md)
  // If sync fails, still show success - webhooks will handle it eventually
  const customerId = await getUserStripeCustomerId(user.id);
  if (customerId) {
    try {
      await syncStripeDataToKV(customerId);
    } catch (error) {
      // Log but don't block success display - webhooks will sync eventually
      logger.error('Stripe sync failed on success page', { error, customerId });
    }
  }

  // Render success display instead of redirecting immediately
  return <SuccessDisplay />;
}
