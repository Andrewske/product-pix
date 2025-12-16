# Product Analyzer Implementation

## Files to Create
- `prompt-bench/core/product-analyzer.ts` (new)

## Implementation Details

Main analysis orchestrator that coordinates prompt fetching, caching, multi-image analysis, and consensus merging:

```typescript
// prompt-bench/core/product-analyzer.ts
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { ok, err, type Result, createError } from '@bench/core/errors';
import { fetchAnalysisPrompt } from '@bench/db/analysis-prompts';
import { getAnalysisCache, setAnalysisCache, generateCacheKey } from './analysis-cache';
import { mergeAnalysisResults } from './consensus';
import type { ProductAnalysis, MergedAnalysis } from '@/types/analysis';

export interface AnalysisOptions {
  model?: string;
  promptSlug?: string;
  cacheEnabled?: boolean;
}

/**
 * Analyze multiple product images and merge results using consensus
 *
 * @param images - Array of images with buffers and MIME types
 * @param options - Configuration options
 * @returns Merged analysis result or error
 */
export async function analyzeProductImages(
  images: Array<{ buffer: Buffer; mimeType: string }>,
  options: AnalysisOptions = {}
): Promise<Result<MergedAnalysis>> {
  const {
    model = 'gemini-2.0-flash',
    promptSlug = 'product-analysis',
    cacheEnabled = true
  } = options;

  // 1. Fetch analysis prompt from DB
  const promptResult = await fetchAnalysisPrompt(promptSlug);
  if (!promptResult.ok) {
    return err(createError(
      'ANALYSIS_FAILED',
      `Failed to fetch analysis prompt: ${promptResult.error.message}`
    ));
  }

  const prompt = promptResult.data;

  // 2. Generate batch hash for cache lookup
  const batchHash = generateCacheKey(images);

  // 3. Check cache if enabled
  if (cacheEnabled) {
    const cachedResult = await getAnalysisCache(batchHash);
    if (cachedResult.ok && cachedResult.data) {
      return ok(cachedResult.data.mergedResult);
    }
  }

  // 4. Analyze each image
  const analysisResults: ProductAnalysis[] = [];

  for (const image of images) {
    const result = await analyzeSingleImage(image, prompt.promptText, model);
    if (!result.ok) {
      return err(result.error); // Fail fast
    }
    analysisResults.push(result.data);
  }

  // 5. Merge results with consensus
  const merged = mergeAnalysisResults(analysisResults);

  // 6. Store in cache if enabled
  if (cacheEnabled) {
    await setAnalysisCache(
      batchHash,
      prompt.slug,
      prompt.version,
      merged,
      analysisResults
    );
  }

  return ok(merged);
}

/**
 * Analyze a single product image
 *
 * @param image - Image buffer and MIME type
 * @param promptText - Analysis prompt text
 * @param model - Gemini model name
 * @returns Product analysis result or error
 */
async function analyzeSingleImage(
  image: { buffer: Buffer; mimeType: string },
  promptText: string,
  model: string
): Promise<Result<ProductAnalysis>> {
  try {
    const result = await generateObject({
      model: google(model),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: promptText
            },
            {
              type: 'image',
              image: image.buffer
            }
          ]
        }
      ],
      schema: z.object({
        product: z.string().describe('The main product name/type'),
        color: z.string().describe('Primary color and finish'),
        material: z.string().describe('Primary material composition'),
        shape: z.string().describe('Overall shape and form'),
        features: z.array(z.string()).describe('Key distinguishing features')
      })
    });

    return ok(result.object);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown analysis error';
    return err(createError(
      'ANALYSIS_FAILED',
      `Failed to analyze product image: ${message}`
    ));
  }
}
```

## Acceptance Criteria
- [ ] `analyzeProductImages` fetches prompt from DB
- [ ] Checks cache before analyzing (if enabled)
- [ ] Analyzes all images in parallel for performance
- [ ] Fails fast on first analysis error (no partial results)
- [ ] Merges results using consensus logic
- [ ] Stores results in cache after successful analysis
- [ ] Returns Result<MergedAnalysis> following error handling pattern
- [ ] Supports configurable model, prompt slug, and cache toggle

## Error Handling
All failures should fail fast with detailed errors:
- Prompt fetch failure → propagate error
- Analysis API failure → propagate error with image context
- Cache failures → log but don't block (cache is optimization)

## Dependencies
- Task 03 (prompt sync infrastructure for fetchAnalysisPrompt)
- Task 04 (consensus and cache modules)
