# Angle Detector

## Files to Modify/Create
- `prompt-bench/core/angle-detector.ts` (new)

## Implementation Details

Create a new module for Gemini-powered detection of what angles source images show.

### Function Signature

```typescript
async function detectSourceAngles(
  sourceImages: ResolvedSourceImage[],
  options?: { cacheEnabled?: boolean }
): Promise<Result<DetectedAngles>>
```

### Gemini Prompt Design

The analyst prompt should guide Gemini to:
1. Describe each image's angle using photography terms (front, back, three-quarter, top-down, detail, etc.)
2. Identify which source shows the most complete view of the product (`isPrimaryReference: true`)
3. Use category-appropriate vocabulary when applicable

**Vocabulary guidance (include examples in prompt):**
- Prefer standard terms: front, back, three-quarter view, side, top-down, detail, scale
- For unusual angles, describe clearly (e.g., "low angle looking up at product")
- Category-specific terms are acceptable (e.g., "outsole" for footwear)

### Caching Strategy

- **Cache key:** Hash of source image buffers (content-based)
- **Cache storage:** Use existing analysis cache pattern from `product-analyzer.ts`
- **Cache hit:** Return cached `DetectedAngles` without API call
- **Cache miss:** Call Gemini, store result, return

### Error Handling

On Gemini failure (timeout, malformed response, etc.):
1. Log warning with error details: `logger.warn('Angle detection failed, using category fallback', { error })`
2. Return fallback `DetectedAngles` based on category defaults
3. Mark all sources as potential primary references

### Response Parsing

Parse Gemini response into `DetectedAngles` structure:
- Use Zod schema for validation
- Handle partial responses gracefully
- Default `isPrimaryReference` to first image if Gemini doesn't specify

## Acceptance Criteria
- [ ] Function returns `Result<DetectedAngles>` following project error patterns
- [ ] Gemini prompt produces consistent, photography-standard angle descriptions
- [ ] Caching works (second call with same images skips API)
- [ ] Fallback to category angles on Gemini failure
- [ ] Warning logged when fallback is triggered
- [ ] Unit tests for cache hit/miss scenarios

## Dependencies
- Task 01 (Types and Interfaces) - needs `DetectedAngles` type
