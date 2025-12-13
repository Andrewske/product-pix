# AI Learnings

> Critical insights and gotchas for ProductPix. Last cleaned: 2025-12-12

## Architecture Decisions

**Dual TypeScript configs for monorepo exclusion**: `tsconfig.json` includes `prompt-bench/`, `tsconfig.build.json` excludes it. Next.js uses `typescript.tsconfigPath: './tsconfig.build.json'`. Enables tightly-coupled dev tooling in monorepo without production bundle bloat. **Note**: `include` arrays override `exclude` — must replace entire array, not just append

**Stripe as price source**: Fetches live prices from Stripe API (not hardcoded). Credit economy (credits per resolution, packs, subscriptions) in TypeScript config. Merged via `getPricing()` server action with `unstable_cache` (1hr TTL). Eliminates price sync bugs

**Vision-first generation**: No user prompts. Gemini Flash analyzes source image → extracts structured product data (Zod schema enforced) → compiles template from DB with variables. Falls back to filename-based titles + empty template fields if analysis fails. Tracks two costs: vision analysis + generation

**Result type pattern**: `prompt-bench/` uses `Result<T>` with `ok()`/`err()` (railway-oriented programming). App code uses try/catch. Never mix patterns within same module

**Provider abstraction**: AI providers wrapped to enable swapping without touching business logic. Critical for regional restrictions (Gemini image gen unavailable in UK/EU/ME/Africa) and preview model deprecation

## Gotchas & Pitfalls

**R2 CORS silent failure**: Uploads fail silently without CORS config. If preflight (OPTIONS) succeeds but PUT fails → bucket permissions issue (NOT CORS). Must include `x-amz-*` in AllowedHeaders, `ETag` in ExposeHeaders

**Tailwind v4 color variable mapping**: CSS custom properties MUST be mapped in `@theme` block or classes won't resolve. Example: `@theme { --color-primary: var(--electric-coral); }`. Missing mapping → unstyled black/white appearance

**Gemini Zod limitations**: `z.union` and `z.record` don't work with structured outputs → use `structuredOutputs: false`

**Gemini thinking config**: Use `thinkingLevel` ('low'|'high') for Gemini 3 models, `thinkingBudget` (number) for Gemini 2.5 models. Different APIs for different model families

**Gemma system prompts**: Gemma models don't support `systemInstruction` — provider auto-prepends to first user message

**Environment load order**: `prompt-bench/cli.ts:17-18` loads `.env` BEFORE `.env.local`. Reverse order breaks config precedence

**Stripe customer creation timing**: Always create customer BEFORE checkout session (not after payment). Critical for webhook processing and userId mapping. Webhooks arrive before redirect completes

**Database-level atomicity**: Use `INSERT ... ON CONFLICT DO NOTHING` with unique constraints for race-safe operations (credit granting, job creation). Application retry logic insufficient

**Title uniqueness**: DB enforces unique `(user_id, title)` pairs. Auto-retry appends `-2`, `-3`, etc. up to 10 attempts. Prevents silent overwrites

**Supabase JSONB merge**: No native merge operation. Must fetch existing → spread merge → update: `merged as Json`

**Module init timing with unstable_cache**: Define constants inside functions when using `unstable_cache` to avoid circular dependencies

**Bun test custom matchers**: Custom matchers conflict with native TypeScript types. Use native Bun matchers only: `expect(el?.getAttribute('x')).toBe('y')` not `toHaveAttribute()`

**useSearchParams hydration**: Wrap client components using `useSearchParams` in `<Suspense>` boundary to prevent hydration mismatches

**OAuth provider detection**: Check `user.app_metadata?.provider` or `user.identities?.[0]?.provider` for differentiating Google OAuth vs email/password (affects password management UI)

**Payment metadata placement**: Credit packs → `payment_intent_data.metadata`. Subscriptions → `subscription_data.metadata`. Different paths for different payment types

**Result type data access**: Use `.data` property (not `.value`) for successful Result values

**Database to app mapping**: Supabase uses `snake_case`, app uses `camelCase`. Create `dbToApp()`/`appToDb()` helpers for transformations

**'use server' directive**: Must be first line. Requires moving utility functions to separate files (server actions export only async functions)

**Touch event validation**: Guard with array length check before `touches[0]` access. Prevents crashes during rapid interactions

**Footer navigation on same page**: Use anchor scroll (`href="#pricing"`) when section exists on current page. Avoids unnecessary stub pages

## AI Image Generation Patterns

**Optimal prompt length**: 10-15 words for product photography. Exceeding causes deprioritization of later elements

**Avoid "photorealistic"**: Produces artificial appearance. Use "studio lighting, product photography" instead

**Reference cameras for authenticity**: "shot on Hasselblad, 85mm lens" triggers realistic outputs

**Negative prompts**: Keep minimal; overloading degrades quality

**Syntax**: Commas to separate descriptors. No politeness phrases ("Please generate...")

