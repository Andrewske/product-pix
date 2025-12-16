import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { afterEach, mock } from 'bun:test';

// Register happy-dom globals (replaces jsdom)
GlobalRegistrator.register({
  url: 'http://localhost:3000',
});


// Mock Next.js Image component for tests
mock.module('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { src, alt, width, height, className, ...rest } = props;
    // Return a simple img element for testing
    return {
      $$typeof: Symbol.for('react.element'),
      type: 'img',
      props: { src, alt, width, height, className, ...rest },
      key: null,
      ref: null,
    };
  },
}));

// Setup test environment variables
const testEnv = {
  GOOGLE_GENERATIVE_AI_API_KEY: 'test-key',
  GEMINI_MODEL: 'gemini-3-pro-image-preview',
  ANALYSIS_MODEL: 'gemini-2.0-flash',
  ANTHROPIC_API_KEY: 'test-key',
  NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-key',
  R2_ACCOUNT_ID: 'test-account',
  R2_ACCESS_KEY_ID: 'test-key',
  R2_SECRET_ACCESS_KEY: 'test-secret',
  R2_BUCKET_NAME: 'test-bucket',
  R2_PUBLIC_URL: 'http://localhost:8787',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  CRON_SECRET: 'test-secret',
  STRIPE_SECRET_KEY: 'sk_test_123',
  STRIPE_WEBHOOK_SECRET: 'whsec_test',
  STRIPE_PRICE_PACK_50: 'price_test_50',
  STRIPE_PRICE_PACK_200: 'price_test_200',
  STRIPE_PRICE_PACK_500: 'price_test_500',
  STRIPE_PRICE_PRO_MONTHLY: 'price_test_pro',
  STRIPE_PRICE_BUSINESS_MONTHLY: 'price_test_business',
};

Object.keys(testEnv).forEach(key => {
  (process.env as Record<string, string>)[key] = testEnv[key as keyof typeof testEnv];
});



// Cleanup after each test for React Testing Library
afterEach(() => {
  if (typeof document !== 'undefined') {
    document.body.innerHTML = '';
  }
});
