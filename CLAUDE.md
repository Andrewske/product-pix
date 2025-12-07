# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ProductPix is a SaaS application that uses AI (Gemini) to generate professional product photos for e-commerce sellers. Built with Next.js 16 (App Router), Supabase, and Cloudflare R2.

## Commands

```bash
bun dev      # Start development server (http://localhost:3000)
bun build    # Production build
bun lint     # Run ESLint
bun start    # Start production server
```

### Testing Commands

```bash
bun test              # Run Jest tests
bun test:watch        # Run tests in watch mode
bun test:coverage     # Run tests with coverage report
```

### Prompt Testing CLI

```bash
# Core workflow
bun bench run --template <slug> --batch <file> [--label <name>] [--dry-run]
bun bench evaluate --label <batch-label>
bun bench compare --baseline <label> --candidate <label>
bun bench report --label <batch-label> [--baseline <label>] [--insights]
bun bench sync    # Sync templates to database

# Additional commands
bun bench test --template <slug> --batch <file>  # Full pipeline (sync→run→evaluate→report)
bun bench progress --label <batch-label>         # Check batch progress
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
- **AI Generation**: Vercel AI SDK with Google Gemini (text-to-image and image-to-image)
- **AI Evaluation**: Anthropic Claude (prompt evaluation and insights)
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
│   │   ├── providers/     # Gemini provider (supports rawPrompt + image-to-image)
│   │   └── generate-image.ts  # Core generation logic
│   ├── db/                # Database queries (users, jobs, credits, uploads)
│   ├── prompts/           # Prompt testing framework
│   │   ├── types.ts       # Zod schemas for templates, tests, evaluations
│   │   ├── errors.ts      # Result type and error handling utilities
│   │   ├── compiler.ts    # Template compilation and variable substitution
│   │   ├── registry.ts    # In-code template definitions
│   │   ├── evaluator.ts   # LLM-based image evaluation (Claude)
│   │   ├── statistics.ts  # A/B testing statistics (Welch's t-test)
│   │   ├── orchestrator.ts # Pipeline coordinator (sync→run→evaluate→report)
│   │   ├── source-image.ts # Image-to-image source handling and R2 upload
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
│   ├── report.ts          # Generate HTML reports with optional AI insights
│   ├── insights.ts        # AI-powered batch analysis using Claude
│   ├── test.ts            # Full pipeline orchestration
│   ├── progress.ts        # Batch progress monitoring
│   ├── sync.ts            # Sync templates to database
│   └── shared.ts          # Shared utilities across commands
└── test-*.ts              # Ad-hoc AI testing scripts
tests/
└── fixtures/              # Test data (products-mix.json, images-batch.json)
reports/                   # Generated HTML reports (gitignored)
```

### Database Schema (Supabase)

Key tables:
- `users`: User profiles with credit_balance and tier (free/pro/business)
- `uploads`: User-uploaded source images (stored in R2)
- `jobs`: Generation job queue with status tracking
- `generated_images`: Output images with metadata
- `credit_transactions`: Credit ledger for purchases/generations/refunds
- `prompt_templates`: Versioned prompt definitions with variable schemas
- `prompt_tests`: Individual test generations with idempotency tracking (supports source images)
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
6. **Reporting**: Generate HTML reports with baseline comparison and AI insights

Key patterns:
- Result type (`ok`/`err`) for error handling without exceptions
- Idempotency keys prevent duplicate tests on script re-runs
- Batch labels group tests for A/B comparisons
- Test status: pending → generating → evaluating → completed/failed
- Pipeline orchestrator for coordinated execution

### Image-to-Image Testing

The framework supports image-to-image generation for product photo transformation:

```json
{
  "label": "my-batch",
  "tests": [{
    "sourceImage": "./images/product.jpg",
    "variables": { "product": "suitcase", "style": "catalog" }
  }]
}
```

Source images are:
- Resolved relative to batch file location
- Uploaded to R2 with content-hash keys for deduplication
- Passed to Gemini with the compiled prompt

### Storage Pattern (R2)

Direct browser uploads use presigned URLs:
- Client requests presigned URL from `/api/upload/presign`
- Browser uploads directly to R2 (no server size limits)
- Client confirms upload via `/api/upload/confirm`

File paths:
- Uploads: `uploads/{userId}/{timestamp}-{filename}`
- Generated: `generated/{userId}/{jobId}.{format}`
- Prompt tests: `prompt-tests/{testId}.png`
- Source images: `prompt-tests/sources/{hash}.{ext}`

### Supabase Client Usage

- **Browser components**: `createClient()` from `@/lib/supabase/client`
- **Server components/API routes**: `await createClient()` from `@/lib/supabase/server`
- **Admin operations** (bypass RLS): `createAdminClient()` from `@/lib/supabase/admin`

### Environment Variables

Required variables are validated in `src/lib/env.ts`:
- `GOOGLE_GENERATIVE_AI_API_KEY`: Gemini API
- `GEMINI_MODEL`: Model ID (default: `gemini-3-pro-image-preview`)
- `ANTHROPIC_API_KEY`: Claude API (for prompt evaluation and insights)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`
- `NEXT_PUBLIC_APP_URL`

See `.env.example` for full configuration template.

## Code Conventions

- Functional programming style - avoid classes except when required by frameworks
- All lib modules export via index.ts barrel files
- API routes use Zod for request validation
- Database queries in `src/lib/db/` with typed helpers
- Result type (`ok`/`err`) for operations that can fail in `src/lib/prompts/`
- Path alias: `@/*` maps to `./src/*`

## Package Manager

This project uses **bun**. Do not use npm, yarn, or pnpm.

```bash
bun install   # Install dependencies
bun add <pkg> # Add a dependency
```

## Recent Updates (2025-12-06)

### Enhanced Report Generation
- **HTML Reports**: `bun bench report` generates interactive HTML reports in `reports/` directory
- **Baseline Comparison**: Compare against baseline batch with `--baseline <label>` flag
- **AI Insights**: Add `--insights` flag for Claude-powered analysis of batch results

### Image-to-Image Support
- **Source Images**: Batch files can include `sourceImage` field for image-to-image tests
- **R2 Upload**: Source images are automatically uploaded to R2 with content-hash deduplication
- **Database**: New `source_image_url` and `source_image_key` columns in `prompt_tests` (migration 00014)

### Pipeline Orchestrator
- **New Module**: `src/lib/prompts/orchestrator.ts` coordinates sync→run→evaluate→report pipeline
- **Test Command**: `bun bench test` runs full pipeline with progress callbacks
- **Progress Command**: `bun bench progress` monitors batch execution status

### CLI Improvements
- **Insights Command**: Generates AI-powered analysis of batch performance
- **Shared Utilities**: Common CLI utilities extracted to `scripts/commands/shared.ts`
