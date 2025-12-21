# Manual Testing and Validation

## Files to Create
- `prompt-bench/core/__tests__/consensus-paperwork.test.ts` (new)

## Test Strategy

This task validates the complete paperwork detection workflow through manual UI testing and optional unit tests.

## Manual Test Cases

### Test 1: Clean Product Images (No Paperwork)
**Setup:**
- Upload 3 images of product only (no packaging, manuals, or tags visible)

**Steps:**
1. Select fixture images in notebook UI
2. Run analysis phase
3. Navigate to generation phase

**Expected Results:**
- ✓ Analysis returns `hasPaperwork: false`
- ✓ No warning appears in GenerationPhase
- ✓ Button shows "Generate X Images" (normal state)
- ✓ Generation proceeds normally on click

---

### Test 2: Single Image with Barcode/Price Tag
**Setup:**
- Upload image with visible barcode, price tag, or product sticker

**Steps:**
1. Select fixture image with barcode
2. Run analysis phase
3. Observe analysis results
4. Navigate to generation phase
5. Click "Continue" button

**Expected Results:**
- ✓ Analysis returns `hasPaperwork: true`
- ✓ `paperworkDetails` mentions "barcode" or "tag"
- ✓ Red warning Alert appears at top of GenerationPhase
- ✓ Warning displays specific paperwork details
- ✓ Button shows "Continue" instead of "Generate X Images"
- ✓ Single click dismisses warning AND starts generation
- ✓ Warning doesn't reappear for same analysis

---

### Test 3: Multi-Image Batch (Mixed Clean + Paperwork)
**Setup:**
- Image 1: Clean product shot (no paperwork)
- Image 2: Product with instruction manual visible in background

**Steps:**
1. Upload both images
2. Run analysis phase
3. Check merged analysis results
4. Navigate to generation phase

**Expected Results:**
- ✓ Analysis returns `hasPaperwork: true` (OR logic - any detection triggers)
- ✓ `paperworkDetails` mentions "manual" or "instruction"
- ✓ Warning appears in UI
- ✓ Details may reference multiple paperwork sources if detected

---

### Test 4: Warning Persistence Across UI Changes
**Setup:**
- Analysis with paperwork detected

**Steps:**
1. Trigger paperwork warning (see Test 2)
2. Click "Continue" to dismiss
3. Change template selection in dropdown
4. Change generation config (number of images, aspect ratio)
5. Verify warning state

**Expected Results:**
- ✓ Warning stays dismissed after clicking "Continue"
- ✓ Button returns to "Generate X Images" after dismissal
- ✓ Changing template doesn't re-show warning
- ✓ Changing config doesn't re-show warning
- ✓ Warning state persists for this specific analysis

---

### Test 5: Warning Reset on Analysis Switch
**Setup:**
- Two analyses: one with paperwork, one without

**Steps:**
1. Run Analysis #1 with paperwork → warning appears
2. Click "Continue" → warning dismissed
3. Switch to Analysis #2 (clean images) → no warning expected
4. Switch back to Analysis #1

**Expected Results:**
- ✓ Warning reappears when returning to Analysis #1
- ✓ Must click "Continue" again (dismissed state was cleared)
- ✓ Switching between analyses doesn't carry over dismissed state

---

### Test 6: Complex Paperwork Detection
**Setup:**
- Image with multiple paperwork elements (box, barcode, manual)

**Steps:**
1. Upload image with cardboard box, visible barcode, and instruction sheet
2. Run analysis

**Expected Results:**
- ✓ Analysis detects multiple paperwork items
- ✓ `paperworkDetails` concatenates descriptions: "cardboard box; barcode; instruction manual"
- ✓ Warning displays comprehensive details

---

## Unit Tests (Optional)

Create `prompt-bench/core/__tests__/consensus-paperwork.test.ts`:

