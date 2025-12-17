# Testing and Validation

## Files to Modify/Create
- `prompt-bench/__tests__/angle-planner.test.ts` (new)
- `prompt-bench/__tests__/angle-detector.test.ts` (new)

## Implementation Details

### Unit Tests for Angle Planner

**File:** `prompt-bench/__tests__/angle-planner.test.ts`

Test the deterministic planning algorithm:

```typescript
import { describe, it, expect } from 'bun:test';
import { planCollection, categoryFallback } from '@bench/core/angle-planner';

describe('planCollection', () => {
  it('uses exact matches when available', () => {
    const detected = {
      sourceAngles: [
        { imageIndex: 0, detectedAngle: 'front', isPrimaryReference: true },
        { imageIndex: 1, detectedAngle: 'back', isPrimaryReference: false },
      ]
    };
    const plan = planCollection(detected, 'generic', 5);

    // Front and back should be exact matches
    expect(plan.assignments[0].matchType).toBe('exact');
    expect(plan.assignments[0].targetAngle).toBe('front');
  });

  it('falls back to primary reference for unmatched angles', () => {
    const detected = {
      sourceAngles: [
        { imageIndex: 0, detectedAngle: 'front', isPrimaryReference: true },
      ]
    };
    const plan = planCollection(detected, 'generic', 5);

    // Angles beyond 'front' should use primary fallback
    const backAssignment = plan.assignments.find(a => a.targetAngle === 'back');
    expect(backAssignment?.matchType).toBe('primary-fallback');
    expect(backAssignment?.sourceImageIndex).toBe(0);
  });

  it('fills remaining slots from category defaults', () => {
    const detected = {
      sourceAngles: [
        { imageIndex: 0, detectedAngle: 'unusual-angle', isPrimaryReference: true },
      ]
    };
    const plan = planCollection(detected, 'generic', 5);

    // Should have 5 assignments
    expect(plan.assignments).toHaveLength(5);
    // Should include category defaults
    const angles = plan.assignments.map(a => a.targetAngle);
    expect(angles).toContain('front');
  });

  it('handles single source image', () => {
    const detected = {
      sourceAngles: [
        { imageIndex: 0, detectedAngle: 'front', isPrimaryReference: true },
      ]
    };
    const plan = planCollection(detected, 'generic', 5);

    // All assignments should use image 0
    expect(plan.assignments.every(a => a.sourceImageIndex === 0)).toBe(true);
  });
});

describe('categoryFallback', () => {
  it('creates fallback DetectedAngles from category', () => {
    const fallback = categoryFallback('generic', 2);

    expect(fallback.sourceAngles).toHaveLength(2);
    expect(fallback.sourceAngles[0].isPrimaryReference).toBe(true);
  });
});
```

### Unit Tests for Angle Detector

**File:** `prompt-bench/__tests__/angle-detector.test.ts`

Test caching and error handling (mock Gemini):

```typescript
import { describe, it, expect, mock, beforeEach } from 'bun:test';

describe('detectSourceAngles', () => {
  it('caches results for same images', async () => {
    // Mock Gemini to track calls
    // Call twice with same images
    // Verify Gemini only called once
  });

  it('returns category fallback on Gemini failure', async () => {
    // Mock Gemini to throw error
    // Verify fallback DetectedAngles returned
    // Verify warning logged
  });

  it('parses Gemini response correctly', async () => {
    // Mock Gemini with known response
    // Verify DetectedAngles structure
  });
});
```

### Integration Test

Run the full pipeline with Lego Minifigure fixture:

```bash
bun bench sync
bun bench test --template multi-angle-hybrid --batch prompt-bench/fixtures/min-multi-image.json
```

**Verify:**
1. No collages in output
2. 5 distinct angles generated
3. Scores ≥ 8.0
4. Source matching makes sense (front source → front angle)
5. Report shows match types in metadata

### Cache Test

```bash
# Run twice with same images
bun bench test --template multi-angle-hybrid --batch prompt-bench/fixtures/min-multi-image.json --label cache-test-1
bun bench test --template multi-angle-hybrid --batch prompt-bench/fixtures/min-multi-image.json --label cache-test-2

# Second run should skip angle detection (check logs)
```

### Fallback Test

Temporarily break Gemini config or mock failure, verify:
1. Warning logged
2. Generation continues with category angles
3. Results still acceptable (≥7.5 scores)

## Acceptance Criteria
- [ ] Unit tests pass for angle-planner.ts
- [ ] Unit tests pass for angle-detector.ts
- [ ] Integration test produces 5 images, all ≥8.0 scores
- [ ] No collages in any output
- [ ] Cache works (second run skips detection API)
- [ ] Fallback works (generation continues on detection failure)

## Dependencies
- All previous tasks (01-05) must be complete
