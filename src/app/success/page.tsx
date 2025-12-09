import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/hooks';
import { getUserStripeCustomerId } from '@/lib/stripe/customer';
import { syncStripeDataToKV } from '@/lib/stripe/sync';

export default async function SuccessPage() {
  const user = await requireAuth();

  // Sync immediately to beat webhooks (per notes-on-stripe.md)
  const customerId = await getUserStripeCustomerId(user.id);
  if (customerId) {
    await syncStripeDataToKV(customerId);
  }

  // Don't use CHECKOUT_SESSION_ID - single sync function handles everything
  redirect('/dashboard');
}
