import Anthropic from '@anthropic-ai/sdk';
import {
  Result,
  ok,
  err,
  createError,
  PromptTestError,
} from '@bench/core/errors';
import { EvaluationDetails, ScoreSchema } from '@bench/core/types';
import { downloadBuffer } from '@/lib/r2';
import { calculateCost } from '@bench/core/cost';

// =============================================================================
// Constants
// =============================================================================

export const EVALUATION_PROMPT = `You are evaluating an AI-generated product photo for e-commerce use.

Score each criterion from 1-10 (1 = poor, 10 = excellent):

1. **Composition** (1-10): Product placement, visual balance, appropriate fill percentage (product should fill 60-90% of frame)

2. **Lighting** (1-10): Even illumination, no harsh shadows, appropriate highlights, professional studio quality

3. **Product Visibility** (1-10): Sharp focus on product, all features clearly visible, no obscured details

4. **Background Quality** (1-10): Clean, distraction-free background, appropriate for e-commerce

5. **Professional Quality** (1-10): Overall marketplace-ready appearance, color accuracy, no artifacts

6. **Prompt Adherence** (1-10): How well the image matches the original prompt request

Calculate an overall score as the weighted average:
- Composition: 15%
- Lighting: 20%
- Product Visibility: 25%
- Background Quality: 15%
- Professional Quality: 15%
- Prompt Adherence: 10%

Return ONLY valid JSON in this exact format:
{
  "overall": 8.5,
  "composition": 8,
  "lighting": 9,
  "productVisibility": 8,
  "backgroundQuality": 9,
  "professionalQuality": 8,
  "promptAdherence": 9,
  "reasoning": "Brief explanation of scores...",
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}`;

// =============================================================================
// Types
// =============================================================================

export interface EvaluationResult {
  overall: number;
  details: EvaluationDetails;
  tokensUsed: number;
  costUsd: number;
  model: string;
}

export interface EvaluateOptions {
  model?: string;
  maxRetries?: number;
}

// =============================================================================
// Helpers
// =============================================================================

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));



/**
 * Parse and validate the JSON response from Claude
 */
const parseEvaluationResponse = (text: string): Result<EvaluationDetails & { overall: number }> => {
  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr.trim());

    // Validate overall score
    const overallResult = ScoreSchema.safeParse(parsed.overall);
    if (!overallResult.success) {
      return err(createError('EVALUATION_ERROR', 'Invalid overall score in response'));
    }

    // Validate individual scores (optional, just warn if missing)
    const details: EvaluationDetails = {
      composition: parsed.composition,
      lighting: parsed.lighting,
      productVisibility: parsed.productVisibility,
      backgroundQuality: parsed.backgroundQuality,
      professionalQuality: parsed.professionalQuality,
      promptAdherence: parsed.promptAdherence,
      reasoning: parsed.reasoning,
      suggestions: parsed.suggestions,
    };

    return ok({ ...details, overall: parsed.overall });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(createError('EVALUATION_ERROR', `Failed to parse evaluation: ${message}`));
  }
};

// =============================================================================
// Main Evaluator
// =============================================================================

export interface ImageInput {
  type: 'url' | 'key';
  value: string;
}

/**
 * Evaluate a generated image using Claude's vision capabilities
 *
 * @param imageInput - Image URL or R2 key
 * @param originalPrompt - The prompt used to generate the image
 * @param options - Evaluation options
 * @returns Result with evaluation scores or error
 */
export const evaluateImage = async (
  imageInput: ImageInput,
  originalPrompt: string,
  options: EvaluateOptions = {}
): Promise<Result<EvaluationResult>> => {
  const { model = 'claude-sonnet-4-20250514', maxRetries = 3 } = options;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return err(createError('VALIDATION_ERROR', 'ANTHROPIC_API_KEY environment variable is required'));
  }

  // Download image if using R2 key
  let imageBase64: string | undefined;
  let detectedMediaType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif' = 'image/png';

  if (imageInput.type === 'key') {
    try {
      const buffer = await downloadBuffer(imageInput.value);
      imageBase64 = buffer.toString('base64');

      // Detect image format from magic bytes
      if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        detectedMediaType = 'image/jpeg';
      } else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        detectedMediaType = 'image/png';
      } else if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
        detectedMediaType = 'image/webp';
      } else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
        detectedMediaType = 'image/gif';
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return err(createError('EVALUATION_ERROR', `Failed to download image: ${message}`));
    }
  }

  const client = new Anthropic({ apiKey });
  let lastError: PromptTestError = createError('EVALUATION_ERROR', 'Evaluation failed after max retries');

  const imageSource = imageBase64
    ? { type: 'base64' as const, media_type: detectedMediaType, data: imageBase64 }
    : { type: 'url' as const, url: imageInput.value };

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await client.messages.create({
        model,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: imageSource,
              },
              {
                type: 'text',
                text: `${EVALUATION_PROMPT}\n\nOriginal prompt: "${originalPrompt}"`,
              },
            ],
          },
        ],
      });

      // Extract text content
      const textContent = response.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        return err(createError('EVALUATION_ERROR', 'No text response from evaluator'));
      }

      // Parse response
      const parseResult = parseEvaluationResponse(textContent.text);
      if (!parseResult.ok) {
        // Parsing failed, retry
        lastError = parseResult.error;
        if (attempt < maxRetries - 1) {
          await sleep(Math.pow(2, attempt) * 1000);
          continue;
        }
        return parseResult;
      }

      const { overall, ...details } = parseResult.data;
      const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
      const costResult = calculateCost(model, {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      });

      if (!costResult.ok) {
        console.warn(`⚠️  Failed to calculate cost for model ${model}: ${costResult.error.message}`);
        return err(createError(
          'EVALUATION_ERROR',
          `Cost calculation failed: ${costResult.error.message}`,
          { retryable: false }
        ));
      }

      const costData = costResult.data;

      return ok({
        overall,
        details,
        tokensUsed,
        costUsd: costData.total,
        model,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const isRateLimit = message.includes('429') || message.includes('rate');
      const isRetryable = isRateLimit || message.includes('overloaded');

      lastError = createError('EVALUATION_ERROR', message, {
        retryable: isRetryable,
      });

      if (attempt < maxRetries - 1 && isRetryable) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
        await sleep(delay);
        continue;
      }
    }
  }

  return err(lastError);
};

/**
 * Evaluate multiple images in sequence with rate limiting
 */
export const evaluateBatch = async (
  tests: Array<{ id: string; imageKey: string; prompt: string }>,
  options: EvaluateOptions = {},
  onProgress?: (completed: number, total: number) => void
): Promise<Array<{ id: string; result: Result<EvaluationResult> }>> => {
  const results: Array<{ id: string; result: Result<EvaluationResult> }> = [];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    const result = await evaluateImage({ type: 'key', value: test.imageKey }, test.prompt, options);
    results.push({ id: test.id, result });

    if (onProgress) {
      onProgress(i + 1, tests.length);
    }

    // Rate limiting: wait between requests
    if (i < tests.length - 1) {
      await sleep(500);
    }
  }

  return results;
};