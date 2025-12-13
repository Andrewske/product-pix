import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/client';
import { processStripeEvent } from '@/lib/stripe/webhook-handlers';
import { env } from '@/lib/env';
import { createPaymentError } from '@/lib/errors/error-classes';
import { captureError } from '@/lib/observability/capture-error';
import { ErrorCodes } from '@/lib/errors/codes';

const ALLOWED_EVENTS: Stripe.Event.Type[] = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'charge.refunded',
];

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.text();
    const headersList = await headers();
    const sig = headersList.get('stripe-signature');

    if (!sig) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);

    if (!ALLOWED_EVENTS.includes(event.type)) {
      return NextResponse.json({ received: true });
    }

    // Process async but return 200 immediately (per notes-on-stripe.md)
    processStripeEvent(event).catch(async (error) => {
      const paymentError = createPaymentError(
        ErrorCodes.PAYMENT_WEBHOOK_INVALID,
        'Stripe webhook async processing failed',
        {
          severity: 'critical',
          amount: 0,
          currency: 'usd',
          stripeErrorCode: error instanceof Error ? error.message : 'unknown',
        }
      );

      await captureError(paymentError, { route: '/api/webhooks/stripe' });
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    const paymentError = createPaymentError(
      ErrorCodes.PAYMENT_WEBHOOK_INVALID,
      'Stripe webhook processing failed',
      {
        severity: 'critical',
        amount: 0, // Webhook validation doesn't have amount context
        currency: 'usd',
        stripeErrorCode: error instanceof Error ? error.message : 'unknown',
      }
    );

    await captureError(paymentError, { route: '/api/webhooks/stripe' });

    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }
}
