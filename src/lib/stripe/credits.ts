import { createAdminClient } from '@/lib/supabase/admin';
import { addCredits } from '@/lib/db/credits';
import type { Json } from '@/types';

const POSTGRES_UNIQUE_VIOLATION = '23505';
export interface GrantCreditsParams {
  userId: string;
  paymentIntentId: string;
  customerId: string;
  credits: number;
  amountCents: number;
  purchaseType: 'pack_purchase' | 'subscription_renewal' | 'subscription_upgrade';
  metadata?: Record<string, unknown>;
}

/**
 * Grant credits for a payment with race condition protection
 * Uses INSERT ... ON CONFLICT DO NOTHING for atomic idempotency
 */
export async function grantCreditsForPayment(params: GrantCreditsParams): Promise<{ granted: boolean }> {
  // Use INSERT ... ON CONFLICT DO NOTHING for atomic idempotency
  // Only grant credits if the insert succeeded (returned a row)
  const { data, error } = await createAdminClient()
    .from('stripe_purchases')
    .insert({
      user_id: params.userId,
      stripe_payment_intent_id: params.paymentIntentId,
      stripe_customer_id: params.customerId,
      amount_cents: params.amountCents,
      credits_granted: params.credits,
      purchase_type: params.purchaseType,
      metadata: (params.metadata as Json) ?? null,
    })
    .select('id')
    .single();

  // If insert failed due to conflict, purchase already processed
  if (error?.code === POSTGRES_UNIQUE_VIOLATION) {
    return { granted: false };
  }
  if (error) throw error;

  // Insert succeeded - this is a new purchase, grant credits
  // Idempotency key format: pi_{paymentIntentId} (PI IDs are globally unique)
  await addCredits(
    params.userId,
    params.credits,
    params.purchaseType,
    `pi_${params.paymentIntentId}`,
    `${params.credits} credits from ${params.purchaseType}`
  );

  return { granted: true };
}
