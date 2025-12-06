# Step 10: Create Evaluator Module with Claude Scoring

## Objective

Create the evaluator module that uses Claude's vision capabilities to score generated product images, and integrate it into the CLI.

## Prerequisites

- Steps 01-09 completed
- Anthropic SDK installed: `npm install @anthropic-ai/sdk`
- `ANTHROPIC_API_KEY` environment variable available

## Files to Create/Modify

### 1. Update `src/lib/env.ts`

Add Anthropic API key to environment validation:

```typescript
// Add to the schema
ANTHROPIC_API_KEY: z.string().min(1).optional(), // Required only for evaluation
```

### 2. Create `src/lib/prompts/evaluator.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';
import {
  Result,
  ok,
  err,
  createError,
  PromptTestError,
} from './errors';
import { EvaluationDetails, ScoreSchema } from './types';

// =============================================================================
// Constants
// =============================================================================

const EVALUATION_PROMPT = `You are evaluating an AI-generated product photo for e-commerce use.

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
 * Calculate cost based on Claude pricing
 * Sonnet 4: $3/1M input, $15/1M output
 */
const calculateCost = (inputTokens: number, outputTokens: number): number => {
  const inputCost = (inputTokens / 1_000_000) * 3;
  const outputCost = (outputTokens / 1_000_000) * 15;
  return inputCost + outputCost;
};

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

/**
 * Evaluate a generated image using Claude's vision capabilities
 *
 * @param imageUrl - Public URL of the image to evaluate
 * @param originalPrompt - The prompt used to generate the image
 * @param options - Evaluation options
 * @returns Result with evaluation scores or error
 */
export const evaluateImage = async (
  imageUrl: string,
  originalPrompt: string,
  options: EvaluateOptions = {}
): Promise<Result<EvaluationResult>> => {
  const { model = 'claude-sonnet-4-20250514', maxRetries = 3 } = options;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return err(createError('VALIDATION_ERROR', 'ANTHROPIC_API_KEY environment variable is required'));
  }

  const client = new Anthropic({ apiKey });
  let lastError: PromptTestError | null = null;

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
                source: {
                  type: 'url',
                  url: imageUrl,
                },
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
      const costUsd = calculateCost(response.usage.input_tokens, response.usage.output_tokens);

      return ok({
        overall,
        details,
        tokensUsed,
        costUsd,
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

  return err(lastError!);
};

/**
 * Evaluate multiple images in sequence with rate limiting
 */
export const evaluateBatch = async (
  tests: Array<{ id: string; imageUrl: string; prompt: string }>,
  options: EvaluateOptions = {},
  onProgress?: (completed: number, total: number) => void
): Promise<Array<{ id: string; result: Result<EvaluationResult> }>> => {
  const results: Array<{ id: string; result: Result<EvaluationResult> }> = [];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    const result = await evaluateImage(test.imageUrl, test.prompt, options);
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
```

### 3. Add Evaluate Command to CLI (`scripts/prompt-bench.ts`)

Add the following after the `runCommand` function:

