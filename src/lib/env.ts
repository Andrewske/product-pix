import { z } from 'zod';

const envSchema = z.object({
   // Google AI
   GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
   GEMINI_MODEL: z.string().optional().default('gemini-3-pro-image-preview'),
   ANALYSIS_MODEL: z.string().optional().default('gemini-2.0-flash'),

   // Anthropic (for evaluation)
   ANTHROPIC_API_KEY: z.string().min(1).optional(), // Required only for evaluation

   // Supabase
   NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
   SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

   // R2
   R2_ACCOUNT_ID: z.string().min(1),
   R2_ACCESS_KEY_ID: z.string().min(1),
   R2_SECRET_ACCESS_KEY: z.string().min(1),
   R2_BUCKET_NAME: z.string().min(1),
   R2_PUBLIC_URL: z.string().url(),

   // App
   NEXT_PUBLIC_APP_URL: z.string().url(),

   // Cron
   CRON_SECRET: z.string().min(1).optional(),
   // Stripe
   STRIPE_SECRET_KEY: z.string().min(1),
   STRIPE_WEBHOOK_SECRET: z.string().min(1),
   STRIPE_PRICE_PACK_50: z.string().min(1),
   STRIPE_PRICE_PACK_200: z.string().min(1),
   STRIPE_PRICE_PACK_500: z.string().min(1),
   STRIPE_PRICE_PRO_MONTHLY: z.string().min(1),
   STRIPE_PRICE_BUSINESS_MONTHLY: z.string().min(1),

   // Resend Email
   EMAIL_ENABLED: z.enum(['true', 'false']).optional().default('false'),
   RESEND_API_KEY: z.string().optional(),
   RESEND_FROM_EMAIL: z.string().optional(),
   ADMIN_EMAIL: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

// Lazy validation - only parse when first accessed
// This allows dotenv to load before validation in CLI scripts
let _env: Env | null = null;

const getEnv = (): Env => {
  if (!_env) {
    _env = envSchema.parse(process.env);
  }
  return _env;
};

// Export a Proxy that lazily validates on first property access
// This maintains backward compatibility - no code changes needed
export const env = new Proxy({} as Env, {
  get(_, prop) {
    return getEnv()[prop as keyof Env];
  },
});