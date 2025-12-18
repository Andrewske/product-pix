import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { ok, err, type Result, createError } from '@bench/core/errors';
import { fetchAnalysisPrompt } from '@bench/db/analysis-prompts';
import { getAnalysisCache, setAnalysisCache, generateCacheKey } from './analysis-cache';

/**
 * Convert JSON schema to Zod schema dynamically
 */
function jsonSchemaToZod(jsonSchema: Record<string, any>): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [key, config] of Object.entries(jsonSchema)) {
    let zodType: z.ZodTypeAny;

    // Build base type
    switch (config.type) {
      case 'string':
        zodType = z.string();
        break;
      case 'boolean':
        zodType = z.boolean();
        break;
      case 'number':
        zodType = z.number();
        break;
      case 'array':
        const itemType = config.items === 'string' ? z.string() : z.any();
        zodType = z.array(itemType);
        break;
      default:
        zodType = z.string();
    }

    // Add description
    if (config.description) {
      zodType = zodType.describe(config.description);
    }

    // Make optional
    if (config.optional) {
      zodType = zodType.optional();
    }

    shape[key] = zodType;
  }

  return z.object(shape);
}
import { mergeAnalysisResults } from './consensus';
import type { ProductAnalysis, MergedAnalysis } from '@/types/analysis';

export interface AnalysisOptions {
  model?: string;
  promptSlug?: string;
  cacheEnabled?: boolean;
  customPrompt?: string;
  customSchema?: Record<string, any>;
}

export interface AnalysisResult {
  merged: Record<string, unknown>;
  individual: ProductAnalysis[];
  usage?: { input: number; output: number };
  raw?: unknown;
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
    cacheEnabled = true,
    customPrompt,
    customSchema
  } = options;

  // 1. Get analysis prompt - use custom if provided, otherwise fetch from DB
  let promptText: string;
  if (customPrompt) {
    promptText = customPrompt;
  } else {
    const promptResult = await fetchAnalysisPrompt(promptSlug);
    if (!promptResult.ok) {
      return err(createError(
        'ANALYSIS_ERROR',
        `Failed to fetch analysis prompt: ${promptResult.error.message}`
      ));
    }
    promptText = promptResult.data.promptText;
  }

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
    analyzeSingleImage(image, promptText, model, customSchema)
  );

  const analysisResults = await Promise.all(analysisPromises);

  // Check for errors (fail fast)
  for (const result of analysisResults) {
    if (!result.ok) {
      return err(result.error);
    }
  }

  const successfulResults = analysisResults.map(r => (r.data as { analysis: ProductAnalysis; usage?: { input: number; output: number }; raw?: unknown }).analysis);

  // Collect usage information
  const usage = analysisResults.reduce((acc, result) => {
    const data = result.data as { analysis: ProductAnalysis; usage?: { input: number; output: number }; raw?: unknown };
    if (data.usage) {
      acc.input += data.usage.input;
      acc.output += data.usage.output;
    }
    return acc;
  }, { input: 0, output: 0 });

  // Collect raw responses
  const raw = analysisResults.map(r => (r.data as { analysis: ProductAnalysis; usage?: { input: number; output: number }; raw?: unknown }).raw);

  // 5. Merge results with consensus
  const merged = mergeAnalysisResults(successfulResults);

  // 6. Store in cache if enabled (skip for custom prompts to avoid cache pollution)
  if (cacheEnabled && !customPrompt) {
    const promptResult = await fetchAnalysisPrompt(promptSlug);
    if (promptResult.ok) {
      const prompt = promptResult.data;
      await setAnalysisCache(
        batchHash,
        prompt.slug,
        prompt.version,
        merged,
        successfulResults
      );
    }
  }

  return ok({
    merged,
    individual: successfulResults,
    usage: usage.input > 0 || usage.output > 0 ? usage : undefined,
    raw
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
  model: string,
  customSchema?: Record<string, any>
): Promise<Result<{ analysis: ProductAnalysis; usage?: { input: number; output: number }; raw?: unknown }>> {
  try {
    // Use custom schema if provided, otherwise default
    const schema = customSchema
      ? jsonSchemaToZod(customSchema)
      : z.object({
          product: z.string().describe('The main product name/type'),
          color: z.string().describe('Primary color and finish'),
          material: z.string().describe('Primary material composition'),
          shape: z.string().describe('Overall shape and form'),
          features: z.array(z.string()).describe('Key distinguishing features'),
          hasScaleReference: z.boolean().describe('True if human hand/body part or common object visible for scale comparison'),
          scaleDescription: z.string().optional().describe('Natural language description of scale if reference visible (e.g., "fits in palm", "hand-holdable size", "about 12 inches wide")'),
          brand: z.string().optional().describe('Brand name if visible on logos, tags, or plaques'),
          brandingDetails: z.string().optional().describe('Description of branding elements (logo placement, plaque text, tag details)')
        });

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
      schema
    });

    const usage = result.usage ? {
      input: result.usage.inputTokens || 0,
      output: result.usage.outputTokens || 0
    } : undefined;

    return ok({
      analysis: result.object,
      usage,
      raw: result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown analysis error';
    return err(createError(
      'ANALYSIS_ERROR',
      `Failed to analyze product image: ${message}`
    ));
  }
}
