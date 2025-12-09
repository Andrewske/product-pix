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
