# Run Stage 1 Experiment

## Files to Modify/Create
- None (operational task)

## Implementation Details

Execute Stage 1 pilot study to answer: **Does giving Gemini more reference angles improve output quality for novel viewpoints?**

### Experiment Design

| Condition | Input Images | Output | Expected N |
|-----------|--------------|--------|------------|
| A: Single | 1 image (front only) | 1 "45-degree elevated view on white" | 6 |
| B: Multi | 3 images (front, back, side) | 1 "45-degree elevated view on white" | 6 |

**Key insight:** Output angle is intentionally NOT in the input set. This tests whether additional reference angles help the model understand the product's 3D structure, not just copy an existing view.

Total: 12 generations, 12 per-image evaluations

**Note:** This is a pilot study (N=6 per condition). Results inform direction; we focus on effect magnitude rather than statistical significance.

### Execution Commands

```bash
# 1. Ensure templates are synced
bun bench sync

# 2. Run Stage 1 experiment
bun bench run --template ecommerce-base --batch fixtures/stage1-batch.json

# 3. Evaluate all generated images (per-image quality)
bun bench evaluate --label stage1-single-vs-multi-input

# 4. Generate report
bun bench report --label stage1-single-vs-multi-input
```

### Analysis Method

Compare the two conditions:

```bash
# Filter results by condition and compare
# (May need manual analysis or extend compare command)
```

**Metrics to compare:**
- Mean quality score (single input vs multi input)
- Standard deviation
- Per-product breakdown (does multi-input help more for complex products?)

### Expected Outcomes

| Outcome | Interpretation | Next Step |
|---------|----------------|-----------|
| Multi noticeably better (Δ ≥ 1.0) | Multi-image input adds value for 3D understanding | Proceed to Stage 2 with confidence |
| Small or no difference (Δ < 0.5) | Multi-image may not help much | Proceed to Stage 2, but temper expectations |
| Single better | Unexpected - investigate why | Debug before proceeding |

**Analysis approach:** Compare mean scores and effect magnitude. With N=6, focus on practical difference (is multi-input worth it?) rather than statistical significance.

## Acceptance Criteria

- [ ] All 12 tests complete successfully
- [ ] All 12 evaluations scored
- [ ] Report generated with comparison
- [ ] Decision documented: proceed to Stage 2 or pivot

## Dependencies

- Task 01 (Collection Evaluator) - for reference, though Stage 1 uses per-image eval
- Task 02 (Multi-Image Infrastructure) - to run multi-input tests
- Task 03 (Test Data) - need the images

## Output Artifacts

Document results in: `docs/joyful-splashing-flame/results/stage1-results.md`

```markdown
# Stage 1 Results (Pilot Study)

## Summary
- Single input mean: X.XX
- Multi input mean: X.XX
- Difference: +/- X.XX
- Effect magnitude: [Large/Moderate/Small/None]

## Per-Product Breakdown
| Product | Single | Multi | Delta |
|---------|--------|-------|-------|
| Suitcase | X.X | X.X | +X.X |
| ... | ... | ... | ... |

## Qualitative Observations
[What differences are visible? Does multi-input produce more accurate 3D structure?]

## Decision
Proceed to Stage 2: Yes/No

## Notes
[Any observations about quality differences, failure modes, etc.]
```
