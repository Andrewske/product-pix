import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/server';
import { getUserStripeCustomerId } from '@/lib/stripe/customer';
import { syncStripeDataToKV } from '@/lib/stripe/sync';

export default async function SuccessPage() {
  const user = await requireAuth();

  // Sync immediately to beat webhooks (per notes-on-stripe.md)
  // If sync fails, still redirect - webhooks will handle it eventually
  const customerId = await getUserStripeCustomerId(user.id);
  if (customerId) {
    try {
      await syncStripeDataToKV(customerId);
    } catch (error) {
      // Log but don't block redirect - webhooks will sync eventually
      console.error('[Success Page] Sync failed, continuing with redirect:', error);
    }
  }

  // Don't use CHECKOUT_SESSION_ID - single sync function handles everything
  redirect('/dashboard');
}
