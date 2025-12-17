# CLAUDE.md

ProductPix: AI product photo generator (Next.js 16, Supabase, R2, Gemini)

## Commands

```bash
# Prompt Bench CLI (custom commands)
bun bench test --template <slug> --batch <file>    # Full pipeline
bun bench run --template <slug> --batch <file>     # Generate only
bun bench evaluate --label <batch-label>           # Score images
bun bench compare --baseline <l1> --candidate <l2> # A/B test
bun bench report --label <batch-label>             # HTML report
bun bench open-last-report                         # Open latest
bun bench sync                                     # Sync templates → DB
bun bench improve                                  # AI template improvement

# Supabase
npx supabase db push | gen types ts | migration new
```

## Architecture

**Tailwind v4**: CSS-first config via `@import "tailwindcss"` in globals.css (no tailwind.config.js)

**Dual TypeScript configs**:
- `tsconfig.json`: CLI + tests (includes prompt-bench/)
- `tsconfig.build.json`: Next.js build (excludes prompt-bench/)
- Next.js uses `typescript.tsconfigPath: './tsconfig.build.json'`

**Directory structure:**
```
src/lib/
  ai/           # Gemini (rawPrompt + image-to-image)
  db/           # Queries (jobs, credits, generated_images)
  supabase/     # client (browser), server (SSR), admin (bypass RLS)
  r2/           # Presigned URLs, browser uploads
  auth/         # Hooks, utils
  rate-limit/   # Request throttling
  pricing/      # Multi-provider cost calc

prompt-bench/   # Isolated CLI framework
  core/         # Result<T>, compiler, evaluator
  commands/     # run, evaluate, compare, report, test, sync, improve
  templates/    # registry + definitions
```

**Key RPC**: `create_generation_job`, `add_credits`, `consume_credits`, `refund_credits`

