# Install Dependencies and Setup Environment Variables

## Overview
Install the Resend SDK and configure environment variables for email service integration.

## Files to Modify/Create
- `package.json` (modify - add resend dependency)
- `src/lib/env.ts` (modify - add email env vars to Zod schema)
- `.env.example` (create new)

## Implementation Details

### 1. Install Resend SDK
```bash
bun add resend
```

### 2. Update Environment Schema

**File:** `src/lib/env.ts` (lines 37-40, after Stripe vars)

Add to `envSchema`:
```typescript
  // Resend Email
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email(),
  ADMIN_EMAIL: z.string().email(),
  EMAIL_ENABLED: z.enum(['true', 'false']).optional().default('true'),
```

### 3. Create .env.example

**File:** `.env.example` (new file)

```env
# Google AI
GOOGLE_GENERATIVE_AI_API_KEY=
GEMINI_MODEL=gemini-3-pro-image-preview
ANALYSIS_MODEL=gemini-2.0-flash

# Anthropic (for evaluation)
ANTHROPIC_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# R2 Storage
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron
CRON_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PACK_50=
STRIPE_PRICE_PACK_200=
STRIPE_PRICE_PACK_500=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_BUSINESS_MONTHLY=

# Resend Email (Production)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@productpix.com  # or onboarding@resend.dev for testing
ADMIN_EMAIL=admin@yourdomain.com
EMAIL_ENABLED=false  # Set to true in production
```

## Acceptance Criteria
- ✓ `resend` package appears in package.json dependencies
- ✓ TypeScript recognizes `import { Resend } from 'resend'`
- ✓ `env.RESEND_API_KEY` accessible in code
- ✓ Zod validation fails on invalid email addresses
- ✓ `.env.example` created with all required variables

## Dependencies
None - this is the foundational setup task

## Notes
- User must manually add variables to their `.env.local` file
- `EMAIL_ENABLED` defaults to `'true'` but should be `false` in local dev
