import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/client';
import { processStripeEvent } from '@/lib/stripe/webhook-handlers';
import { env } from '@/lib/env';

const ALLOWED_EVENTS: Stripe.Event.Type[] = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = headers().get('stripe-signature');

    if (!sig) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);

    if (!ALLOWED_EVENTS.includes(event.type)) {
      return NextResponse.json({ received: true });
    }

    // Process async but return 200 immediately (per notes-on-stripe.md)
    // Using edge runtime for waitUntil support
    if (typeof req.waitUntil === 'function') {
      req.waitUntil(processStripeEvent(event));
    } else {
      // Fallback for non-edge runtime
      processStripeEvent(event).catch((error) => {
        console.error('[Stripe Webhook] Async processing failed:', error);
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }
}
