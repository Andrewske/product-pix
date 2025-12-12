// src/lib/stripe/refunds.ts
import Stripe from 'stripe';
import { stripe } from './client';

export async function createStripeRefund(params: {
  paymentIntentId: string;
  amountCents: number;
  metadata: {
    userId: string;
    purchaseId: string;
    creditsRefunded: string;
    percentage: string;
  };
}): Promise<Stripe.Refund> {
  return await stripe.refunds.create({
    payment_intent: params.paymentIntentId,
    amount: params.amountCents,
    metadata: params.metadata,
  });
}