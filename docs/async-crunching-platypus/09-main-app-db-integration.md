# Main App: Fetch Analysis Prompts from Database

## Files to Modify
- `src/lib/ai/product-analyzer.ts` (fetch prompt from DB instead of hardcoded)

## Implementation Details

Update the main app's product analyzer to fetch prompts from the database (synced via `bun bench sync-analysis`), with fallback to hardcoded prompt for backwards compatibility.

### 1. Add Imports
```typescript
import { fetchAnalysisPromptBySlug } from '@/lib/db/analysis-prompts';
```

### 2. Extract Hardcoded Prompt as Fallback
Move the existing hardcoded prompt text to a constant:

```typescript
const FALLBACK_PRODUCT_ANALYSIS_PROMPT = `Analyze this product image and extract the following information. Be specific and descriptive. If you cannot determine a field, use an empty string.`;
```

### 3. Modify analyzeProductImage Function
Update to fetch prompt from DB with fallback:

**Before:**
```typescript
export const analyzeProductImage = async (
  image: Buffer,
  _mimeType: string
): Promise<Result<{ analysis: ProductAnalysis; usage: UsageMetrics }>> => {
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
              text: 'Analyze this product image and extract the following information...',
            },
            {
              type: 'image',
              image: image,
            },
          ],
        },
      ],
      schema: z.object({ /* ... */ }),
    });
    // ...
  }
}
```

**After:**
```typescript
export const analyzeProductImage = async (
  image: Buffer,
  _mimeType: string
): Promise<Result<{ analysis: ProductAnalysis; usage: UsageMetrics }>> => {
  try {
    // Fetch prompt from DB (with fallback to hardcoded)
    const promptResult = await fetchAnalysisPromptBySlug('product-analysis');
    const promptText = promptResult && promptResult.promptText
      ? promptResult.promptText
      : FALLBACK_PRODUCT_ANALYSIS_PROMPT;

    const model = env.ANALYSIS_MODEL || 'gemini-2.0-flash';

    const result = await generateObject({
      model: google(model),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: promptText,  // From DB or fallback
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
```

### 4. Add Logging for Prompt Source
Optional: Log whether DB prompt or fallback was used:

```typescript
if (promptResult && promptResult.promptText) {
  logger.debug('Using analysis prompt from database', {
    slug: 'product-analysis',
    version: promptResult.version
  });
} else {
  logger.debug('Using fallback analysis prompt (DB prompt not found)');
}
```

## Acceptance Criteria
- [ ] Fetches analysis prompt from database via `fetchAnalysisPromptBySlug`
- [ ] Falls back to hardcoded prompt if DB fetch fails or returns null
- [ ] Schema definition remains in code (not from DB) for type safety
- [ ] Existing `/generate` endpoint functionality unchanged
- [ ] No breaking changes to API or behavior
- [ ] Logs prompt source for debugging

## Backwards Compatibility
- If `bun bench sync-analysis` hasn't been run, fallback prompt is used
- No database dependency added to main app (graceful degradation)
- Schema remains in code to maintain type safety

## Testing
- Test with DB prompt synced (should use DB version)
- Test without DB prompt (should use fallback)
- Verify analysis results are identical regardless of prompt source
- Check that main app doesn't crash if DB is unavailable

## Dependencies
- Task 02 (analysis prompt definitions)
- Task 03 (sync infrastructure to populate DB)
