# Batch Report: multi-angle-hybrid-20251217-3p255s

Generated: 2025-12-17T21:17:16.200Z

## AI-Powered Insights

Cost: $0.0089

### Key Findings

- Extremely consistent performance with all scores clustering tightly between 8.1-8.2, indicating a well-optimized prompt template with minimal variance
- The three-quarter view angle slightly outperformed the front-on-model view (8.2 vs 8.1), suggesting certain viewing angles may be more effective for tote bag visualization
- The comprehensive technical specifications (DSLR settings, lighting, background) and scale requirements appear to be working well, producing consistently good results
- Small sample size (only 2 tests) limits statistical significance, but the narrow standard deviation (0.07) suggests the prompt formula is stable

### Recommendations

- Test additional viewing angles beyond front-on-model and three-quarter view to identify the optimal angle mix for tote bags
- Experiment with slight variations in the scale reference language since 'hand-holdable size' may be ambiguous - try more specific measurements or reference objects
- Consider testing different lens focal lengths (50mm, 105mm) alongside the current 85mm to see if this impacts scoring
- Add more specific material and texture descriptors for tote bags to potentially push scores above 8.2 into the 9+ range

### Next Steps

- Run a larger batch (10-20 tests) with the same prompt template to establish more reliable baseline statistics and confirm the consistency pattern
- Create A/B test comparing 'three-quarter view' against 'diagonal view' and 'side-angled view' since three-quarter performed better than front-facing

## Summary Statistics

- Tests: 2
- Mean Score: 8.15/10
- Std Dev: 0.07
- Median: 8.1
- Min: 8.1
- Max: 8.2

## Score Distribution

- 1-3 (Poor): 0 (0%)
- 4-5 (Below Avg): 0 (0%)
- 6-7 (Average): 0 (0%)
- 8-9 (Good): 2 (100%)
- 10 (Excellent): 0 (0%)

## Detailed Cost Breakdown (Per Test)

| Test # | Score | Generation Model | Input Tokens | Output Tokens | Generation Cost | Evaluation Model | Evaluation Cost | Total |
|--------|-------|------------------|--------------|---------------|-----------------|------------------|-----------------|-------|
| 1 | 8.1/10 | - | 726 | 1,275 | $0.15373 | claude-sonnet-4-20250514 | $0.00867 | $0.16240 |
| 2 | 8.2/10 | - | 1,116 | 1,267 | $0.15316 | claude-sonnet-4-20250514 | $0.00875 | $0.16191 |

**Total Generation Cost:** $0.30689
**Total Evaluation Cost:** $0.01742
**Grand Total:** $0.32431

## Test Results (2 tests)

### Test 1: 8.2/10
- Generated: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/13de6a0a-9f86-4dee-a21f-00926b5054de.png
- Prompt: Generate image 2/2: three-quarter view view.
SCALE REQUIREMENT: Image 2 shows scale reference (hand-holdable size). Maintain exact same physical product dimensions in all generated images.
This must be distinctly different from any previous images.
Professional photo of Tote bag from three-quarter view, on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered at authentic scale (not scaled to fill frame), single product view only, no collages or grids

### Test 2: 8.1/10
- Generated: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/57404158-7513-4801-9e96-e0768e1dd93d.png
- Prompt: Generate image 1/2: front-on-model view.
SCALE REQUIREMENT: Image 2 shows scale reference (hand-holdable size). Maintain exact same physical product dimensions in all generated images.
This must be distinctly different from any previous images.
Professional photo of Tote bag from front-on-model, on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered at authentic scale (not scaled to fill frame), single product view only, no collages or grids

## Cost Summary

- Generation: $0.3069
- Evaluation: $0.0174
- Insights: $0.0089
- Total: $0.3332
