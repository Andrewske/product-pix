# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ProductPix is a SaaS application that uses AI (Gemini) to generate professional product photos for e-commerce sellers. Built with Next.js 16 (App Router), Supabase, and Cloudflare R2.

## Commands

```bash
pnpm dev      # Start development server (http://localhost:3000)
pnpm build    # Production build
pnpm lint     # Run ESLint
pnpm start    # Start production server
```

### Testing Commands

```bash
pnpm test              # Run Jest tests
pnpm test:watch        # Run tests in watch mode
pnpm test:coverage     # Run tests with coverage report
```

### Prompt Testing CLI

```bash
pnpm bench run --template <slug> --batch <file> [--label <name>] [--dry-run]
pnpm bench evaluate --label <batch-label>
pnpm bench compare --baseline <label> --candidate <label>
pnpm bench report --label <batch-label>
pnpm bench sync    # Sync templates to database
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
- **Evaluation**: Anthropic Claude (for prompt evaluation)
- **Styling**: Tailwind CSS v4
- **Rate Limiting**: Upstash Redis
- **Testing**: Jest with ts-jest

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
│   │   ├── providers/     # Gemini provider (supports rawPrompt mode)
│   │   └── generate-image.ts  # Core generation logic
│   ├── db/                # Database queries (users, jobs, credits, uploads)
│   ├── prompts/           # Prompt testing framework
│   │   ├── types.ts       # Zod schemas for templates, tests, evaluations
│   │   ├── errors.ts      # Result type and error handling utilities
│   │   ├── compiler.ts    # Template compilation and variable substitution
│   │   ├── registry.ts    # In-code template definitions
│   │   ├── evaluator.ts   # LLM-based image evaluation (Claude)
│   │   ├── statistics.ts  # A/B testing statistics (Welch's t-test)
│   │   ├── db/            # Database operations for templates
│   │   ├── templates/     # Template definitions (ecommerce-base, lifestyle-product)
│   │   └── __tests__/     # Unit tests
│   ├── r2/                # R2 client, presigned URLs, upload utilities
│   ├── supabase/          # Supabase clients (browser, server, admin)
│   ├── auth/              # Auth utilities and hooks
│   ├── rate-limit/        # Upstash rate limiting
│   └── env.ts             # Environment validation (Zod)
├── types/
│   └── database.ts        # Generated Supabase types
scripts/
├── prompt-bench.ts        # CLI entry point for prompt testing
├── commands/              # CLI command implementations
│   ├── run.ts             # Execute prompt tests
│   ├── evaluate.ts        # Score generated images with Claude
│   ├── compare.ts         # A/B test comparison with statistical analysis
│   ├── report.ts          # Generate batch reports
│   └── sync.ts            # Sync templates to database
└── test-*.ts              # Ad-hoc AI testing scripts
tests/
└── fixtures/              # Test data (products-mix.json)
```

### Database Schema (Supabase)

Key tables:
- `users`: User profiles with credit_balance and tier (free/pro/business)
- `uploads`: User-uploaded source images (stored in R2)
- `jobs`: Generation job queue with status tracking
- `generated_images`: Output images with metadata
- `credit_transactions`: Credit ledger for purchases/generations/refunds
- `prompt_templates`: Versioned prompt definitions with variable schemas
- `prompt_tests`: Individual test generations with idempotency tracking
- `prompt_evaluations`: LLM evaluation scores and feedback

Key RPC functions:
- `create_generation_job`: Creates job and consumes credits atomically
- `add_credits`, `consume_credits`, `refund_credits`: Credit operations
- `update_prompt_test_status`: Atomic test status updates with error tracking

### Image Generation Flow

1. User submits prompt via `/api/generate` (POST)
2. Rate limit check (Upstash)
3. Job created with credit consumption (`create_generation_job` RPC)
4. Image generated via Gemini provider (`src/lib/ai/generate-image.ts`)
5. Result uploaded to R2, record saved to `generated_images`
6. Job status updated (completed/failed)

### Prompt Testing Framework

A CLI-driven system for iterating on prompt templates:

1. **Templates**: Define prompt components (subject, lighting, background, etc.) with typed variables
2. **Compilation**: Substitute variables into templates, generate idempotency keys
3. **Generation**: Run batches of test cases through Gemini with `rawPrompt` mode
4. **Evaluation**: Score images 1-10 using Claude (composition, lighting, product visibility, etc.)
5. **Statistics**: Compare batches with Welch's t-test for statistical significance

Key patterns:
- Result type (`ok`/`err`) for error handling without exceptions
- Idempotency keys prevent duplicate tests on script re-runs
- Batch labels group tests for A/B comparisons
- Test status: pending → generating → evaluating → completed/failed

### Storage Pattern (R2)

Direct browser uploads use presigned URLs:
- Client requests presigned URL from `/api/upload/presign`
- Browser uploads directly to R2 (no server size limits)
- Client confirms upload via `/api/upload/confirm`

File paths:
- Uploads: `uploads/{userId}/{timestamp}-{filename}`
- Generated: `generated/{userId}/{jobId}.{format}`
- Prompt tests: `prompt-tests/{testId}.png`

### Supabase Client Usage

- **Browser components**: `createClient()` from `@/lib/supabase/client`
- **Server components/API routes**: `await createClient()` from `@/lib/supabase/server`
- **Admin operations** (bypass RLS): `createAdminClient()` from `@/lib/supabase/admin`

### Environment Variables

Required variables are validated in `src/lib/env.ts`:
- `GOOGLE_GENERATIVE_AI_API_KEY`: Gemini API
- `ANTHROPIC_API_KEY`: Claude API (for prompt evaluation)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`
- `NEXT_PUBLIC_APP_URL`

## Code Conventions

- Functional programming style - avoid classes except when required by frameworks
- All lib modules export via index.ts barrel files
- API routes use Zod for request validation
- Database queries in `src/lib/db/` with typed helpers
- Result type (`ok`/`err`) for operations that can fail in `src/lib/prompts/`
- Path alias: `@/*` maps to `./src/*`

## Package Manager

This project uses **pnpm**. Do not use npm or yarn.

```bash
pnpm install   # Install dependencies
pnpm add <pkg> # Add a dependency
```

## Recent Updates (2025-12-05)

### Prompt Testing Framework (testing-framework branch)
Added a complete prompt testing system for iterating on image generation prompts:

- **New module**: `src/lib/prompts/` with types, compiler, evaluator, statistics
- **CLI tool**: `pnpm bench` for running tests, evaluations, and A/B comparisons
- **Database**: New tables for templates, tests, and evaluations (migrations 00009-00013)
- **Dependencies**: Added `@anthropic-ai/sdk`, `jest`, `ts-jest`, `tsx`
- **Gemini update**: Provider now supports `rawPrompt` option to bypass internal prompt processing