**Platform requirements**:
- Amazon main: RGB 255,255,255 white, 85%+ frame fill, 1000px min (2000px for zoom)
- eBay: 1600×1600 for zoom, prefer 1:1 aspect
- Text in images: 25 char limit, max 2-3 phrases (rendering imperfect)

## Template Improvement System

**Dimension-level feedback crucial**: Overall scores mask issues. Need breakdown (composition, lighting, visibility) for targeted improvements

**Iteration history prevents regression**: Without tracking, AI retries failed approaches. Store previous attempts with reasoning

**Statistical significance**: 5+ evaluations minimum for reliable analysis. Smaller batches → random variation dominates signal

**Evaluator reasoning goldmine**: "Why" behind scores contains actionable insights numbers miss

**Structured analysis**: Breaking into "Dimension Analysis" and "Per-Product Feedback" sections → more focused improvements

## Integration Notes

**Gemini 3 image migration**: When standardizing models, update env defaults + pricing config + docs + cost reporting together. Drift between these causes silent billing errors

**Stripe webhook processing**: Return 200 immediately, process with `waitUntil` or background. Prevents timeouts on slow operations

**Server action migration**: Eliminates HTTP fetch to internal API routes. Direct Stripe SDK calls via `stripe.checkout.sessions.create()` reduces network overhead

**Server component data**: Fetch once in server component, pass as props. Avoids duplicate client fetches

## Performance Considerations

**Welch's t-test for A/B**: Need 30+ samples for significance. <10 samples insufficient, 10-30 may not achieve p<0.05 threshold

**Next.js image optimization**: Add `priority` prop to hero images for LCP optimization. Zero-cost improvement for Largest Contentful Paint

**Redis caching strategy**: Long TTL (24h) for customer IDs, short TTL (5min) for subscription state. Balances freshness with API quota

## Testing Patterns

**Bun migration strategy**: Simple → complex (5-batch approach). Validates coverage preservation incrementally

**@testing-library/react**: Keep render utilities (`render()`, `screen`, queries). Framework-agnostic, work with Bun. Remove only jest-dom custom matchers

**No helper functions initially**: Start with direct matchers. Add helpers only if verbose after full migration

**Type safety in mocks**: Use `mock.fn<T>()` with proper generics. Avoid `as any` casts

**TDD workflow**: Failing tests first → minimal code → refactor. 9+ tests per component (variants, props, interactions, edge cases)

**Coverage target**: 100% for utility functions with comprehensive edge cases. 70-80% for components

## Component Patterns

**CVA for variants**: Use `cva()` not manual class concatenation. Base classes for shared styles, variants for differences: `cva('rounded border px-4 py-3', { variants: { variant: { error: 'bg-destructive/10...' } } })`

**Compound components**: Parent provides structure (AuthLayout), children provide content. Optional slots (footer, error, spotlight) for flexibility

**Data-driven templates**: Extract static content to structured data, render with templates. Enables content changes without code changes

**FormField composition**: Label + Input + Error wrapper with `space-y-2`. Consistent error handling with destructive text + ARIA

**Status badges**: CVA-based component with enum status values. Prevents typos, ensures consistent handling

## Code Quality Patterns

**Auth middleware**: Higher-order `withAuth()` wraps route handlers, guarantees authenticated user. Next.js 15 patterns with generic typing

**Centralized logging**: `logger.info('msg', { context })` not console methods. Structured JSON with levels. Supports future aggregation (Datadog, CloudWatch)

**Helper extraction**: ≤20 lines, ≤3 nesting, within same file (not separate modules). Extract for DRY, maintain cohesion

**Credit pricing utilities**: Single source of truth with typed accessors. `getCreditsForResolution()` and `calculateBatchCredits()` functions

**Barrel exports**: Export from index.ts for clean imports. `export * from './module'` pattern

**Type safety in refactoring**: Maintain explicit return types, avoid `any`/`unknown`/`!` during consolidation

**Function length**: Main functions <80 lines by extracting helpers. Preserve cohesion within file

**Error message specificity**: Separate handling for failure modes (auth errors vs user not found). Actionable debugging info

**Logging context**: Pass relevant data as second param: `logger.error('message', { error, jobId, userId })`

## Atomic Operations

**Credit operations**: Use DB functions with `FOR UPDATE` locks to prevent race conditions

**Idempotency keys**: Format as `pi_${paymentIntentId}` for globally unique transactions. Prevent duplicates on re-runs

**Single sync pattern**: One `syncStripeDataToKV()` called from webhook + success route. Prevents split-brain state

## Legal & Compliance

**Conditional script loading**: Facebook Pixel/analytics must check `preferences.cookies.marketing === true` before loading. Use Next.js Script with conditional rendering

**Cascading anonymization**: Hash PII in users, strip PII from descriptions (keep amounts) in transactions, delete R2 files + DB records

**30-day restore window**: Soft delete → manual restore → final anonymization. Consider day 28 warning email

**Audit logging**: Track all anonymization actions. Metrics: success, failures, records affected
