# Collection-Level Evaluator

## Files to Modify/Create
- `prompt-bench/core/collection-evaluator.ts` (new)
- `prompt-bench/core/index.ts` (modify - add export)
- `prompt-bench/commands/evaluate-collection.ts` (new - CLI command)

## Implementation Details

Create a new evaluator that assesses image collections as a whole, not just individual images.

### Core Functionality

The collection evaluator should:
1. Take N generated images as input (URLs or R2 keys)
2. Send all images to Claude in a single API call
3. Return scores for three collection-specific metrics:
   - **Consistency** (1-10): Does the product look identical across all outputs?
   - **Variety** (1-10): Are the outputs meaningfully different from each other?
   - **Physical plausibility** (1-10): Do the angles make sense? Are there distortions?
4. Return overall collection score + reasoning string

### Interface

```typescript
interface CollectionEvaluationResult {
  consistency: number;      // 1-10
  variety: number;          // 1-10
  physicalPlausibility: number;  // 1-10
  overallScore: number;     // weighted average
  reasoning: string;
  suggestions: string[];
  costUsd: number;
  tokensUsed: { input: number; output: number };
}

function evaluateCollection(
  imageUrls: string[],
  options?: { model?: string }
): Promise<Result<CollectionEvaluationResult, EvaluationError>>
```

### Implementation Notes

- Follow existing `evaluator.ts` patterns for Claude API calls
- Use vision capability to send all images in one message
- Include retry logic with exponential backoff (match existing evaluator)
- Track costs using existing `cost.ts` utilities
- Weight calculation suggestion: consistency (40%) + variety (30%) + plausibility (30%)

### Prompt Structure

```
You are evaluating a collection of AI-generated product photos. All images should show the same product from different angles.

Evaluate these {N} images on:

1. CONSISTENCY (Product Identity): Does the PRODUCT look identical across all images?
   - Same color, shape, proportions, and details in every shot
   - Score HIGH if you could tell it's the exact same physical item
   - Score LOW if colors shift, proportions change, or details appear/disappear

2. VARIETY (Compositional Diversity): Are the ANGLES and COMPOSITIONS meaningfully different?
   - Different viewing angles, camera positions, and framings
   - Score HIGH if each image shows the product from a distinct perspective
   - Score LOW if images look like duplicates or minor variations

3. PHYSICAL PLAUSIBILITY: Do the angles make physical sense?
   - No impossible geometry, distortions, or floating objects
   - Lighting and shadows consistent with viewing angle

IMPORTANT: High consistency + high variety is the goal. The PRODUCT should be identical; the VIEWPOINT should vary.

Example of HIGH consistency + HIGH variety: A red sneaker photographed from front, side, back, top, and 3/4 angle. Same shoe in every image, but each shows a different perspective.

Example of LOW consistency + HIGH variety: A sneaker that appears red in some images and orange in others, or changes shape between angles.

Return JSON with scores 1-10 for each metric, reasoning, and suggestions.
```

## Acceptance Criteria

- [ ] Function accepts array of image URLs (minimum 2, maximum 10)
- [ ] Returns all three scores + overall weighted score
- [ ] Handles errors gracefully (returns Result type)
- [ ] Tracks token usage and cost
- [ ] Exported from `prompt-bench/core/index.ts`
- [ ] CLI command `bun bench evaluate-collection --label <label>` works
- [ ] CLI groups images by test/product and evaluates each collection

## Dependencies

None - this is the foundational task.
