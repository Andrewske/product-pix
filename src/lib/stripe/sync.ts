import { stripe } from './client';
import type Stripe from 'stripe';
import { redis } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserIdByStripeCustomerId } from './customer';
import { formatSubscriptionForDb } from './types';
import { getSubscriptionTimestamps } from './sdk-extensions';

/**
 * Sync Stripe data to KV store (Redis) and database
 * This is the CRITICAL function called from both webhook and success route
 * Follows the single sync function pattern from notes-on-stripe.md
 */
export async function syncStripeDataToKV(customerId: string): Promise<void> {
  try {
    // 1. Get userId from customer metadata (with fallback to DB lookup)
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return;

    const userId = customer.metadata.userId ?? await getUserIdByStripeCustomerId(customerId);
    if (!userId) throw new Error(`No userId for customer ${customerId}`);

    // 2. Sync subscription state to Redis (short TTL for freshness)
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    const subData = subscriptions.data.length > 0
      ? formatSubscriptionData(subscriptions.data[0])
      : { status: 'none' };

    await redis?.set(`stripe:customer:${customerId}`, JSON.stringify(subData), { ex: 300 }); // 5min

    // 3. Upsert subscription to DB if exists
    if (subscriptions.data.length > 0) {
      await upsertSubscription(userId, subscriptions.data[0]);
    }
  } catch (error) {
    console.error('[Stripe Sync]', error);
    throw error;
  }
}

/**
 * Format subscription data for caching
 */
function formatSubscriptionData(subscription: Stripe.Subscription): {
  id: string;
  status: Stripe.Subscription.Status;
  priceId: string | undefined;
  tier: string | undefined;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
} {
  const timestamps = getSubscriptionTimestamps(subscription);
  return {
    id: subscription.id,
    status: subscription.status,
    priceId: subscription.items.data[0]?.price.id,
    tier: subscription.metadata.tier,
    currentPeriodStart: timestamps.currentPeriodStart,
    currentPeriodEnd: timestamps.currentPeriodEnd,
    cancelAtPeriodEnd: timestamps.cancelAtPeriodEnd,
  };
}

/**
 * Upsert subscription data to database
 */
async function upsertSubscription(userId: string, subscription: Stripe.Subscription): Promise<void> {
  const tier = subscription.metadata.tier;
  if (!tier) return; // Only track subscriptions with tier metadata

  const dbData = formatSubscriptionForDb(userId, subscription);

  await createAdminClient()
    .from('stripe_subscriptions')
    .upsert(dbData, {
      onConflict: 'stripe_subscription_id',
    });
}
