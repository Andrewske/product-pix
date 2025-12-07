# Phase 7: Update Documentation

## Overview
Update CLAUDE.md to reflect the new project structure and path aliases.

## Tasks

### 7.1 Update Project Structure Section

**File**: `/home/kevin/coding/product-pix/CLAUDE.md`

Replace the existing Project Structure section with:

```markdown
### Project Structure

\`\`\`
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
│   ├── r2/                # R2 client, presigned URLs, upload utilities
│   ├── supabase/          # Supabase clients (browser, server, admin)
│   ├── auth/              # Auth utilities and hooks
│   ├── rate-limit/        # Upstash rate limiting
│   └── env.ts             # Environment validation (Zod)
└── types/
    └── database.ts        # Generated Supabase types

prompt-bench/               # Prompt testing CLI framework (isolated from main app)
├── cli.ts                 # CLI entry point
├── commands/              # CLI command implementations
│   ├── run.ts             # Execute prompt tests
│   ├── evaluate.ts        # Score generated images with Claude
│   ├── compare.ts         # A/B test comparison with statistical analysis
│   ├── report.ts          # Generate HTML reports with optional AI insights
│   ├── test.ts            # Full pipeline orchestration
│   ├── sync.ts            # Sync templates to database
│   ├── progress.ts        # Batch progress monitoring
│   ├── insights.ts        # AI-powered batch analysis
│   └── shared.ts          # Shared utilities across commands
├── core/                  # Core framework logic
│   ├── types.ts           # Zod schemas for templates, tests, evaluations
│   ├── errors.ts          # Result type and error handling utilities
│   ├── compiler.ts        # Template compilation and variable substitution
│   ├── evaluator.ts       # LLM-based image evaluation (Claude)
│   ├── statistics.ts      # A/B testing statistics (Welch's t-test)
│   ├── orchestrator.ts    # Pipeline coordinator
│   └── source-image.ts    # Image-to-image source handling
├── templates/             # Template definitions
│   ├── registry.ts        # In-memory template registry
│   ├── ecommerce-base.ts  # E-commerce product template
│   └── lifestyle-product.ts # Lifestyle photography template
├── db/                    # Database operations
│   └── templates.ts       # Template CRUD operations
├── __tests__/             # Unit tests
├── fixtures/              # Test data (batch files, images)
└── index.ts               # Barrel exports

scripts/                    # Ad-hoc utility scripts
reports/                    # Generated HTML reports (gitignored)
\`\`\`
```

### 7.2 Update Code Conventions Section

Add the new path alias:

```markdown
## Code Conventions

- Functional programming style - avoid classes except when required by frameworks
- All lib modules export via index.ts barrel files
- API routes use Zod for request validation
- Database queries in `src/lib/db/` with typed helpers
- Result type (`ok`/`err`) for operations that can fail in `prompt-bench/core/`
- Path alias: `@/*` maps to `./src/*`
- Path alias: `@bench/*` maps to `./prompt-bench/*`
```

### 7.3 Update Prompt Testing Framework Section

Update the description to reference the new location:

```markdown
### Prompt Testing Framework

A CLI-driven system for iterating on prompt templates, located in `prompt-bench/`:

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

Batch file location: `prompt-bench/fixtures/` or custom path
```

### 7.4 Update Commands Section

Update the Prompt Testing CLI section:

```markdown
### Prompt Testing CLI

\`\`\`bash
# Core workflow
bun bench run --template <slug> --batch <file> [--label <name>] [--dry-run]
bun bench evaluate --label <batch-label>
bun bench compare --baseline <label> --candidate <label>
bun bench report --label <batch-label> [--baseline <label>] [--insights]
bun bench sync    # Sync templates to database

# Additional commands
bun bench test --template <slug> --batch <file>  # Full pipeline (sync→run→evaluate→report)
bun bench progress --label <batch-label>         # Check batch progress
\`\`\`

Batch files: `prompt-bench/fixtures/*.json` or provide custom path
```

## Verification

After updating documentation:
```bash
# Read the updated file to verify formatting
cat CLAUDE.md | head -100
```

## Dependencies
- Phase 6 (Cleanup) must be complete

## Next Phase
Phase 8: Verification
