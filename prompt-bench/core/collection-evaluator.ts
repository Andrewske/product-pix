import Anthropic from '@anthropic-ai/sdk';
import {
  Result,
  ok,
  err,
  createError,
  PromptTestError,
} from '@bench/core/errors';
import { ImageInput } from '@bench/core/evaluator';
import { downloadBuffer } from '@/lib/r2';
import { calculateCost } from '@bench/core/cost';

// =============================================================================
// Constants
// =============================================================================

const COLLECTION_EVALUATION_PROMPT = `You are evaluating a collection of AI-generated product photos for e-commerce use.

Analyze the entire collection as a cohesive set, not individual images. Score each criterion from 1-10 (1 = poor, 10 = excellent):

1. **Consistency** (1-10): How well do the images maintain visual consistency across the collection? Consider lighting, style, composition, color grading, and overall aesthetic coherence.

2. **Variety** (1-10): How much useful variety does the collection provide? Consider different angles, perspectives, product interactions, and contextual scenarios that would help customers make informed purchase decisions.

3. **Physical Plausibility** (1-10): How realistic and physically believable are the product depictions across the collection? Consider material properties, lighting physics, shadows, reflections, and how the product would behave in real-world scenarios.

Calculate an overall score as the weighted average:
- Consistency: 40%
- Variety: 30%
- Physical Plausibility: 30%

Return ONLY valid JSON in this exact format:
{
  "overall": 8.5,
  "consistency": 8,
  "variety": 9,
  "physicalPlausibility": 8,
  "reasoning": "Brief explanation of collection-level scores...",
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}`;

// =============================================================================
// Types
// =============================================================================

export interface CollectionEvaluationResult {
  overall: number;
  consistency: number;
  variety: number;
  physicalPlausibility: number;
  reasoning: string;
  suggestions: string[];
  costUsd: number;
  tokensUsed: number;
  model: string;
}

export interface EvaluateCollectionOptions {
  model?: string;
  maxRetries?: number;
}

// =============================================================================
// Helpers
// =============================================================================

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Parse and validate the JSON response from Claude for collection evaluation
 */
const parseCollectionEvaluationResponse = (text: string): Result<{
  overall: number;
  consistency: number;
  variety: number;
  physicalPlausibility: number;
  reasoning: string;
  suggestions: string[];
}> => {
  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr.trim());

    // Validate required fields
    if (typeof parsed.overall !== 'number' || parsed.overall < 1 || parsed.overall > 10) {
      return err(createError('EVALUATION_ERROR', 'Invalid overall score in response'));
    }

    if (typeof parsed.consistency !== 'number' || parsed.consistency < 1 || parsed.consistency > 10) {
      return err(createError('EVALUATION_ERROR', 'Invalid consistency score in response'));
    }

    if (typeof parsed.variety !== 'number' || parsed.variety < 1 || parsed.variety > 10) {
      return err(createError('EVALUATION_ERROR', 'Invalid variety score in response'));
    }

    if (typeof parsed.physicalPlausibility !== 'number' || parsed.physicalPlausibility < 1 || parsed.physicalPlausibility > 10) {
      return err(createError('EVALUATION_ERROR', 'Invalid physical plausibility score in response'));
    }

    if (typeof parsed.reasoning !== 'string') {
      return err(createError('EVALUATION_ERROR', 'Invalid reasoning in response'));
    }

    if (!Array.isArray(parsed.suggestions)) {
      return err(createError('EVALUATION_ERROR', 'Invalid suggestions in response'));
    }

    return ok({
      overall: parsed.overall,
      consistency: parsed.consistency,
      variety: parsed.variety,
      physicalPlausibility: parsed.physicalPlausibility,
      reasoning: parsed.reasoning,
      suggestions: parsed.suggestions,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(createError('EVALUATION_ERROR', `Failed to parse collection evaluation: ${message}`));
  }
};

// =============================================================================
// Main Collection Evaluator
// =============================================================================



/**
 * Evaluate a collection of generated images using Claude's vision capabilities
 *
 * @param imageInputs - Array of image URLs or R2 keys (2-10 images)
 * @param options - Evaluation options
 * @returns Result with collection evaluation scores or error
 */
export const evaluateCollection = async (
  imageInputs: ImageInput[],
  options: EvaluateCollectionOptions = {}
): Promise<Result<CollectionEvaluationResult>> => {
  const { model = 'claude-sonnet-4-20250514', maxRetries = 3 } = options;

  // Validate input constraints
  if (imageInputs.length < 2) {
    return err(createError('VALIDATION_ERROR', 'Collection evaluation requires at least 2 images'));
  }

  if (imageInputs.length > 10) {
    return err(createError('VALIDATION_ERROR', 'Collection evaluation supports maximum 10 images'));
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return err(createError('VALIDATION_ERROR', 'ANTHROPIC_API_KEY environment variable is required'));
  }

  const client = new Anthropic({ apiKey });
  let lastError: PromptTestError = createError('EVALUATION_ERROR', 'Collection evaluation failed after max retries');

  // Prepare image content for Claude API
  const imageContent: Array<{
    type: 'image';
    source: { type: 'base64'; media_type: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif'; data: string } | { type: 'url'; url: string };
  }> = [];

  for (const imageInput of imageInputs) {
    if (imageInput.type === 'key') {
      try {
        const buffer = await downloadBuffer(imageInput.value);
        let imageBase64: string;
        let detectedMediaType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif' = 'image/png';

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

        imageBase64 = buffer.toString('base64');
        imageContent.push({
          type: 'image',
          source: { type: 'base64', media_type: detectedMediaType, data: imageBase64 },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return err(createError('EVALUATION_ERROR', `Failed to download image: ${message}`));
      }
    } else {
      // URL input
      imageContent.push({
        type: 'image',
        source: { type: 'url', url: imageInput.value },
      });
    }
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await client.messages.create({
        model,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              ...imageContent,
              {
                type: 'text',
                text: COLLECTION_EVALUATION_PROMPT,
              },
            ],
          },
        ],
      });

      // Extract text content
      const textContent = response.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        return err(createError('EVALUATION_ERROR', 'No text response from collection evaluator'));
      }

      // Parse response
      const parseResult = parseCollectionEvaluationResponse(textContent.text);
      if (!parseResult.ok) {
        // Parsing failed, retry
        lastError = parseResult.error;
        if (attempt < maxRetries - 1) {
          await sleep(Math.pow(2, attempt) * 1000);
          continue;
        }
        return parseResult;
      }

      const evaluationData = parseResult.data;
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
        overall: evaluationData.overall,
        consistency: evaluationData.consistency,
        variety: evaluationData.variety,
        physicalPlausibility: evaluationData.physicalPlausibility,
        reasoning: evaluationData.reasoning,
        suggestions: evaluationData.suggestions,
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