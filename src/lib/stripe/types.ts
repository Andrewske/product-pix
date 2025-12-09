import type Stripe from 'stripe';
import { getSubscriptionTimestamps } from './sdk-extensions';

// =============================================================================
// Database Insert Types
// =============================================================================

export interface SubscriptionDbInsert {
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: string;
  price_id: string;
  tier: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

// =============================================================================
// Transformation Helpers
// =============================================================================

export function formatSubscriptionForDb(
  userId: string,
  subscription: Stripe.Subscription
): SubscriptionDbInsert {
  const tier = subscription.metadata.tier;
  if (!tier) {
    throw new Error(`Subscription ${subscription.id} missing tier metadata`);
  }

  const timestamps = getSubscriptionTimestamps(subscription);

  return {
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id:
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer.id,
    status: subscription.status,
    price_id: subscription.items.data[0]?.price.id ?? '',
    tier,
    current_period_start: new Date(timestamps.currentPeriodStart * 1000).toISOString(),
    current_period_end: new Date(timestamps.currentPeriodEnd * 1000).toISOString(),
    cancel_at_period_end: timestamps.cancelAtPeriodEnd,
  };
}
