# Orchestrator Integration

## Files to Modify/Create
- `prompt-bench/core/orchestrator.ts` (modify)

## Implementation Details

Replace the `varietyStrategy` branching logic in `coordinateCollectionGeneration()` with the new angle planner.

### Current Code (to replace)

Location: `coordinateCollectionGeneration()` around line 780

```typescript
// OLD - Remove this logic
const angles = getAnglesForCategory(category);
for (let j = 0; j < template.outputCount; j++) {
  let angle: string | undefined;
  if (template.varietyStrategy === 'category-based' || template.varietyStrategy === 'hybrid') {
    angle = angles[j] || angles[angles.length - 1];
  }
  const sourceIndex = j % resolvedSourceImages.length;
  // ... generation code
}
```

### New Code

```typescript
import { detectSourceAngles } from '@bench/core/angle-detector';
import { planCollection, categoryFallback } from '@bench/core/angle-planner';

// In coordinateCollectionGeneration(), replace the angle selection logic:

// Step 1: Detect angles from source images
const detected = await detectSourceAngles(resolvedSourceImagesForAnalysis, {
  cacheEnabled: analysisCacheEnabled
});

// Step 2: Handle detection failure with fallback
let detectedAngles: DetectedAngles;
if (!isOk(detected)) {
  logger.warn('Angle detection failed, using category fallback', {
    error: detected.error.message,
    category
  });
  detectedAngles = categoryFallback(category, resolvedSourceImagesForAnalysis.length);
} else {
  detectedAngles = detected.data;
}

// Step 3: Plan the collection
const plan = planCollection(detectedAngles, category, template.outputCount);

// Step 4: Generate each image using the plan
for (let j = 0; j < plan.assignments.length; j++) {
  const assignment = plan.assignments[j];
  const angle = assignment.targetAngle;
  const sourceImage = resolvedSourceImagesForAnalysis[assignment.sourceImageIndex];

  // Log match type for debugging
  logger.debug('Generating angle', {
    angle,
    sourceIndex: assignment.sourceImageIndex,
    matchType: assignment.matchType
  });

  // ... rest of generation code (compile template, generate, upload, etc.)
}
```

### Remove varietyStrategy References

Delete all `varietyStrategy` checks in the orchestrator:
- Remove `template.varietyStrategy === 'category-based'` conditionals
- Remove `template.varietyStrategy === 'hybrid'` conditionals
- Remove `template.varietyStrategy === 'ai-decided'` conditionals

The planner handles all strategies now.

### Integration Points

1. **analysisCacheEnabled** - Pass through to `detectSourceAngles` for cache control
2. **category** - Still needed for fallback and planning defaults
3. **outputCount** - Comes from template, passed to `planCollection`

## Acceptance Criteria
- [ ] `coordinateCollectionGeneration()` uses new angle detector and planner
- [ ] All `varietyStrategy` branching removed
- [ ] Fallback triggers correctly on detection failure
- [ ] Match type logged for debugging
- [ ] Source images correctly matched per plan assignments
- [ ] Existing tests still pass (behavior should be equivalent or better)

## Dependencies
- Task 01 (Types and Interfaces)
- Task 02 (Angle Detector)
- Task 03 (Angle Planner)
