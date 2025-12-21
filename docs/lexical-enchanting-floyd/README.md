# Paperwork Detection Warning for Notebook Sessions

## Overview

Add automatic detection of packaging materials, instruction manuals, barcodes, and other non-product items during the product analysis phase. When paperwork is detected, display a dismissible red warning in the notebook UI before image generation proceeds.

**Goal:** Prevent text hallucination in AI-generated product photos caused by packaging/documentation visible in source images.

**User Flow:**
1. User uploads product images (some may have packaging visible)
2. Analysis phase detects paperwork → sets `hasPaperwork: true`
3. Generation phase displays red warning: "Packaging or paperwork detected"
4. User clicks "Continue" button → warning dismissed, generation proceeds
5. Warning doesn't reappear for same analysis (per-analysis persistence)

---

## Task Sequence

Execute tasks in numerical order (01 → 05):

1. [01-extend-analysis-schema.md](./01-extend-analysis-schema.md) - Add `hasPaperwork` and `paperworkDetails` fields to `ProductAnalysis` interface
2. [02-implement-detection-logic.md](./02-implement-detection-logic.md) - Update Gemini analyzer Zod schema and analysis prompt to detect packaging/manuals/barcodes
3. [03-implement-consensus-merger.md](./03-implement-consensus-merger.md) - Add OR logic to consensus merger (any image with paperwork triggers warning)
4. [04-implement-ui-warning.md](./04-implement-ui-warning.md) - Implement warning display, button behavior, and state management in GenerationPhase component
5. [05-manual-testing.md](./05-manual-testing.md) - Validate complete workflow with manual test cases and optional unit tests

---

## Success Criteria

### Functional Requirements
- ✓ Analysis detects paperwork in product images
- ✓ Red warning appears in GenerationPhase when paperwork detected
- ✓ Button text changes from "Generate X Images" to "Continue"
- ✓ Single click on "Continue" dismisses warning AND starts generation
- ✓ Warning displays specific paperwork details from analysis
- ✓ Warning persists for same analysis across template/config changes
- ✓ Warning resets when user switches to different analysis run

### Technical Requirements
- ✓ TypeScript compilation passes (`bun typecheck`)
- ✓ No runtime errors in analysis or generation phases
- ✓ OR logic: any image with paperwork triggers `hasPaperwork: true`
- ✓ Consensus merger concatenates multiple paperwork descriptions
- ✓ UI uses existing shadcn Alert component (destructive variant)
- ✓ State management tracks dismissed warnings per analysis ID

### User Experience
- ✓ Warning message is clear and actionable
- ✓ Paperwork details provide useful context for user
- ✓ User can proceed despite warning (not blocked)
- ✓ No confusing multi-click requirements
- ✓ Layout doesn't break on mobile viewports

---

## Execution Instructions

### Prerequisites
- ProductPix codebase with notebook UI already functional
- Bun runtime installed for TypeScript compilation and testing
- Test fixture images with/without packaging materials

### Sequential Execution

1. **Start with Task 01** (schema extension) - This is the foundation
   - Modify `src/types/analysis.ts`
   - Run `bun typecheck` to verify no errors

2. **Continue with Task 02** (detection logic)
   - Update `product-analyzer.ts` and `AnalysisPhase.tsx`
   - Test analysis with sample images to verify `hasPaperwork` field appears

3. **Proceed to Task 03** (consensus merger)
   - Modify `consensus.ts`
   - Test with multi-image batches to verify OR logic

4. **Implement Task 04** (UI warning)
   - Update `GenerationPhase.tsx` in multiple sections
   - Test warning display and button behavior in browser

5. **Validate with Task 05** (testing)
   - Run all 6 manual test cases
   - Optionally create unit tests for consensus logic
   - Verify edge cases and state management

### Verification Between Tasks
After each task:
- Run `bun typecheck` to catch TypeScript errors early
- Test in notebook UI to verify incremental progress
- Check browser console for runtime errors

### Rollback Strategy
If a task fails:
- Revert file changes for that task only
- Fix issues before proceeding to next task
- Tasks are designed to be independent where possible

---

## Dependencies

### External Dependencies
- **Gemini API** (Google Generative AI) - used for vision-based analysis
- **shadcn/ui Alert component** - already in codebase, used for warning display
- **React hooks** (useState, useCallback, useEffect) - standard React

### Internal Dependencies
- **Existing analysis pipeline** - tasks extend current workflow
- **ProductAnalysis type** - foundation for all detection logic
- **Consensus merger** - already handles scale/brand detection, adding paperwork follows same pattern

### Development Tools
- TypeScript compiler (`bun typecheck`)
- Bun test runner (for optional unit tests)
- React DevTools (for state inspection during manual testing)

---

## Risk Mitigation

| Risk | Mitigation Strategy |
|------|---------------------|
| **False positives** (product features mistaken for paperwork) | Tune prompt specificity during manual testing; provide clear examples of what constitutes paperwork |
| **State management bugs** (warning doesn't dismiss or persists incorrectly) | Thorough testing of all state transitions; use React DevTools to inspect Set updates |
| **Type errors** (schema changes break existing code) | TypeScript compiler catches issues; run `bun typecheck` after each schema change |
| **UI layout issues** (warning breaks responsive design) | Use existing Alert component patterns; test on mobile viewport |
| **Performance impact** (additional analysis overhead) | Paperwork detection is part of existing Gemini call (no extra API requests); minimal overhead |

---

## Estimated Timeline

| Task | Duration | Cumulative |
|------|----------|------------|
| 01-extend-analysis-schema | 5 min | 5 min |
| 02-implement-detection-logic | 15 min | 20 min |
| 03-implement-consensus-merger | 10 min | 30 min |
| 04-implement-ui-warning | 25 min | 55 min |
| 05-manual-testing | 30 min | 85 min |

**Total: ~1.5 hours (90 minutes)**

*Times are estimates for experienced developer familiar with codebase.*

---

## Critical Files Reference

For quick navigation during implementation:

1. **Schema:** `src/types/analysis.ts` (lines 14-24)
2. **Analyzer:** `prompt-bench/core/product-analyzer.ts` (lines 190-200)
3. **Prompt:** `prompt-bench/ui/components/notebook/AnalysisPhase.tsx` (lines 61-108)
4. **Consensus:** `prompt-bench/core/consensus.ts` (lines 8-49)
5. **UI Warning:** `prompt-bench/ui/components/notebook/GenerationPhase.tsx` (multiple sections)

---

## Next Steps After Completion

1. **Monitor false positive rate** - collect feedback on detection accuracy
2. **Tune prompt if needed** - refine Gemini instructions based on real-world usage
3. **Consider CLI support** - currently notebook-only, may extend to batch runs
4. **Add analytics tracking** - track how often warning appears and dismissal rate
5. **Document in user guide** - explain why warning appears and how to avoid it
