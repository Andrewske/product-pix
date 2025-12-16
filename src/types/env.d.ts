// TypeScript declarations for Next.js environment variables
// Client code should access these directly via process.env.NEXT_PUBLIC_*
// Server code should use the env module from @/lib/env

declare namespace NodeJS {
  interface ProcessEnv {
    // Client-accessible variables (NEXT_PUBLIC_*)
    readonly NEXT_PUBLIC_SUPABASE_URL: string;
    readonly NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string;
    readonly NEXT_PUBLIC_APP_URL: string;
    readonly NEXT_PUBLIC_POSTHOG_KEY: string;
    readonly NEXT_PUBLIC_POSTHOG_HOST: string;

    // Server-only variables (accessed via env module)
    readonly GOOGLE_GENERATIVE_AI_API_KEY: string;
    readonly GEMINI_MODEL?: string;
    readonly ANALYSIS_MODEL?: string;
    readonly ANTHROPIC_API_KEY?: string;
    readonly SUPABASE_SERVICE_ROLE_KEY: string;
    readonly R2_ACCOUNT_ID: string;
    readonly R2_ACCESS_KEY_ID: string;
    readonly R2_SECRET_ACCESS_KEY: string;
    readonly R2_BUCKET_NAME: string;
    readonly R2_PUBLIC_URL: string;
    readonly CRON_SECRET?: string;
    readonly STRIPE_SECRET_KEY: string;
    readonly STRIPE_WEBHOOK_SECRET: string;
    readonly STRIPE_PRICE_PACK_50: string;
    readonly STRIPE_PRICE_PACK_200: string;
    readonly STRIPE_PRICE_PACK_500: string;
    readonly STRIPE_PRICE_PRO_MONTHLY: string;
    readonly STRIPE_PRICE_BUSINESS_MONTHLY: string;
    readonly EMAIL_ENABLED?: 'true' | 'false';
    readonly RESEND_API_KEY?: string;
    readonly RESEND_FROM_EMAIL?: string;
    readonly ADMIN_EMAIL?: string;
    readonly POSTHOG_API_KEY?: string;
    readonly POSTHOG_PROJECT_ID?: string;
    readonly POSTHOG_PERSONAL_API_KEY?: string;
    readonly POSTHOG_HOST?: string;
    readonly OBSERVABILITY_ENABLED?: 'true' | 'false';
  }
}
