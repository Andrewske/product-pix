import '@testing-library/jest-dom';

// Mock browser APIs for testing
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}));

// Setup test environment variables
process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-key';
process.env.GEMINI_MODEL = 'gemini-3-pro-image-preview';
process.env.ANALYSIS_MODEL = 'gemini-2.0-flash';
process.env.ANTHROPIC_API_KEY = 'test-key';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
process.env.R2_ACCOUNT_ID = 'test-account';
process.env.R2_ACCESS_KEY_ID = 'test-key';
process.env.R2_SECRET_ACCESS_KEY = 'test-secret';
process.env.R2_BUCKET_NAME = 'test-bucket';
process.env.R2_PUBLIC_URL = 'http://localhost:8787';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.CRON_SECRET = 'test-secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_123';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
process.env.STRIPE_PRICE_PACK_50 = 'price_test_50';
process.env.STRIPE_PRICE_PACK_200 = 'price_test_200';
process.env.STRIPE_PRICE_PACK_500 = 'price_test_500';
process.env.STRIPE_PRICE_PRO_MONTHLY = 'price_test_pro';
process.env.STRIPE_PRICE_BUSINESS_MONTHLY = 'price_test_business';