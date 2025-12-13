// src/lib/ai/product-analyzer.ts
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { env } from '@/lib/env';
import { logger } from '@/lib/logging';
import { normalizeUsage } from './usage-types';
import { ok, err, type Result } from '@/lib/result';
import type { ProductAnalysis } from './types';

// =============================================================================
// Product Analyzer
// =============================================================================

/**
 * Analyze a product image using Gemini Flash vision model
 * Extracts structured product information for prompt generation
 */
 
export const analyzeProductImage = async (
  image: Buffer,
  _mimeType: string
): Promise<Result<{ analysis: ProductAnalysis; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }>> => {
  try {
    const model = env.ANALYSIS_MODEL || 'gemini-2.0-flash';

    const result = await generateObject({
      model: google(model),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this product image and extract the following information. Be specific and descriptive. If you cannot determine a field, use an empty string.',
            },
            {
              type: 'image',
              image: image,
            },
          ],
        },
      ],
      schema: z.object({
        product: z.string().describe('The main product name/type (e.g., "ceramic coffee mug", "leather wallet", "cotton t-shirt")'),
        color: z.string().describe('Primary color and finish (e.g., "matte black", "navy blue denim", "brushed stainless steel")'),
        material: z.string().describe('Primary material composition (e.g., "ceramic", "genuine leather", "100% cotton")'),
        shape: z.string().describe('Overall shape and form (e.g., "cylindrical with handle", "rectangular with rounded corners")'),
        features: z.array(z.string()).describe('Key distinguishing features (e.g., ["textured surface", "embossed logo", "adjustable strap"])'),
      }),
    });

    const normalizedUsage = normalizeUsage(result.usage);

    return ok({
      analysis: result.object,
      usage: normalizedUsage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error during product analysis';
    logger.error('Product analysis failed', { error: message });

    return err({
      code: 'ANALYSIS_FAILED',
      message: `Failed to analyze product image: ${message}`,
    });
  }
};