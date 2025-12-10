import { env } from '@/lib/env';

export const CREDIT_PACKS = {
  pack_50: { credits: 50, priceId: env.STRIPE_PRICE_PACK_50 },
  pack_200: { credits: 200, priceId: env.STRIPE_PRICE_PACK_200 },
  pack_500: { credits: 500, priceId: env.STRIPE_PRICE_PACK_500 },
} as const;

export const SUBSCRIPTION_TIERS = {
  pro: { credits: 200, priceId: env.STRIPE_PRICE_PRO_MONTHLY },
  business: { credits: 600, priceId: env.STRIPE_PRICE_BUSINESS_MONTHLY },
} as const;

export type CreditPackId = keyof typeof CREDIT_PACKS;
export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;
