# Implement Paperwork Detection in Consensus Merger

## Files to Modify
- `prompt-bench/core/consensus.ts` (lines 8-49) - modify

## Implementation Details

Add OR logic for paperwork detection in the `mergeAnalysisResults` function, following the same pattern as scale detection.

### Logic Requirements
- **OR semantics**: If ANY image in the batch has paperwork, set `hasPaperwork: true`
- **Detail aggregation**: Concatenate all unique paperwork descriptions with `;` separator
- This ensures conservative detection (any paperwork triggers warning)

### Code Changes

Add after the scale detection block (around line 20-30):

```typescript
export function mergeAnalysisResults(results: ProductAnalysis[]): MergedAnalysis {
  if (results.length === 0) {
    throw new Error('Cannot merge empty analysis results');
  }

  if (results.length === 1) {
    return results[0];
  }

  // Scale detection: if ANY image has scale reference, use it (OR logic)
  const hasScale = results.some(r => r.hasScaleReference);
  const scaleDescriptions = results
    .filter(r => r.hasScaleReference && r.scaleDescription)
    .map(r => r.scaleDescription!);
  const bestScaleDescription = scaleDescriptions.length > 0
    ? scaleDescriptions.sort((a, b) => b.length - a.length)[0]
    : undefined;

  // NEW: Paperwork detection - if ANY image has paperwork, trigger warning (OR logic)
  const hasPaperwork = results.some(r => r.hasPaperwork);
  const paperworkDescriptions = results
    .filter(r => r.hasPaperwork && r.paperworkDetails)
    .map(r => r.paperworkDetails!);
  // Concatenate all unique paperwork details (might be different items in different images)
  const bestPaperworkDetails = paperworkDescriptions.length > 0
    ? paperworkDescriptions.join('; ')
    : undefined;

  // Brand: use majority vote, prefer non-empty values
  const brands = results.map(r => r.brand).filter(b => b && b.trim().length > 0);
  const brand = brands.length > 0 ? majorityVote(brands) : undefined;

  const brandingDetails = results
    .filter(r => r.brandingDetails && r.brandingDetails.trim().length > 0)
    .map(r => r.brandingDetails!)
    .sort((a, b) => b.length - a.length)[0];

  return {
    product: majorityVote(results.map(r => r.product)),
    color: majorityVote(results.map(r => r.color)),
    material: majorityVote(results.map(r => r.material)),
    shape: majorityVote(results.map(r => r.shape)),
    features: unionArray(results.flatMap(r => r.features)),
    hasScaleReference: hasScale,
    scaleDescription: bestScaleDescription,
    brand,
    brandingDetails,
    hasPaperwork,                           // NEW
    paperworkDetails: bestPaperworkDetails  // NEW
  };
}
```

### Example Scenarios

**Scenario 1: Single image with paperwork**
- Input: `[{hasPaperwork: false}, {hasPaperwork: true, paperworkDetails: "barcode visible"}]`
- Output: `{hasPaperwork: true, paperworkDetails: "barcode visible"}`

**Scenario 2: Multiple images with different paperwork**
- Input: `[{hasPaperwork: true, paperworkDetails: "manual"}, {hasPaperwork: true, paperworkDetails: "box"}]`
- Output: `{hasPaperwork: true, paperworkDetails: "manual; box"}`

**Scenario 3: No paperwork detected**
- Input: `[{hasPaperwork: false}, {hasPaperwork: false}]`
- Output: `{hasPaperwork: false, paperworkDetails: undefined}`

## Acceptance Criteria
- [ ] OR logic implemented: `results.some(r => r.hasPaperwork)`
- [ ] Details concatenated with `;` separator when multiple sources exist
- [ ] Function returns merged `hasPaperwork` and `paperworkDetails` fields
- [ ] TypeScript compilation passes
- [ ] Follows same pattern as scale detection (code consistency)
- [ ] Unit tests pass (if existing tests cover merge logic)

## Dependencies
- Task 01 (schema extension) must be completed first
- Task 02 (detection logic) should be completed for end-to-end testing
