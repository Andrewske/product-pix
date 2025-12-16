import Stripe from 'stripe';
import { env } from '@/lib/env';

let _stripe: Stripe | null = null;

/**
 * Lazy Stripe client initialization.
 * Only creates the client when first accessed, avoiding env validation at import time.
 */
const getStripe = (): Stripe => {
  if (!_stripe) {
    _stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });
  }
  return _stripe;
};

export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});