```typescript
import { describe, it, expect } from 'bun:test';
import { mergeAnalysisResults } from '../consensus';
import type { ProductAnalysis } from '@/types/analysis';

describe('mergeAnalysisResults - paperwork detection', () => {
  it('should detect paperwork when any image has it (OR logic)', () => {
    const results: ProductAnalysis[] = [
      {
        product: 'tumbler',
        color: 'white',
        material: 'stainless steel',
        shape: 'cylindrical',
        features: ['vacuum sealed'],
        hasScaleReference: false,
        hasPaperwork: false
      },
      {
        product: 'tumbler',
        color: 'white',
        material: 'stainless steel',
        shape: 'cylindrical',
        features: ['vacuum sealed'],
        hasScaleReference: false,
        hasPaperwork: true,
        paperworkDetails: 'cardboard box visible behind product'
      }
    ];

    const merged = mergeAnalysisResults(results);

    expect(merged.hasPaperwork).toBe(true);
    expect(merged.paperworkDetails).toBe('cardboard box visible behind product');
  });

  it('should concatenate multiple paperwork descriptions', () => {
    const results: ProductAnalysis[] = [
      {
        product: 'tumbler',
        color: 'white',
        material: 'stainless steel',
        shape: 'cylindrical',
        features: [],
        hasScaleReference: false,
        hasPaperwork: true,
        paperworkDetails: 'barcode sticker on bottom'
      },
      {
        product: 'tumbler',
        color: 'white',
        material: 'stainless steel',
        shape: 'cylindrical',
        features: [],
        hasScaleReference: false,
        hasPaperwork: true,
        paperworkDetails: 'instruction manual in background'
      }
    ];

    const merged = mergeAnalysisResults(results);

    expect(merged.hasPaperwork).toBe(true);
    expect(merged.paperworkDetails).toContain('barcode sticker');
    expect(merged.paperworkDetails).toContain('instruction manual');
  });

  it('should handle no paperwork detected', () => {
    const results: ProductAnalysis[] = [
      {
        product: 'tumbler',
        color: 'white',
        material: 'stainless steel',
        shape: 'cylindrical',
        features: [],
        hasScaleReference: false,
        hasPaperwork: false
      }
    ];

    const merged = mergeAnalysisResults(results);

    expect(merged.hasPaperwork).toBe(false);
    expect(merged.paperworkDetails).toBeUndefined();
  });
});
```

Run with: `bun test prompt-bench/core/__tests__/consensus-paperwork.test.ts`

---

## Verification Checklist

### Backend Validation
- [ ] TypeScript compilation passes: `bun typecheck`
- [ ] No runtime errors when running analysis
- [ ] Analysis returns `hasPaperwork` and `paperworkDetails` fields
- [ ] Consensus merger correctly implements OR logic

### UI Validation
- [ ] Warning appears only when `hasPaperwork: true`
- [ ] Warning uses red Alert (destructive variant)
- [ ] Button text changes to "Continue"
- [ ] Single click proceeds to generation
- [ ] Warning persists across template changes
- [ ] Warning resets when switching analysis runs
- [ ] Layout doesn't break on mobile viewports

### User Experience
- [ ] Warning message is clear and actionable
- [ ] Paperwork details provide useful context
- [ ] Button behavior is predictable and consistent
- [ ] No confusing double-click requirements
- [ ] User can proceed despite warning (not blocked)

### Edge Cases
- [ ] No errors when analysis missing paperwork fields
- [ ] Warning handles undefined `paperworkDetails` gracefully
- [ ] Multiple rapid clicks don't trigger multiple generations
- [ ] State doesn't leak between different sessions

---

## Troubleshooting

### Issue: Warning doesn't appear
**Check:**
1. Analysis actually returned `hasPaperwork: true`
2. `selectedAnalysis` is finding correct analysis run
3. `showPaperworkWarning` computed value is true
4. React DevTools shows correct component state

### Issue: Warning appears for clean images (false positive)
**Check:**
1. Gemini prompt clarity - may need to refine detection instructions
2. Analysis results - review what triggered `hasPaperwork: true`
3. Consensus logic - verify OR semantics are correct

### Issue: Button doesn't proceed on click
**Check:**
1. `handleDismissPaperworkWarning` callback is called
2. `handleRun()` is invoked inside callback
3. No errors in browser console
4. `isRunning` or `!templateSlug` aren't blocking execution

### Issue: Warning persists after dismissal
**Check:**
1. `setDismissedPaperworkWarnings` is updating state
2. `parentRunId` is stable (not changing unexpectedly)
3. `showPaperworkWarning` logic includes dismissed check

---

## Acceptance Criteria

- [ ] All 6 manual test cases pass
- [ ] Unit tests pass (if implemented)
- [ ] No console errors during testing
- [ ] UI matches design requirements (red warning, correct text)
- [ ] State management works correctly across all scenarios
- [ ] False positive rate is acceptable (<10% for typical product images)

## Dependencies
All previous tasks (01-04) must be completed before testing can begin.
