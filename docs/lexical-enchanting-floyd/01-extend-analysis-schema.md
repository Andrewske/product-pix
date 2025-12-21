# Extend Analysis Schema with Paperwork Detection Fields

## Files to Modify
- `src/types/analysis.ts` (lines 14-24) - modify

## Implementation Details

Add two new fields to the `ProductAnalysis` interface to support paperwork detection:

```typescript
export interface ProductAnalysis {
  product: string;
  color: string;
  material: string;
  shape: string;
  features: string[];
  hasScaleReference: boolean;
  scaleDescription?: string;
  brand?: string;
  brandingDetails?: string;
  hasPaperwork: boolean;        // NEW: Boolean flag for paperwork presence
  paperworkDetails?: string;    // NEW: Description of detected paperwork
}
```

### Rationale
These fields follow the same pattern as existing detection fields:
- `hasScaleReference` / `scaleDescription` (scale detection)
- `brand` / `brandingDetails` (brand detection)

The boolean flag enables quick checks, while the optional details field provides context for user warnings.

## Acceptance Criteria
- [ ] `hasPaperwork: boolean` added to `ProductAnalysis` interface
- [ ] `paperworkDetails?: string` added to `ProductAnalysis` interface
- [ ] TypeScript compilation passes (`bun typecheck`)
- [ ] No breaking changes to existing analysis code

## Dependencies
None - this is the foundation task that must complete first.
