'use server';

import { requireAuth } from '@/lib/auth/server';
import { stripe } from '@/lib/stripe/client';
import { getOrCreateStripeCustomer } from '@/lib/stripe/customer';
import { CREDIT_PACKS, SUBSCRIPTION_TIERS, type CreditPackId, type SubscriptionTier } from '@/lib/stripe/products';
import { getPricing } from '@/lib/pricing/actions';
import { type PricingPack } from '@/lib/pricing/utils';

/**
 * Server action to get pricing data for the insufficient credits modal
 */
export async function getPricingForModal(): Promise<Record<string, PricingPack>> {
  const pricing = await getPricing();
  return pricing.packs;
}

/**
 * Server action to create a checkout session for a credit pack
 */
export async function createPackCheckout(packId: CreditPackId): Promise<{ url: string }> {
  try {
    const user = await requireAuth();
    if (!user.email) {
      throw new Error('Email is required to create a checkout session');
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const pack = CREDIT_PACKS[packId];

    if (!pack) {
      throw new Error(`Invalid credit pack ID: ${packId}`);
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(user.id, user.email);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [{ price: pack.priceId, quantity: 1 }],
      payment_intent_data: {
        metadata: { userId: user.id, packId, credits: pack.credits.toString() },
      },
      success_url: `${baseUrl}/settings/billing`,
      cancel_url: `${baseUrl}/pricing`,
    });

    if (!session.url) {
      throw new Error('Failed to create checkout session URL');
    }

    return { url: session.url };
  } catch (error) {
    console.error('[createPackCheckout]', error);
    if (error instanceof Error) {
      throw new Error(`Failed to create credit pack checkout: ${error.message}`);
    }
    throw new Error('Failed to create credit pack checkout: Unknown error occurred');
  }
}

/**
 * Server action to create a checkout session for a subscription
 */
export async function createSubscriptionCheckout(tier: SubscriptionTier): Promise<{ url: string }> {
  try {
    const user = await requireAuth();
    if (!user.email) {
      throw new Error('Email is required to create a checkout session');
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const subscriptionTier = SUBSCRIPTION_TIERS[tier];

    if (!subscriptionTier) {
      throw new Error(`Invalid subscription tier: ${tier}`);
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(user.id, user.email);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: subscriptionTier.priceId, quantity: 1 }],
      subscription_data: {
        metadata: { userId: user.id, tier, credits: subscriptionTier.credits.toString() },
      },
      success_url: `${baseUrl}/settings/billing`,
      cancel_url: `${baseUrl}/pricing`,
    });

    if (!session.url) {
      throw new Error('Failed to create checkout session URL');
    }

    return { url: session.url };
  } catch (error) {
    console.error('[createSubscriptionCheckout]', error);
    if (error instanceof Error) {
      throw new Error(`Failed to create subscription checkout: ${error.message}`);
    }
    throw new Error('Failed to create subscription checkout: Unknown error occurred');
  }
}