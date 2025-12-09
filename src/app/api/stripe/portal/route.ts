import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { getUserStripeCustomerId } from '@/lib/stripe/customer';
import { requireAuth } from '@/lib/auth/server';

export async function POST() {
  try {
    const user = await requireAuth();
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
    console.error('[Stripe Portal]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
