import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { getUserStripeCustomerId } from '@/lib/stripe/customer';
import { requireAuth } from '@/lib/auth/server';
import { createPaymentError, ErrorCodes } from '@/lib/errors';
import { captureError } from '@/lib/observability/capture-error';
import type { User } from '@supabase/supabase-js';

export async function POST(): Promise<NextResponse> {
  let user: User | undefined;

  try {
    user = await requireAuth();
    const customerId = await getUserStripeCustomerId(user.id);

    if (!customerId) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/settings/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const paymentError = createPaymentError(
      ErrorCodes.PAYMENT_INTENT_FAILED,
      'Failed to create Stripe portal session',
      {
        severity: 'critical',
        amount: 0,
        currency: 'usd',
        stripeErrorCode: error instanceof Error ? error.message : 'unknown',
        userId: user?.id,
      }
    );

    await captureError(paymentError, { route: '/api/stripe/portal' });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
