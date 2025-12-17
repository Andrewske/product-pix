# Atomic Angle Generation Architecture

**Date:** 2025-12-16
**Status:** Ready for implementation
**Author:** Kevin + Claude

## Background

We ran tests on the `multi-angle-hybrid` template to evaluate prompt vocabulary changes. During analysis, we discovered a deeper architectural issue that causes inconsistent results.

### Original Goal
Replace geometric angle terminology (`45-degree`) with photography terms (`three-quarter view`) to improve image generation quality.

### What We Found
The vocabulary fix worked (scores improved from 3.2/10 to 8.7/10 for `three-quarter view`), but we discovered:

1. **Collage generation:** Some tests produced 4-image collages instead of single product images
2. **Angle repetition:** Multiple "undefined" angle tests produced the same front view
3. **High variance:** Same prompt + same source image produced scores ranging 4.2 to 8.7

## Root Cause Analysis

### The Problematic Template
```typescript
subject: 'Professional photo of {product}. Required: {angle}. For remaining images, choose creative angles appropriate for this product type.'
```

**Issue:** This prompt is sent 5 separate times to the generator (once per image in the collection). Each time, the generator sees "for remaining images" and gets confused about whether it should:
- Generate one image (correct)
- Generate multiple images showing different angles (wrong → collages)

### Current Architecture Flow
```
1. Analyze all images → merged product attributes
2. Classify category → get hardcoded angles from category-angles.ts
3. Loop 5 times:
   - Pick angle[j] from hardcoded list (or undefined for j >= 2 in hybrid)
   - Pick source[j % sourceImages.length]
   - Compile template with "for remaining images..." text
   - Generate
```

**Problems:**
- Generator makes angle decisions it shouldn't (when angle is undefined)
- Template language implies multi-image generation
- Source images aren't matched to appropriate angles
- No detection of what angles source images already show

## Solution: One Job Per Generation

**Key insight:** Separate decision-making (analyst) from execution (generator).

### New Architecture Flow
```
1. Analyst examines source images:
   - Detects what angle each source image shows
   - Decides what 5 angles the collection should have
   - Matches source images to angles intelligently

2. Generator receives atomic instructions:
   - ONE specific angle to produce
   - ONE source image to reference
   - NO mention of "remaining" images or other angles
```

### Why This Works
- **Clear separation of concerns:** Analyst thinks, generator executes
- **No ambiguity:** Each generation has exactly one job
- **Intelligent matching:** Source images paired with appropriate angles
- **No collages:** Generator can't misinterpret "for remaining images" because it never sees that text

## Design Decisions

### Decision 1: Free-form Angle Detection
**Options considered:**
1. Classify into known vocabulary (front, back, three-quarter, etc.)
2. Free-form detection with mapping to known terms
3. Free-form detection passed directly to generator

**Chosen:** Option 3 - Let analyst describe angles freely, pass directly to generator.

**Reasoning:**
- Simpler architecture (no mapping layer)
- More flexible (handles unusual angles)
- Generator already understands natural language angle descriptions
- Avoids vocabulary translation errors

### Decision 2: Remove Category-Based Angles
**Current system:** Hardcoded angle lists per product category in `category-angles.ts`

**New approach:** Analyst decides angles dynamically based on actual source images.

**Reasoning:**
- Hardcoded angles don't account for what source images actually show
- Analyst can make better decisions with visual context
- Reduces maintenance burden (no need to curate category-specific angle lists)
- More adaptable to unusual products

### Decision 3: Keep Product Analysis Separate
The existing `product-analyzer.ts` extracts: `product`, `color`, `material`, `shape`, `features`

**Decision:** Keep this separate from angle planning.

**Reasoning:**
- Different concerns (what vs how to photograph)
- Product analysis can run in parallel with angle planning
- Existing analysis is well-tested and working

## Implementation Plan

### Phase 1: Create Angle Planning
**New file:** `prompt-bench/core/angle-planner.ts`

```typescript
interface AnglePlan {
  sourceAngles: Array<{
    imageIndex: number;
    detectedAngle: string;
  }>;
  collectionPlan: Array<{
    angle: string;
    sourceImageIndex: number;
    reasoning: string;
  }>;
}

async function planAngles(
  sourceImages: ResolvedSourceImage[],
  outputCount: number
): Promise<Result<AnglePlan>>
```

**Analysis prompt for Gemini:**
```
You are analyzing product images to plan a professional e-commerce photo collection.

Given these source images, determine:
1. What angle/view each source image shows
2. What 5 angles would create a complete, professional product listing
3. Which source image best references each planned angle

Output JSON matching the AnglePlan schema.
```

### Phase 2: Update Types
**File:** `prompt-bench/core/types.ts`

