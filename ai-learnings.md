# AI Learnings

Hard-won insights, gotchas, and patterns discovered while building ProductPix.

## AI Image Generation

- **Optimal prompt length**: 10-15 words for product photography. Exceeding this causes AI to deprioritize later elements
- **Avoid "photorealistic"**: Counter-intuitively produces digitized/artificial appearance. Use "studio lighting, product photography" instead
- **Google Gemini prompt structure**: Subject + Context + Style framework produces best results
- **Reference cameras for authenticity**: "shot on Hasselblad, 85mm lens" triggers more realistic outputs
- **Negative prompts**: Keep minimal; overloading degrades overall quality
- **Syntax matters**: Use commas to separate descriptors, avoid politeness phrases ("Please generate...")

## E-commerce Platform Requirements

- **Amazon main images**: Pure white background (RGB 255,255,255), product fills 85%+ of frame, minimum 1000px (2000px recommended for zoom)
- **eBay optimal**: 1600×1600 pixels for zoom, prefer 1:1 aspect ratio
- **Text in AI images**: Limit to 25 characters, max 2-3 distinct phrases — text rendering remains imperfect

## Cloudflare R2

- **CORS must be configured** before presigned URL uploads work — uploads fail silently without proper CORS
- **Preflight requests**: If OPTIONS succeeds but PUT fails, check bucket permissions not CORS
- **AllowedHeaders must include**: `Content-Type`, `Content-Length`, `x-amz-*`
- **ExposeHeaders**: Include `ETag` for upload confirmation

## Error Handling Patterns

- **Result type (`ok`/`err`)**: Used in `src/lib/prompts/` for operations that can fail without exceptions
- **Idempotency keys**: Prevent duplicate operations on script re-runs (used in prompt testing)
- **Atomic credit operations**: Use database functions with `FOR UPDATE` locks to prevent race conditions

## Testing & Statistics

- **Welch's t-test**: Used for A/B prompt comparisons — need 30+ samples for statistical significance
- **Sample size warning**: <10 samples insufficient for any comparison; 10-30 may not achieve significance
- **p < 0.05**: Standard threshold for declaring statistical significance

## Gemini API

- **Regional restrictions**: Image generation NOT available in UK and several EU/ME/Africa countries
- **Provider abstraction**: Always wrap AI providers to enable swapping without touching business logic
- **Preview models**: Can change or be deprecated — design for provider flexibility
- **Gemini 3 image migration**: Standardize on `gemini-3-pro-image-preview`; update env defaults, pricing, docs, and cost reporting together to avoid drift
- **Zod limitations**: `z.union` and `z.record` don't work with Google Generative AI structured outputs — disable with `structuredOutputs: false`
- **Thinking config**: Use `thinkingLevel` ('low'|'high') for Gemini 3 models, `thinkingBudget` (number) for Gemini 2.5 models
- **Gemma system prompts**: Gemma models don't support `systemInstruction` — provider automatically prepends to first user message

## Type System Patterns

- **Database to app mapping**: Supabase uses `snake_case`, app interfaces use `camelCase` — create `dbToApp()`/`appToDb()` helper functions
- **Result type access**: Use `.data` property for successful Result values (not `.value`)

## Template Improvement System

