import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { stripe } from '@/lib/stripe/client';
import { getOrCreateStripeCustomer } from '@/lib/stripe/customer';
import { CREDIT_PACKS, SUBSCRIPTION_TIERS } from '@/lib/stripe/products';
import { requireAuth } from '@/lib/auth/server';

const checkoutSchema = z.object({
  type: z.enum(['pack', 'subscription']),
  packId: z.enum(['pack_50', 'pack_200', 'pack_500']).optional(),
  tier: z.enum(['pro', 'business']).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user.email) {
      return NextResponse.json({ error: 'Email required for checkout' }, { status: 400 });
    }
    if (!user.email) {
      return NextResponse.json({ error: 'Email required for checkout' }, { status: 400 });
    }
    const body = await req.json();
    const { type, packId, tier } = checkoutSchema.parse(body);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // CRITICAL: Get or create customer BEFORE checkout
    const customerId = await getOrCreateStripeCustomer(user.id, user.email);

    if (type === 'pack' && packId) {
      const pack = CREDIT_PACKS[packId];
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        line_items: [{ price: pack.priceId, quantity: 1 }],
        payment_intent_data: {
          metadata: { userId: user.id, packId, credits: pack.credits },
        },
        success_url: `${baseUrl}/success`,
        cancel_url: `${baseUrl}/pricing`,
      });

      return NextResponse.json({ url: session.url });
    }

    if (type === 'subscription' && tier) {
      const subscriptionTier = SUBSCRIPTION_TIERS[tier];
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [{ price: subscriptionTier.priceId, quantity: 1 }],
        subscription_data: {
          metadata: { userId: user.id, tier, credits: subscriptionTier.credits },
        },
        success_url: `${baseUrl}/success`,
        cancel_url: `${baseUrl}/pricing`,
      });

      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('[Stripe Checkout]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