**Email Service:**
- Provider: Resend (SMTP for auth, SDK for contact form)
- Local dev: Inbucket (http://localhost:54324)
- Production: Configured via env vars (`RESEND_API_KEY`, `EMAIL_ENABLED`)
- Contact emails: Admin notification + user acknowledgment
- Error handling: Failures logged but don't block submissions

## Code Conventions

- **Package manager**: `bun` only (NOT npm/yarn/pnpm)
- **Path aliases**: `@/*` → `./src/*`, `@bench/*` → `./prompt-bench/*`
- **Error handling**: Result type (`ok`/`err`) in prompt-bench, try/catch in app
- **Barrel exports**: All lib modules via index.ts
- **TypeScript**: Never `any`/unguarded `unknown`/`!`, explicit return types on exports
  - Enforced: `@typescript-eslint/explicit-function-return-type` on lib/API code only
  - Rationale: Module boundaries need contracts, internal implementation relies on inference
  - Exempted: React components (.tsx), event handlers, inline callbacks
- **Functions**: ≤20 lines, ≤3 nesting
- **Pricing**: `prompt-bench.toml` at root (committed)
  - Model matching: exact → prefix → error (never guess provider)

## Environment Variables

**Client code (marked with `'use client'`):**
- Use `process.env.NEXT_PUBLIC_*` directly (Next.js inlines these at build time)
- TypeScript autocomplete provided by `src/types/env.d.ts`
- Example: `const url = process.env.NEXT_PUBLIC_SUPABASE_URL`

**Server code (API routes, lib modules):**
- Import `env` from `@/lib/env` for validated, typed access
- Example: `import { env } from '@/lib/env'; const key = env.GOOGLE_GENERATIVE_AI_API_KEY`
- Zod validation ensures all required vars are present at runtime

**Rule**: Never import `@/lib/env` in client code - it triggers server-only validation in the browser.

## Logging & Error Handling

**Server-side (API routes, lib code):**
- Always use `logger` from `@/lib/logging`
- Never use console methods in production code

**Client-side:**
- **Application errors (ProductPixError):** Use `captureError` from `@/lib/observability`
  - Logs to console with `[ProductPix Error]` prefix
  - Sends error_occurred event to PostHog
  - Use for user-facing errors, business logic failures
- **Infrastructure warnings (analytics, telemetry):** Use `logger.warn/error`
  - Centralized, structured logging
  - Use for non-user-facing warnings (tracking failures, config issues)
- **React component errors:** Use `console.error` only for uncaught errors in error boundaries
  - Prefer captureError for handled errors

**Never:**
- Bare `console.log` without context in production code
- Scattered console statements for debugging (remove before commit)

## Testing

- **Framework**: Pure Bun test (NO Jest, NO @testing-library/jest-dom)
- **Keep**: @testing-library/react (render utils only)
- **Matchers**: Native Bun only (no custom matchers)
  - Element: `expect(el).not.toBeNull()`
  - Attributes: `expect(el?.getAttribute('x')).toBe('y')`
  - Classes: `expect(el?.classList.contains('x')).toBe(true)`
  - Text: `expect(el?.textContent).toContain('x')`
- **Structure**:
  - Imports: `describe`, `it`, `expect`, `beforeEach`, `mock` from `'bun:test'`
  - Setup: `beforeEach` (avoid `beforeAll`)
  - Mocking: `mock()` for functions, `mock.module()` for modules
- **Coverage**: 70-80% target
- **Location**: `src/**/__tests__/**/*.test.ts`

## UI/UX Patterns

See `docs/design-principles.md` (philosophy) and `docs/design-system.md` (implementation)

**Brand**: Clean, minimal, inviting, playful — NOT dev-tool/crypto aesthetic
**Colors**: Green (primary CTA), Teal (secondary/info)
**Typography**: Space Grotesk (display), Inter (body), mono (meta only)
**Heuristic**: If it looks like terminal/dashboard → wrong

## Analytics & Tracking

**Client-side:**
```typescript
import { trackEvent } from '@/lib/analytics';

trackEvent({
  event: 'generation_started',
  properties: { template_slug, aspect_ratio }
});
```

**Server-side (webhooks):**
```typescript
import { trackServerEvent } from '@/lib/analytics/server';

// Non-blocking queue
trackServerEvent(userId, {
  event: 'credits_purchased',
  properties: { pack_id, credits }
});
```

See `docs/analytics-guide.md` for full documentation.

**Environment variables:**
- NEXT_PUBLIC_POSTHOG_KEY
- NEXT_PUBLIC_POSTHOG_HOST
- POSTHOG_API_KEY

**Privacy-first principles:** masking, identified users only, snake_case properties.

**Environment variables:**
- `NEXT_PUBLIC_*`: Client-side accessible variables
- Server-only variables: No prefix, available only in server contexts
- PostHog: `NEXT_PUBLIC_POSTHOG_KEY` (client), `POSTHOG_API_KEY` (server), `POSTHOG_PROJECT_ID`, `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_HOST`, `OBSERVABILITY_ENABLED`
- Feature flags: `*_ENABLED` boolean variables control optional features

## Legal & Policy

See `docs/legal-policy-decisions.md`

**Key**: US-only, 18+, lifetime credits, self-service refunds, user owns images, opt-in cookies

## Gotchas

- **R2 uploads**: Browser → presigned URL → R2 → confirm (NOT through server)
- **Source images**: Resolved relative to batch file, hash-deduplicated in R2
- **Idempotency**: Tests use hash keys to prevent duplicate evaluations
- **Environment**: Load `.env` BEFORE `.env.local` (`prompt-bench/cli.ts:17-18`)
- **R2 evaluation**: Fetch from R2 URLs (not local files)
- **Supabase RLS**: Use `admin` client for server-side operations bypassing RLS

## Prompt Bench

Self-contained framework for iterative prompt engineering.

**Config**: `prompt-bench.toml` at root (defaults for template/batch/evaluation-model/report settings)

**Workflow**:
1. `bun bench sync` (templates → DB)
2. `bun bench test` (run → evaluate → report)
3. `bun bench open-last-report`
4. `bun bench compare --baseline <l1> --candidate <l2>` (A/B test)

**Adding templates**:
1. Create `prompt-bench/templates/<name>.ts`
2. Export from `prompt-bench/templates/index.ts`
3. Register in `prompt-bench/templates/registry.ts`
4. `bun bench sync`

## R2 CORS

R2 bucket requires CORS for browser uploads.

**Apply**: `npx wrangler r2 bucket cors put productpix-images --rules ./r2-cors.json`

**Common issues**:
- OPTIONS succeeds, PUT fails → bucket permissions (not CORS)
- Must include `x-amz-*` in AllowedHeaders for presigned URLs
- Never `"*"` for AllowedOrigins in production

Full setup: `docs/r2-cors-setup.md`