- **Dimension-level feedback crucial**: Overall scores mask specific issues. AI needs breakdown of composition, lighting, product visibility, etc. to make targeted improvements
- **Iteration history prevents regression**: Without previous attempt tracking, AI repeatedly tries failed approaches (e.g., anti-glare fixes that don't help)
- **Statistical significance matters**: Minimum 5 evaluations needed for reliable improvement analysis; smaller batches lead to random variation dominating signal
- **Evaluator reasoning goldmine**: The "why" behind scores contains actionable insights that overall numbers miss
- **Structured prompt sections**: Breaking AI analysis into "Dimension Analysis" and "Per-Product Feedback" sections produces more focused improvements than free-form analysis

## Stripe Payments Integration

- **Customer creation timing**: Always create Stripe customer BEFORE checkout session (not after payment). Critical for webhook processing and userId mapping
- **Single sync function pattern**: Use one `syncStripeDataToKV()` function called from both webhook and success route to prevent split-brain state
- **Payment intent metadata**: For credit packs, put metadata on `payment_intent_data` (not session). For subscriptions, use `subscription_data.metadata`
- **Webhook signature verification**: Always verify signatures to prevent spoofing. Use raw request body
- **Database-level atomicity**: Use `INSERT ... ON CONFLICT DO NOTHING` with unique constraints for race-safe credit granting
- **Idempotency keys**: Format as `pi_${paymentIntentId}` for globally unique credit transactions
- **Credits never expire**: Once granted, credits belong to user permanently. Subscription credits and purchased credits behave identically
- **Customer portal**: Use Stripe's hosted portal instead of custom subscription management UI (production-ready, handles edge cases)
- **Environment variable validation**: Use Zod schemas for all Stripe env vars to catch configuration issues early
- **Webhook async processing**: Return 200 immediately, process events with `waitUntil` or background processing
- **Redis caching strategy**: Long TTL (24h) for customer IDs, short TTL (5min) for subscription state
- **Transaction types**: Extend enum with `pack_purchase`, `subscription_renewal`, `subscription_upgrade` for proper categorization

## Build System Patterns

- **Dual TypeScript configs for monorepo exclusion**: When keeping tightly-coupled dev tooling in monorepo but excluding from production builds, use separate `tsconfig.build.json` that overrides `include` array to exclude dev directories. Next.js respects `typescript.tsconfigPath` config option
- **TypeScript include vs exclude precedence**: `include` arrays take precedence over `exclude` — to exclude a directory, override the entire `include` array rather than just adding to `exclude`
- **Build-time vs runtime separation**: CLI tools can use root tsconfig (with dev dependencies) while production builds use stripped-down config, enabling different compilation rules for same codebase

## Code Review Patterns

- **ButtonLink component**: When Button's asChild prop isn't available, create a dedicated ButtonLink component combining Button styling with Next.js Link for proper navigation
- **Type safety in API responses**: Define explicit union types for API response structures (like GeminiContentPart) instead of using any[] to maintain strict TypeScript compliance
- **Error message specificity**: Separate error handling logic for different failure modes (auth errors vs user not found) to provide more actionable debugging information
- **Import cleanup**: Remove unused imports (like Next.js Link) when replacing raw HTML elements with custom components

## Code Reduction Patterns

- **Auth middleware pattern**: Higher-order function `withAuth()` wraps route handlers, guaranteeing authenticated `user` in handler scope. Follows Next.js 15 patterns with proper generic typing for route params
- **Centralized logging**: Structured JSON logging with configurable log levels. Supports future log aggregation (Datadog, CloudWatch). Use `logger.info('msg', { context })` instead of console methods
- **Credit pricing utilities**: Single source of truth in dedicated module with typed accessors. Resolution-based pricing constants with `getCreditsForResolution()` and `calculateBatchCredits()` functions
- **Dead code removal**: Regularly audit for unimplemented handlers and unused functions. Add TODO comments for future work needed
- **Helper function extraction**: Deduplicate complex logic (like Gemini response parsing) into internal helper functions to reduce ~80 lines while maintaining identical behavior
- **Testing new utilities**: 100% coverage for utility functions with comprehensive edge case testing. Use Jest with ts-jest for TypeScript-first testing
- **Barrel exports**: Export utilities from index.ts files for clean imports. Use `export * from './module'` pattern for re-exports
- **Type safety in refactoring**: Maintain explicit return types and avoid any/unknown/! during code consolidation
- **Incremental migration**: Phase code changes to avoid breaking existing functionality. Test each phase before proceeding

## Hybrid Pricing Architecture

- **Stripe as price source of truth**: Eliminates sync bugs by fetching live prices from Stripe API instead of hardcoded values
- **Config as credit economy source of truth**: TypeScript config file for credits per resolution, free signup credits, pack/subscription definitions
- **Server action pattern**: Single `getPricing()` action merges Stripe prices with credit config, returns complete pricing data
- **Next.js unstable_cache**: 1-hour TTL for Stripe API calls, proper cache tags for invalidation
- **Module initialization timing**: Define constants inside functions when using unstable_cache to avoid circular dependencies
- **Server component data distribution**: Fetch pricing once in server component, pass as props to avoid duplicate client fetches
- **Type-safe pricing data**: Zod-validated config with literal types, explicit interfaces for server action responses

## Server Actions Migration Patterns

- **API Route to Server Action Migration**: Replace `/api/stripe/checkout` with direct server action calls for better type safety, reduced network overhead, and simpler code. Server actions eliminate HTTP fetch calls and provide direct Stripe SDK integration
- **'use server' directive placement**: Must be first line of server action files. Requires moving utility functions to separate files since server actions must export only async functions
- **Direct Stripe SDK calls**: Server actions call `stripe.checkout.sessions.create()` directly instead of HTTP fetch to internal API routes, eliminating unnecessary network round-trips
- **Type consolidation strategy**: Remove duplicate type definitions (CreditPack, SubscriptionTier, etc.) in favor of single source of truth in dedicated type files
- **Consistent price formatting**: Use `Intl.NumberFormat` with USD currency across all pricing components for uniform display
- **Utility function separation**: When adding 'use server' to existing files, extract non-async utility functions to separate `utils.ts` files to maintain clean separation of concerns
- **Barrel export updates**: Update index.ts files to re-export new server action functions for clean imports
- **Component migration order**: Update components to use server actions before deleting API routes to maintain working checkout flows during transition

## Settings Page Implementation Patterns

- **URL-synchronized tabs**: Use `useSearchParams()` + `useRouter()` for deep-linking without full page reloads. Default tab in component, `router.push('/settings?tab=${value}', { scroll: false })` for navigation
- **OAuth provider detection**: Check `user.app_metadata?.provider` or `user.identities?.[0]?.provider` to differentiate Google OAuth vs email/password users for password management UI
- **Server actions for user data**: Use server Supabase client (`createClient()`) with RLS for fetching user's own transactions. Returns empty array if unauthenticated (automatic RLS filtering)
- **Credit transaction formatting**: Color-coded badges (green for positive, muted for negative), formatted dates with `toLocaleString()`, balance tracking per transaction
- **Password reset flow**: OAuth users get inline "Set Password" form, email users get "Send Reset Email" button. Separate `/auth/reset-password` page for email link handling
- **Suspense for useSearchParams**: Wrap client components using `useSearchParams` in `<Suspense>` boundary in server components to prevent hydration mismatches
- **Radix UI shadcn integration**: Follow button.tsx pattern with `forwardRef`, `cn()` utility, compound component exports. Import from `@radix-ui/react-*` packages
- **Auth-protected pages**: Use `requireAuth()` utility in server components for automatic redirect to `/login` if unauthenticated

## Product Analysis Pre-Generation Implementation

- **Vision-first prompt generation**: User prompts removed entirely. System automatically analyzes product images using Gemini Flash vision model, extracts structured product data (product, color, material, shape, features), then compiles optimal prompts from database templates
- **Template-driven prompts**: Prompts fetched from `prompt_templates` table by ID, compiled with analysis data as variables. Falls back to empty fields when analysis fails, letting Gemini infer from image alone
- **Structured analysis output**: Zod schema enforces consistent ProductAnalysis interface with required fields. Gemini `generateObject` provides reliable structured extraction from images
- **Cost tracking duality**: Image-to-image jobs now record two separate costs - vision analysis cost and generation cost. Both tracked with `createGenerationCost()` for accurate pricing
- **Title uniqueness with retry**: Database constraint enforces unique `(user_id, title)` pairs. Automatic retry logic appends `-2`, `-3`, etc. up to 10 attempts when conflicts occur
- **Graceful analysis degradation**: When vision analysis fails, system falls back to filename-based titles and template compilation with empty product fields. Gemini still generates from source image alone
- **Job parameters storage**: Analysis results stored in `jobs.parameters` JSONB field for debugging and future analysis. Merges new data without overwriting existing parameters
- **Template ID infrastructure**: Jobs store `template_id` for future user template selection. Currently defaults to `ecommerce-base` but ready for user customization
- **Filename fallback titles**: When analysis fails, titles derived from source filename (removing extension). Provides consistent naming even without vision analysis
- **DB constraint + application retry**: Unique constraints at database level prevent duplicates, application-level retry with suffixes ensures user experience continuity
