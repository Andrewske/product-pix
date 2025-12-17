# Collection Planner (Algorithmic)

## Files to Modify/Create
- `prompt-bench/core/angle-planner.ts` (new)

## Implementation Details

Create a deterministic algorithm to plan collection angles and match sources. **No API call needed** - this is pure logic operating on `DetectedAngles`.

### Function Signature

```typescript
function planCollection(
  detectedAngles: DetectedAngles,
  category: ProductCategory,
  outputCount: number
): AnglePlan
```

### Algorithm

1. **Start with detected source angles** (what we have)
   - Extract unique angles from `detectedAngles.sourceAngles`
   - These become candidates for the collection

2. **Fill remaining slots from category defaults** (what we need)
   - Get category angles from `getAnglesForCategory(category)`
   - Add angles not already covered by source images
   - Stop when we have `outputCount` angles

3. **For each target angle, find best source using explicit criteria:**
   - **Exact match:** Source shows same angle as target → `matchType: 'exact'`
   - **Similar match:** Source shows related angle (e.g., three-quarter for front) → `matchType: 'similar'`
   - **Primary fallback:** No good match, use `isPrimaryReference` source → `matchType: 'primary-fallback'`

### Source Matching Criteria (Priority Order)

1. **Same angle** - Source detected angle matches target angle
2. **Most complete view** - Source shows most of the product's key features
3. **Best image quality** - If tie, prefer sharper/better-lit source

The `isPrimaryReference` flag from detection phase handles criteria 2 and 3.

### Angle Similarity Mapping

Define which angles are "similar" for fallback matching:
```typescript
const ANGLE_SIMILARITY: Record<string, string[]> = {
  'front': ['three-quarter view', 'front-on-model'],
  'back': ['three-quarter view'],
  'three-quarter view': ['front', 'side', 'three-quarter left view', 'three-quarter right view'],
  'side': ['three-quarter view', 'side-profile'],
  'top-down': ['overhead', 'top'],
  'detail': ['macro-detail', 'detail-fabric', 'detail-interface'],
  // ... extend as needed
};
```

### Edge Cases

- **Single source image:** Use it for all angles (`primary-fallback` for all)
- **More sources than outputs:** Pick best matches, ignore extras
- **Duplicate detected angles:** Deduplicate, prefer higher quality source

## Acceptance Criteria
- [ ] Function returns `AnglePlan` with correct `outputCount` assignments
- [ ] No API calls made (pure algorithmic)
- [ ] Exact matches preferred over similar matches
- [ ] Primary reference used when no good match exists
- [ ] Category defaults fill gaps correctly
- [ ] Unit tests for single source, multiple source, edge cases

## Dependencies
- Task 01 (Types and Interfaces) - needs `DetectedAngles`, `AnglePlan` types
- Uses `category-angles.ts` for default angles (existing file, no changes needed)
