import Stripe from 'stripe';
import { stripe } from './client';
import { syncStripeDataToKV } from './sync';
import { grantCreditsForPayment } from './credits';
import { CREDIT_PACKS, SUBSCRIPTION_TIERS } from './products';
import {
  getInvoiceSubscriptionId,
  getSubscriptionTimestamps,
} from './sdk-extensions';
import { logger } from '../logging';

/**
 * Process Stripe webhook events
 */
export async function processStripeEvent(event: Stripe.Event): Promise<void> {
  logger.info('Processing Stripe webhook event', { eventType: event.type });

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        // Ignore other events
        break;
    }
  } catch (error) {
    logger.error('Error processing Stripe webhook event', { eventType: event.type, error });
    throw error;
  }
}

/**
 * Handle successful checkout session completion
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  // Sync customer data
  await syncStripeDataToKV(session.customer as string);
}

/**
 * Handle subscription changes
 */
async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  // Sync subscription data
  await syncStripeDataToKV(subscription.customer as string);

  // TODO: Implement subscription tier upgrade handling with prorated credits
  // Business logic needed: How to handle mid-cycle upgrades?
  // Options: Immediate full credit grant vs prorated amount
}

/**
 * Handle successful invoice payment (subscription renewal)
 */
async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  if (!subscriptionId || invoice.billing_reason !== 'subscription_cycle') {
    return; // Only process subscription renewals
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const tier = subscription.metadata.tier as keyof typeof SUBSCRIPTION_TIERS;

  if (!tier || !SUBSCRIPTION_TIERS[tier]) {
    logger.warn('Unknown subscription tier', { tier, subscriptionId: subscription.id });
    return;
  }

  // Get customer to find userId
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
  const customer = await stripe.customers.retrieve(customerId);

  if (customer.deleted) {
    logger.error('Customer is deleted', { customerId });
    return;
  }

  const userId = customer.metadata?.userId;

  if (!userId) {
    logger.error('No userId in customer metadata', { customerId });
    return;
  }

  // Grant renewal credits
  const timestamps = getSubscriptionTimestamps(subscription);
  await grantCreditsForPayment({
    userId,
    paymentIntentId: `invoice_${invoice.id}`, // Use invoice ID as unique identifier
    customerId,
    credits: SUBSCRIPTION_TIERS[tier].credits,
    amountCents: invoice.amount_due,
    purchaseType: 'subscription_renewal',
    metadata: {
      subscriptionId: subscription.id,
      tier,
      periodStart: timestamps.currentPeriodStart,
      periodEnd: timestamps.currentPeriodEnd,
    },
  });
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  logger.warn('Invoice payment failed', { invoiceId: invoice.id });
  // Could send notification to user, but subscription stays active until retry limit
}

/**
 * Handle successful payment intent (credit pack purchases)
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Extract metadata from payment intent
  const metadata = paymentIntent.metadata;
  if (!metadata.userId) return; // Not a purchase we handle

  const packId = metadata.packId as keyof typeof CREDIT_PACKS;
  if (!packId || !CREDIT_PACKS[packId]) {
    logger.warn('Unknown credit pack', { packId, paymentIntentId: paymentIntent.id });
    return;
  }

  // Grant pack credits
  await grantCreditsForPayment({
    userId: metadata.userId,
    paymentIntentId: paymentIntent.id,
    customerId: paymentIntent.customer as string,
    credits: CREDIT_PACKS[packId].credits,
    amountCents: paymentIntent.amount,
    purchaseType: 'pack_purchase',
    metadata: { packId },
  });
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  logger.warn('Payment intent failed', { paymentIntentId: paymentIntent.id });
  // Could send notification, but payment intent status is already failed
}

/**
 * Handle charge refunded (cash refund completion)
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  const refund = charge.refunds?.data[0];
  if (!refund) {
    logger.warn('Charge refunded but no refund object', { chargeId: charge.id });
    return;
  }

  // Import admin client here to avoid circular imports
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('cash_refund_requests')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('stripe_refund_id', refund.id);

  if (error) {
    logger.error('Failed to update cash refund status', { refundId: refund.id, error });
  } else {
    logger.info('Cash refund completed', { refundId: refund.id });
  }
}
