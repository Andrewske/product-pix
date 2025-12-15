import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import type { Result } from '@bench/core/errors';
import { ok, err } from '@bench/core/errors';
import type { ProductCategory } from '@bench/core/types';

const CATEGORY_PROMPT = `Classify this product into exactly ONE category:
- apparel (clothing, shirts, pants, dresses, jackets)
- footwear (shoes, boots, sandals, sneakers)
- electronics (phones, laptops, gadgets, cables, accessories)
- furniture (chairs, tables, sofas, storage, decor)
- beauty (cosmetics, skincare, haircare, fragrances)
- food (packaged food, beverages, supplements)
- tools (hand tools, power tools, hardware)
- jewelry (rings, necklaces, watches, earrings)
- generic (anything else)

Respond with ONLY the category name, nothing else.`;

export interface ClassificationError {
  code: 'CLASSIFICATION_FAILED' | 'INVALID_RESPONSE';
  message: string;
}

/**
 * Classify a product image into a category using Gemini vision
 * Uses minimal tokens (~100) for quick classification
 */
export async function classifyProduct(
  imageUrl: string,
  options?: { model?: string }
): Promise<Result<ProductCategory, ClassificationError>> {
  try {
    const model = options?.model || 'gemini-2.0-flash';

    const result = await generateObject({
      model: google(model),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: CATEGORY_PROMPT,
            },
            {
              type: 'image',
              image: imageUrl,
            },
          ],
        },
      ],
      schema: z.object({
        category: z.enum([
          'apparel', 'footwear', 'electronics', 'furniture',
          'beauty', 'food', 'tools', 'jewelry', 'generic'
        ]),
      }),
    });

    return ok(result.object.category);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown classification error';
    return err({
      code: 'CLASSIFICATION_FAILED',
      message: `Product classification failed: ${message}`,
    });
  }
}