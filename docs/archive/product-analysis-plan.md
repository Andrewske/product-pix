# Product Analysis Pre-Generation Implementation Plan

## Overview

Add a pre-analysis step to image-to-image generation that uses a vision model to extract product information from the source image, then uses that data to compile a prompt template (fetched from DB) before sending to Gemini for generation. Also generates image titles from the analysis.

**Key change**: User prompts are intentionally removed. The system automatically generates optimal prompts from image analysis + templates.

## Architecture Decisions

- **Vision model**: Gemini Flash via AI SDK (configurable via `ANALYSIS_MODEL` env var for testing alternatives)
- **Template approach**: Fetch template from `prompt_templates` table by ID; jobs store `template_id` for future user selection
- **Error handling**: Graceful degradation - analysis failure uses template with empty product fields (Gemini infers from image)
- **Fallback title**: Original source filename when analysis fails
- **Storage**: Analysis stored in `jobs.parameters` JSONB, title in new `generated_images.title` column
- **Title uniqueness**: DB unique constraint on `(user_id, title)` with retry on conflict (append `-2`, `-3`, etc.)

## Flow Change

```
Current: Source Image → User Prompt → Gemini → Generated Image
New:     Source Image → Vision Analysis → Fetch Template → Compile Prompt → Gemini → Image (with title)
```

> **Note**: User prompts are no longer used. Prompts are fully generated from analysis + templates.

## Implementation Tasks

### Phase 1: Environment Configuration

- [ ] Add analysis model configuration to environment schema
  - Files: `src/lib/env.ts` (modify)
  - Add: `ANALYSIS_MODEL` (optional, defaults to `gemini-2.0-flash`)
  - Acceptance: Env var configures which model is used for vision analysis

> **Note**: No new SDK dependencies required - uses existing `@ai-sdk/google`

### Phase 2: Database Schema

- [ ] Create migration for image title column with unique constraint
  - Files: `supabase/migrations/00020_add_image_title.sql` (new)
  - SQL:
    ```sql
    ALTER TABLE public.generated_images ADD COLUMN title TEXT;
    CREATE UNIQUE INDEX idx_generated_images_user_title ON public.generated_images(user_id, title);
    ```
  - Command: `npx supabase db push`
  - Acceptance: Column exists, unique constraint enforced

- [ ] Regenerate Supabase TypeScript types
  - Command: `npx supabase gen types ts --local > src/lib/supabase/database.types.ts`
  - Acceptance: `generated_images` type includes `title` field

### Phase 3: Core Analysis Module

- [ ] Create ProductAnalysis types
  - Files: `src/lib/ai/product-analyzer.ts` (new)
  - Types:
    ```typescript
    interface ProductAnalysis {
      product: string;
      color: string;
      material: string;
      shape: string;
      features: string[];
    }
    ```
  - Acceptance: Types exported, Zod schema for structured output

- [ ] Implement analyzeProductImage function
  - Files: `src/lib/ai/product-analyzer.ts` (new)
  - Dependencies: `@ai-sdk/google`, `ai` (generateObject)
  - Model: Configurable via `ANALYSIS_MODEL` env var (default: `gemini-2.0-flash`)
  - Tests: `src/lib/ai/__tests__/product-analyzer.test.ts`
  - Function signature:
    ```typescript
    analyzeProductImage(
      image: Buffer,
      mimeType: string
    ): Promise<Result<{ analysis: ProductAnalysis; usage: TokenUsage }>>
    ```
  - Acceptance:
    - Returns structured ProductAnalysis from image
    - Returns token usage for cost tracking
    - Handles API errors gracefully (returns Result.err)

### Phase 4: Prompt Builder

- [ ] Create prompt builder that fetches template from DB
  - Files: `src/lib/ai/prompt-builder.ts` (new)
  - Tests: `src/lib/ai/__tests__/prompt-builder.test.ts`
  - Functions:
    ```typescript
    buildPromptFromTemplate(
      templateId: string,
      analysis: ProductAnalysis | undefined
    ): Promise<Result<string>>
    ```
  - Behavior:
    - Fetches template from `prompt_templates` table by ID
    - Compiles template with analysis data as variables
    - If `analysis` is undefined, uses empty strings for product fields (Gemini infers from image)
  - Default template: `ecommerce-base` (infrastructure ready for user selection later)
  - Acceptance:
    - Fetches template from DB
    - Compiles with analysis data or empty fallback
    - Returns Result.err if template not found

### Phase 5: Title Generator

- [ ] Create title generation utilities
  - Files: `src/lib/ai/title-generator.ts` (new)
  - Tests: `src/lib/ai/__tests__/title-generator.test.ts`
  - Functions:
    ```typescript
    generateImageTitle(analysis: ProductAnalysis): string
    // Returns: "ceramic-coffee-mug-matte-black-ceramic"

    getTitleFromFilename(filename: string): string
    // Returns: "product-shot-v2" from "product-shot-v2.jpg"
    // Used as fallback when analysis fails
    ```
  - Acceptance:
    - Slugifies product/color/material from analysis
    - Handles empty/missing fields gracefully
    - Provides filename-based fallback for analysis failures

> **Note**: Title uniqueness is enforced by DB constraint. Insert retries with `-2`, `-3` suffix on conflict (handled in Phase 6).

### Phase 6: Database Functions

- [ ] Add title support to generated images with retry on conflict
  - Files: `src/lib/db/generated-images.ts` (modify)
  - Changes:
    - Add `title?: string` to `CreateGeneratedImageParams`
    - Implement retry logic: on unique constraint violation, append `-2`, `-3`, etc. (max 10 retries)
  - Tests: Update existing tests, add conflict retry test
  - Acceptance: Title saved to DB, retries on conflict

