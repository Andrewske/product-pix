# Types and Interfaces

## Files to Modify
- `prompt-bench/ui/types/index.ts` (modify)

## Implementation Details

Add TypeScript interfaces for the human review feature. These are foundational types that the API and components will depend on.

### Types to Add

```typescript
export interface UnreviewedImage {
  id: string;
  imageUrl: string;
  imageUrls?: string[];  // Multi-image runs
  finalPrompt: string;
  sourceImageUrl: string | null;
  llmScore: number;
  llmDetails: Record<string, unknown>;
  createdAt: string;
}

export interface HumanRating {
  testId: string;
  imageIndex?: number;
  score: number;
  notes?: string;
}
```

### Context
- `UnreviewedImage` represents generation runs that have AI evaluations but no human rating yet
- `HumanRating` is the payload for submitting a human evaluation
- `imageIndex` is used for multi-image runs where each image is rated separately
- `imageUrls` array is for generation runs that produced multiple images (conversation mode)

## Acceptance Criteria
- [ ] Types compile without errors
- [ ] Types are exported from the module
- [ ] No breaking changes to existing type exports

## Dependencies
None - this is the first task
