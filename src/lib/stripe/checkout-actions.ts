'use server';

import { requireAuth } from '@/lib/auth/server';
import { stripe } from '@/lib/stripe/client';
import { getOrCreateStripeCustomer } from '@/lib/stripe/customer';
import { CREDIT_PACKS, SUBSCRIPTION_TIERS, type CreditPackId, type SubscriptionTier } from '@/lib/stripe/products';
import { getPricing } from '@/lib/pricing/actions';
import { type PricingPack } from '@/lib/pricing/utils';
import { createPaymentError } from '@/lib/errors/error-classes';
import { captureError } from '@/lib/observability/capture-error';
import { ErrorCodes } from '@/lib/errors/codes';

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
  const user = await requireAuth();
  const pack = CREDIT_PACKS[packId];

  try {
    if (!user.email) {
      throw new Error('Email is required to create a checkout session');
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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
    const paymentError = createPaymentError(
      ErrorCodes.PAYMENT_INTENT_FAILED,
      'Failed to create credit pack checkout session',
      {
        severity: 'critical',
        amount: pack.credits,
        originalError: error instanceof Error ? error.message : String(error),
        userId: user.id,
      }
    );
    await captureError(paymentError);
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
  const user = await requireAuth();
  const subscriptionTier = SUBSCRIPTION_TIERS[tier];

  try {
    if (!user.email) {
      throw new Error('Email is required to create a checkout session');
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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
    const paymentError = createPaymentError(
      ErrorCodes.PAYMENT_INTENT_FAILED,
      'Failed to create subscription checkout session',
      {
        severity: 'critical',
        amount: subscriptionTier.credits,
        originalError: error instanceof Error ? error.message : String(error),
        userId: user.id,
      }
    );
    await captureError(paymentError);
    if (error instanceof Error) {
      throw new Error(`Failed to create subscription checkout: ${error.message}`);
    }
    throw new Error('Failed to create subscription checkout: Unknown error occurred');
  }
}