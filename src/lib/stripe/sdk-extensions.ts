/**
 * Stripe SDK Type Extensions
 *
 * The official Stripe SDK types are incomplete for some numeric timestamp
 * properties. This module provides properly typed accessors.
 */

import type Stripe from 'stripe';

// =============================================================================
// Extended Subscription Type
// =============================================================================

/**
 * Subscription with runtime-accessible timestamp properties
 *
 * Note: Stripe SDK types define these as methods (.current_period_start())
 * but the API returns them as numeric properties
 */
export interface SubscriptionWithTimestamps extends Stripe.Subscription {
  current_period_start: number; // Unix timestamp in seconds
  current_period_end: number; // Unix timestamp in seconds
  cancel_at_period_end: boolean;
}

/**
 * Type guard to safely access subscription timestamps
 */
export function hasSubscriptionTimestamps(
  subscription: Stripe.Subscription
): subscription is SubscriptionWithTimestamps {
  return (
    typeof (subscription as SubscriptionWithTimestamps).current_period_start ===
      'number' &&
    typeof (subscription as SubscriptionWithTimestamps).current_period_end ===
      'number' &&
    typeof (subscription as SubscriptionWithTimestamps).cancel_at_period_end ===
      'boolean'
  );
}

/**
 * Safe accessor for subscription timestamps
 * Throws if properties are not present (should never happen in practice)
 */
export function getSubscriptionTimestamps(
  subscription: Stripe.Subscription
): {
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
} {
  if (!hasSubscriptionTimestamps(subscription)) {
    throw new Error(
      `Subscription ${subscription.id} missing expected timestamp properties`
    );
  }

  return {
    currentPeriodStart: subscription.current_period_start,
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };
}

// =============================================================================
// Extended Invoice Type
// =============================================================================

/**
 * Invoice with subscription reference
 *
 * Stripe SDK types don't include the subscription property on invoices
 */
export interface InvoiceWithSubscription extends Stripe.Invoice {
  subscription: string | Stripe.Subscription | null;
}

/**
 * Type guard for invoice subscription property
 */
export function hasInvoiceSubscription(
  invoice: Stripe.Invoice
): invoice is InvoiceWithSubscription {
  const sub = (invoice as InvoiceWithSubscription).subscription;
  return sub === null || typeof sub === 'string' || typeof sub === 'object';
}

/**
 * Safe accessor for invoice subscription ID
 * Returns null if not a subscription invoice
 */
export function getInvoiceSubscriptionId(
  invoice: Stripe.Invoice
): string | null {
  if (!hasInvoiceSubscription(invoice)) {
    return null;
  }

  const sub = invoice.subscription;
  if (sub === null) return null;
  return typeof sub === 'string' ? sub : sub.id;
}