```typescript
// =============================================================================
// Evaluate Command
// =============================================================================

interface EvaluateOptions {
  label: string;
  model: string;
}

const parseEvaluateOptions = (args: string[]): EvaluateOptions => {
  const { values } = parseArgs({
    args,
    options: {
      label: { type: 'string', short: 'l' },
      model: { type: 'string', short: 'm', default: 'claude-sonnet-4-20250514' },
    },
  });

  if (!values.label) {
    console.error('--label is required');
    process.exit(1);
  }

  return {
    label: values.label,
    model: values.model ?? 'claude-sonnet-4-20250514',
  };
};

const evaluateCommand = async (args: string[]): Promise<void> => {
  const options = parseEvaluateOptions(args);

  console.log(`\n🔍 Prompt Bench: Evaluate`);
  console.log(`─────────────────────────────────`);
  console.log(`Label: ${options.label}`);
  console.log(`Model: ${options.model}`);
  console.log(`─────────────────────────────────\n`);

  const supabase = createAdminClient();

  // Fetch tests that need evaluation
  const { data: tests, error } = await supabase
    .from('prompt_tests')
    .select('id, image_url, final_prompt')
    .eq('batch_label', options.label)
    .eq('status', 'evaluating')
    .order('created_at', { ascending: true });

  if (error) {
    console.error(`Database error: ${error.message}`);
    process.exit(1);
  }

  if (!tests || tests.length === 0) {
    console.log(`No tests found for label "${options.label}" with status "evaluating"`);
    return;
  }

  console.log(`📋 Found ${tests.length} tests to evaluate\n`);

  const { evaluateImage } = await import('@/lib/prompts/evaluator');

  let completed = 0;
  let failed = 0;

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`[${i + 1}/${tests.length}] Evaluating...`);

    if (!test.image_url) {
      console.log(`  ⏭️  Skipping (no image URL)`);
      continue;
    }

    const result = await evaluateImage(test.image_url, test.final_prompt, {
      model: options.model,
    });

    if (!result.ok) {
      console.log(`  ❌ Failed: ${result.error.message}`);
      failed++;
      continue;
    }

    // Save evaluation
    const { error: insertError } = await supabase.from('prompt_evaluations').insert({
      test_id: test.id,
      score_overall: result.data.overall,
      details: result.data.details,
      evaluator_model: result.data.model,
      evaluator_type: 'llm',
      cost_usd: result.data.costUsd,
      tokens_used: result.data.tokensUsed,
    });

    if (insertError) {
      console.log(`  ❌ Database error: ${insertError.message}`);
      failed++;
      continue;
    }

    // Update test status
    await supabase.rpc('update_prompt_test_status', {
      p_test_id: test.id,
      p_new_status: 'completed',
    });

    console.log(`  ✅ Score: ${result.data.overall.toFixed(1)}/10`);
    completed++;
  }

  // Summary
  console.log(`\n─────────────────────────────────`);
  console.log(`📊 Results:`);
  console.log(`   Evaluated: ${completed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`─────────────────────────────────\n`);

  console.log(`Next steps:`);
  console.log(`  npm run bench report --label "${options.label}"`);
};
```

Update the main switch statement:

```typescript
case 'evaluate':
  await evaluateCommand(args);
  break;
```

## Implementation Steps

1. Run `npm install @anthropic-ai/sdk` to install the Anthropic SDK
2. Update `src/lib/env.ts` to include `ANTHROPIC_API_KEY`
3. Create `src/lib/prompts/evaluator.ts` with the content above
4. Update `scripts/prompt-bench.ts` to add the evaluate command
5. Add `ANTHROPIC_API_KEY` to your `.env` file
6. Verify there are no TypeScript errors: `npx tsc --noEmit`

## Acceptance Criteria

- [ ] Anthropic SDK is installed
- [ ] `src/lib/env.ts` includes optional `ANTHROPIC_API_KEY`
- [ ] `src/lib/prompts/evaluator.ts` exists with `evaluateImage` function
- [ ] Evaluator uses Claude's vision capabilities to analyze images
- [ ] Evaluator returns structured scores with overall and breakdown
- [ ] Evaluator has retry logic with exponential backoff
- [ ] CLI `evaluate` command fetches tests with `evaluating` status
- [ ] CLI saves evaluations to `prompt_evaluations` table
- [ ] CLI updates test status to `completed` after evaluation
- [ ] Cost tracking is accurate (based on Claude pricing)

## Usage

```bash
# Run evaluation on a batch
npm run bench evaluate --label "products-baseline"

# Use a different model
npm run bench evaluate --label "products-baseline" --model "claude-sonnet-4-20250514"
```

## Notes

- The evaluation prompt is designed for e-commerce product photography
- Scores are weighted to prioritize product visibility (25%) and lighting (20%)
- Claude returns JSON with scores and reasoning
- Rate limiting (500ms) prevents API throttling
- Failed evaluations are logged but don't stop the batch
