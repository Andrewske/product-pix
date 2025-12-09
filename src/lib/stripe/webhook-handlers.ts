import Stripe from 'stripe';
import { stripe } from './client';
import { syncStripeDataToKV } from './sync';
import { grantCreditsForPayment } from './credits';
import { CREDIT_PACKS, SUBSCRIPTION_TIERS } from './products';

/**
 * Process Stripe webhook events
 */
export async function processStripeEvent(event: Stripe.Event): Promise<void> {
  console.log(`[Stripe Webhook] Processing ${event.type}`);

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

      default:
        // Ignore other events
        break;
    }
  } catch (error) {
    console.error(`[Stripe Webhook] Error processing ${event.type}:`, error);
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

  // Handle tier upgrades (immediate credit grants)
  if (subscription.metadata.tier) {
    await handleSubscriptionTierUpgrade(subscription);
  }
}

/**
 * Handle successful invoice payment (subscription renewal)
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!invoice.subscription || invoice.billing_reason !== 'subscription_cycle') {
    return; // Only process subscription renewals
  }

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
  const tier = subscription.metadata.tier as keyof typeof SUBSCRIPTION_TIERS;

  if (!tier || !SUBSCRIPTION_TIERS[tier]) {
    console.warn(`[Stripe Webhook] Unknown tier ${tier} for subscription ${subscription.id}`);
    return;
  }

  // Get customer to find userId
  const customer = await stripe.customers.retrieve(subscription.customer as string);
  const userId = customer.metadata.userId;

  if (!userId) {
    console.error(`[Stripe Webhook] No userId in customer metadata for ${subscription.customer}`);
    return;
  }

  // Grant renewal credits
  await grantCreditsForPayment({
    userId,
    paymentIntentId: `invoice_${invoice.id}`, // Use invoice ID as unique identifier
    customerId: subscription.customer as string,
    credits: SUBSCRIPTION_TIERS[tier].credits,
    amountCents: invoice.amount_due,
    purchaseType: 'subscription_renewal',
    metadata: {
      subscriptionId: subscription.id,
      tier,
      periodStart: subscription.current_period_start,
      periodEnd: subscription.current_period_end,
    },
  });
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.warn(`[Stripe Webhook] Invoice payment failed: ${invoice.id}`);
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
    console.warn(`[Stripe Webhook] Unknown pack ${packId} for payment ${paymentIntent.id}`);
    return;
  }

  // Grant pack credits
  await grantCreditsForPayment({
    userId: metadata.userId,
    paymentIntentId: paymentIntent.id,
    customerId: paymentIntent.customer as string,
    credits: CREDIT_PACKS[packId].credits,
    amountCents: paymentIntent.amount,
    purchaseType: 'pack',
    metadata: { packId },
  });
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.warn(`[Stripe Webhook] Payment intent failed: ${paymentIntent.id}`);
  // Could send notification, but payment intent status is already failed
}

/**
 * Handle subscription tier upgrades with prorated credits
 */
async function handleSubscriptionTierUpgrade(subscription: Stripe.Subscription) {
  // This would be called when subscription.updated indicates a tier change
  // Implementation depends on how Stripe handles upgrades (immediate vs prorated)
  // For now, we'll handle this in the subscription.updated event if needed
}
