import { z } from 'zod';

/**
 * Credit economy configuration schema.
 * Defines the credit system: resolution costs, signup bonuses, packs, and subscriptions.
 */
const CreditEconomySchema = z.object({
  creditsPerResolution: z.object({
    '1k': z.number().int().positive(),
    '2k': z.number().int().positive(),
    '4k': z.number().int().positive(),
  }),
  freeCreditsOnSignup: z.number().int().min(0),
  packs: z.object({
    pack_50: z.object({
      credits: z.literal(50),
      slug: z.literal('pack_50'),
    }),
    pack_200: z.object({
      credits: z.literal(200),
      slug: z.literal('pack_200'),
    }),
    pack_500: z.object({
      credits: z.literal(500),
      slug: z.literal('pack_500'),
    }),
  }),
  subscriptions: z.object({
    pro: z.object({
      creditsPerMonth: z.literal(200),
      slug: z.literal('pro'),
    }),
    business: z.object({
      creditsPerMonth: z.literal(600),
      slug: z.literal('business'),
    }),
  }),
});

/**
 * Credit economy configuration.
 * Source of truth for credit costs, bonuses, and subscription tiers.
 */
export const creditEconomy = {
  creditsPerResolution: { '1k': 1, '2k': 2, '4k': 3 },
  freeCreditsOnSignup: 5,
  packs: {
    pack_50: { credits: 50, slug: 'pack_50' },
    pack_200: { credits: 200, slug: 'pack_200' },
    pack_500: { credits: 500, slug: 'pack_500' },
  },
  subscriptions: {
    pro: { creditsPerMonth: 200, slug: 'pro' },
    business: { creditsPerMonth: 600, slug: 'business' },
  },
} as const;

// Validate configuration at module load time
CreditEconomySchema.parse(creditEconomy);

// Export validated type
export type CreditEconomy = z.infer<typeof CreditEconomySchema>;