- [ ] Add updateJobParameters function
  - Files: `src/lib/db/jobs.ts` (modify)
  - Function:
    ```typescript
    updateJobParameters(jobId: string, params: Record<string, unknown>): Promise<void>
    ```
  - Acceptance: Merges into existing JSONB without overwriting

- [ ] Add template_id support to jobs (for future user template selection)
  - Files: `src/lib/db/jobs.ts` (modify)
  - Changes: Add optional `template_id` field to job creation
  - Default: `ecommerce-base`
  - Acceptance: Jobs can store which template was used

### Phase 7: Integration

- [ ] Integrate analysis into generate-image flow
  - Files: `src/lib/ai/generate-image.ts` (modify)
  - Changes:
    - Import analyzer, prompt builder, title generator
    - Add analysis step after `updateJobStatus()`, before Gemini call
    - Pass title to `createGeneratedImage()`
    - Record analysis cost with `createGenerationCost()`
  - Logic:
    ```typescript
    const templateId = job.template_id ?? 'ecommerce-base';
    let analysis: ProductAnalysis | undefined;
    let imageTitle: string;

    if (sourceImage && sourceMimeType) {
      const result = await analyzeProductImage(sourceImage, sourceMimeType);
      if (result.ok) {
        analysis = result.data.analysis;
        await updateJobParameters(jobId, { analysis });
        imageTitle = generateImageTitle(analysis);
        // Record analysis cost
      } else {
        // Fallback: use original filename as title
        imageTitle = getTitleFromFilename(sourceFilename);
      }
    }

    // Build prompt from template (works with or without analysis)
    const promptResult = await buildPromptFromTemplate(templateId, analysis);
    if (!promptResult.ok) {
      // Handle template fetch failure
    }
    const compiledPrompt = promptResult.data;

    // Continue with Gemini generation...
    // Title uniqueness handled by DB insert with retry
    ```
  - Acceptance:
    - Analysis runs for image-to-image only
    - Analysis failure uses template with empty fields + filename title
    - Both costs recorded (analysis + generation)
    - Title saved with image (with retry on conflict)

- [ ] Update AI module barrel export
  - Files: `src/lib/ai/index.ts` (modify)
  - Exports: `analyzeProductImage`, `buildPromptFromTemplate`, `generateImageTitle`, `getTitleFromFilename`, `ProductAnalysis`

## Acceptance Criteria

- [ ] All tests pass (`bun test`)
- [ ] No TypeScript errors (`bun run build`)
- [ ] Coverage ≥75% for new modules
- [ ] Image-to-image generates title from analysis
- [ ] Analysis stored in job parameters
- [ ] Two cost records per image-to-image job (analysis + generation)
- [ ] Graceful fallback when analysis fails (empty template fields + filename title)
- [ ] Title uniqueness enforced by DB constraint with retry
- [ ] Templates fetched from DB (not hardcoded)

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/lib/env.ts` | Modify | Add ANALYSIS_MODEL env var |
| `supabase/migrations/00020_add_image_title.sql` | Create | Add title column with unique constraint |
| `src/lib/supabase/database.types.ts` | Regenerate | Run `npx supabase gen types ts` |
| `src/lib/ai/product-analyzer.ts` | Create | Gemini Flash vision analysis |
| `src/lib/ai/prompt-builder.ts` | Create | Build prompt from DB template |
| `src/lib/ai/title-generator.ts` | Create | Generate titles from analysis/filename |
| `src/lib/ai/__tests__/product-analyzer.test.ts` | Create | Unit tests |
| `src/lib/ai/__tests__/prompt-builder.test.ts` | Create | Unit tests |
| `src/lib/ai/__tests__/title-generator.test.ts` | Create | Unit tests |
| `src/lib/db/generated-images.ts` | Modify | Add title support with retry on conflict |
| `src/lib/db/jobs.ts` | Modify | Add updateJobParameters, template_id support |
| `src/lib/ai/generate-image.ts` | Modify | Integrate analysis step |
| `src/lib/ai/index.ts` | Modify | Export new modules |

## Dependencies

### External
- `@ai-sdk/google` - Already installed (used for Gemini Flash analysis)
- `ai` - Already installed (generateObject for structured output)

### Internal
- `src/lib/pricing` - For cost calculation
- `src/lib/db/cost-queries.ts` - For storing analysis cost
- `src/lib/db/prompt-templates.ts` - For fetching templates
- `src/lib/logging` - For error logging

### Environment
- `ANALYSIS_MODEL` - Optional, defaults to `gemini-2.0-flash`

## Example Input/Output

**Gemini Flash Analysis Output:**
```json
{
  "product": "ceramic coffee mug",
  "color": "matte black",
  "material": "ceramic",
  "shape": "cylindrical with handle",
  "features": ["textured surface", "wide rim"]
}
```

**Generated Prompt** (from `ecommerce-base` template):
```
Professional e-commerce photo of ceramic coffee mug with textured surface and wide rim, matte black ceramic, on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame
```

**Generated Title:** `ceramic-coffee-mug-matte-black-ceramic`

**Fallback (when analysis fails):**
- Prompt: Template compiled with empty product fields (Gemini infers from source image)
- Title: Derived from source filename (e.g., `product-shot-v2`)

## Future Work

- [ ] **Image preprocessing**: Add resize/validation before sending to vision API (defer until API limits encountered)
- [ ] **User template selection**: Allow users to choose template per job (infrastructure ready via `template_id`)
- [ ] **Title UX research**: Consider using source filename patterns for generated image names
