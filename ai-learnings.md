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
- **Zod limitations**: `z.union` and `z.record` don't work with Google Generative AI structured outputs — disable with `structuredOutputs: false`
- **Thinking config**: Use `thinkingLevel` ('low'|'high') for Gemini 3 models, `thinkingBudget` (number) for Gemini 2.5 models
- **Gemma system prompts**: Gemma models don't support `systemInstruction` — provider automatically prepends to first user message

## Type System Patterns

- **Database to app mapping**: Supabase uses `snake_case`, app interfaces use `camelCase` — create `dbToApp()`/`appToDb()` helper functions
- **Result type access**: Use `.data` property for successful Result values (not `.value`)
