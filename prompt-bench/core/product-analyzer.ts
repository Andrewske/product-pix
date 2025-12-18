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

export interface AnalysisResult {
  merged: MergedAnalysis;
  individual: ProductAnalysis[];
}

/**
 * Analyze multiple product images and merge results using consensus
 *
 * @param images - Array of images with buffers and MIME types
 * @param options - Configuration options
 * @returns Merged analysis result and individual per-image results or error
 */
export async function analyzeProductImages(
  images: Array<{ buffer: Buffer; mimeType: string }>,
  options: AnalysisOptions = {}
): Promise<Result<AnalysisResult>> {
  const {
    model = 'gemini-2.0-flash',
    promptSlug = 'product-analysis',
    cacheEnabled = true
  } = options;

  // 1. Fetch analysis prompt from DB
  const promptResult = await fetchAnalysisPrompt(promptSlug);
  if (!promptResult.ok) {
    return err(createError(
      'ANALYSIS_ERROR',
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
      return ok({
        merged: cachedResult.data.mergedResult,
        individual: cachedResult.data.individualResults
      });
    }
  }

  // 4. Analyze each image in parallel
  const analysisPromises = images.map(image =>
    analyzeSingleImage(image, prompt.promptText, model)
  );

  const analysisResults = await Promise.all(analysisPromises);

  // Check for errors (fail fast)
  for (const result of analysisResults) {
    if (!result.ok) {
      return err(result.error);
    }
  }

  const successfulResults = analysisResults.map(r => r.data as ProductAnalysis);

  // 5. Merge results with consensus
  const merged = mergeAnalysisResults(successfulResults);

  // 6. Store in cache if enabled
  if (cacheEnabled) {
    await setAnalysisCache(
      batchHash,
      prompt.slug,
      prompt.version,
      merged,
      successfulResults
    );
  }

  return ok({
    merged,
    individual: successfulResults
  });
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
        features: z.array(z.string()).describe('Key distinguishing features'),
        hasScaleReference: z.boolean().describe('True if human hand/body part or common object visible for scale comparison'),
        scaleDescription: z.string().optional().describe('Natural language description of scale if reference visible (e.g., "fits in palm", "hand-holdable size", "about 12 inches wide")'),
        brand: z.string().optional().describe('Brand name if visible on logos, tags, or plaques'),
        brandingDetails: z.string().optional().describe('Description of branding elements (logo placement, plaque text, tag details)')
      })
    });

    return ok(result.object);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown analysis error';
    return err(createError(
      'ANALYSIS_ERROR',
      `Failed to analyze product image: ${message}`
    ));
  }
}
