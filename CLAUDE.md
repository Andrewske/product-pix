# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ProductPix is a SaaS application that uses AI (Gemini) to generate professional product photos for e-commerce sellers. Built with Next.js 16 (App Router), Supabase, and Cloudflare R2.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
npm run start    # Start production server
```

### Supabase Commands

```bash
npx supabase db push          # Push migrations to remote
npx supabase gen types ts     # Generate TypeScript types from schema
npx supabase migration new    # Create new migration
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16 with App Router (React 19)
- **Database**: Supabase (PostgreSQL with RLS)
- **Storage**: Cloudflare R2 (S3-compatible, zero egress)
- **AI**: Vercel AI SDK with Google Gemini
- **Styling**: Tailwind CSS v4
- **Rate Limiting**: Upstash Redis

### Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API endpoints (generate, upload, images)
│   ├── auth/              # Auth callback handling
│   └── (pages)/           # Page components (dashboard, generate, login)
├── components/
│   ├── ui/                # Reusable UI primitives (button, card, input)
│   ├── forms/             # Form components (prompt-input, upload-form)
│   ├── layout/            # Layout components (header, footer)
│   └── auth/              # Auth components (login-form, signup-form)
├── lib/
│   ├── ai/                # AI provider implementation
│   │   ├── providers/     # Gemini provider
│   │   └── generate-image.ts  # Core generation logic
│   ├── db/                # Database queries (users, jobs, credits, uploads)
│   ├── r2/                # R2 client, presigned URLs, upload utilities
│   ├── supabase/          # Supabase clients (browser, server, admin)
│   ├── auth/              # Auth utilities and hooks
│   ├── rate-limit/        # Upstash rate limiting
│   └── env.ts             # Environment validation (Zod)
└── types/
    └── database.ts        # Generated Supabase types
```

### Database Schema (Supabase)

Key tables:
- `users`: User profiles with credit_balance and tier (free/pro/business)
- `uploads`: User-uploaded source images (stored in R2)
- `jobs`: Generation job queue with status tracking
- `generated_images`: Output images with metadata
- `credit_transactions`: Credit ledger for purchases/generations/refunds

Key RPC functions:
- `create_generation_job`: Creates job and consumes credits atomically
- `add_credits`, `consume_credits`, `refund_credits`: Credit operations

### Image Generation Flow

1. User submits prompt via `/api/generate` (POST)
2. Rate limit check (Upstash)
3. Job created with credit consumption (`create_generation_job` RPC)
4. Image generated via Gemini provider (`src/lib/ai/generate-image.ts`)
5. Result uploaded to R2, record saved to `generated_images`
6. Job status updated (completed/failed)

### Storage Pattern (R2)

Direct browser uploads use presigned URLs:
- Client requests presigned URL from `/api/upload/presign`
- Browser uploads directly to R2 (no server size limits)
- Client confirms upload via `/api/upload/confirm`

File paths:
- Uploads: `uploads/{userId}/{timestamp}-{filename}`
- Generated: `generated/{userId}/{jobId}.{format}`

### Supabase Client Usage

- **Browser components**: `createClient()` from `@/lib/supabase/client`
- **Server components/API routes**: `await createClient()` from `@/lib/supabase/server`
- **Admin operations** (bypass RLS): `createAdminClient()` from `@/lib/supabase/admin`

### Environment Variables

Required variables are validated in `src/lib/env.ts`:
- `GOOGLE_GENERATIVE_AI_API_KEY`: Gemini API
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`
- `NEXT_PUBLIC_APP_URL`

## Code Conventions

- Functional programming style - avoid classes except when required by frameworks
- All lib modules export via index.ts barrel files
- API routes use Zod for request validation
- Database queries in `src/lib/db/` with typed helpers
- Path alias: `@/*` maps to `./src/*`