Add `AnglePlan` interface and update `CollectionTemplate` to support new flow.

### Phase 3: Simplify Template
**File:** `prompt-bench/templates/multi-angle-collection.ts`

```typescript
// Before
subject: 'Professional photo of {product}. Required: {angle}. For remaining images, choose creative angles appropriate for this product type.'

// After
subject: 'Professional photo of {product} from {angle}'
```

### Phase 4: Update Orchestrator
**File:** `prompt-bench/core/orchestrator.ts`

Replace `coordinateCollectionGeneration()` logic:
```typescript
// Before
const angles = getAnglesForCategory(category);
for (let j = 0; j < outputCount; j++) {
  const angle = strategy === 'hybrid' && j >= 2 ? undefined : angles[j];
  const sourceIndex = j % sourceImages.length;
  // generate...
}

// After
const anglePlan = await planAngles(sourceImages, outputCount);
for (const planned of anglePlan.collectionPlan) {
  const angle = planned.angle;
  const sourceImage = sourceImages[planned.sourceImageIndex];
  // generate with atomic prompt...
}
```

### Phase 5: Deprecate Old Code
- `prompt-bench/core/category-angles.ts` - No longer needed
- Remove `varietyStrategy` from templates (analyst handles all strategies)

## Example: Before vs After

### Before (Current)
**Input:** 2 source images of Lego Minifigure

**Generation 1:**
```
Prompt: "Professional photo of Lego Minifigure. Required: front. For remaining images, choose creative angles..."
Source: image[0]
Result: 4.2/10 (collage)
```

**Generation 2:**
```
Prompt: "Professional photo of Lego Minifigure. Required: undefined. For remaining images, choose creative angles..."
Source: image[1]
Result: 8.7/10 (but same angle as image 1)
```

### After (New)
**Input:** 2 source images of Lego Minifigure

**Angle Planning Output:**
```json
{
  "sourceAngles": [
    { "imageIndex": 0, "detectedAngle": "front view standing on base" },
    { "imageIndex": 1, "detectedAngle": "back view" }
  ],
  "collectionPlan": [
    { "angle": "front view", "sourceImageIndex": 0 },
    { "angle": "back view", "sourceImageIndex": 1 },
    { "angle": "three-quarter view", "sourceImageIndex": 0 },
    { "angle": "overhead view", "sourceImageIndex": 0 },
    { "angle": "detail shot of accessories", "sourceImageIndex": 0 }
  ]
}
```

**Generation 1:**
```
Prompt: "Professional photo of Lego Minifigure from front view"
Source: image[0]
```

**Generation 2:**
```
Prompt: "Professional photo of Lego Minifigure from back view"
Source: image[1]
```

(etc. - each generation is atomic, no confusion)

## Files to Modify

| File | Change |
|------|--------|
| `prompt-bench/core/angle-planner.ts` | **NEW** - Angle planning logic + Gemini prompt |
| `prompt-bench/core/types.ts` | Add `AnglePlan` interface |
| `prompt-bench/core/orchestrator.ts` | Use angle planner instead of category angles |
| `prompt-bench/templates/multi-angle-collection.ts` | Simplify subject line |
| `prompt-bench/core/category-angles.ts` | Deprecate (keep for reference) |

## Success Criteria

- [ ] Each generation prompt mentions only ONE angle
- [ ] No "remaining images" or "other angles" language in prompts
- [ ] Analyst decides angles based on actual source images
- [ ] Source images matched intelligently to angles
- [ ] No collages in output (single product view only)
- [ ] Scores remain 8+ for well-defined angles
- [ ] Diverse angles across collection (no repetition)

## Test Plan

1. **Minimal test:** Run with Lego Minifigure (2 source images)
   - Verify no collages
   - Verify 5 distinct angles
   - Verify scores ≥ 8.0

2. **Multi-product test:** Run with original batch (5 products)
   - Compare mean scores to baseline
   - Check angle diversity per product

3. **Edge cases:**
   - Single source image (analyst must pick best reference for all 5)
   - Many source images (analyst must choose wisely)

## Rollback Plan

If new architecture underperforms:
1. Keep `category-angles.ts` intact during implementation
2. Add feature flag to toggle between old/new flow
3. A/B test before full rollout

## Open Questions

1. **Caching:** Should angle plans be cached like product analysis?
   - Pro: Saves API calls on re-runs
   - Con: Plans should adapt to different output counts

2. **Cost:** Angle planning adds one Gemini call per test case
   - Estimate: ~$0.01 per planning call
   - Tradeoff: Better results worth the cost?

3. **Template compatibility:** Should we create a new template slug or update existing?
   - Recommendation: New slug (`multi-angle-planned`) to allow comparison
