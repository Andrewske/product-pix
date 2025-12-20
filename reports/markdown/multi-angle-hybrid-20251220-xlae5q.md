# Batch Report: multi-angle-hybrid-20251220-xlae5q

Generated: 2025-12-20T02:10:27.499Z

## AI-Powered Insights

Cost: $0.0101

### Key Findings

- Extremely high baseline performance with all prompts scoring in the 'Good' range (7.9-8.2), indicating strong foundational prompt structure for e-commerce product photography
- Very low variance (std dev 0.21) suggests consistent quality across different camera angles, with the multi-angle approach working reliably
- Three-quarter view angle (8.2) slightly outperformed front-on-model view (7.9), suggesting certain angles may be more effective for tote bag photography
- Complex multi-requirement prompts (scale, branding, technical specs) are being handled well without significant quality degradation
- Small sample size (2 tests) limits statistical significance but shows promising stability in the 8+ score range

### Recommendations

- Expand testing to include additional camera angles (side profile, overhead, detail shots) since three-quarter view showed marginal superiority
- Test variations in the scale reference implementation - try 'lifestyle context' or 'hand holding product' instead of generic 'hand-holdable size' language
- Experiment with lighting variations while maintaining the high baseline - try 'key light with rim lighting' or 'softbox setup' for potentially higher scores
- Simplify brand requirement language by testing 'visible EMINENT MIGLIORE logo placement' vs the current detailed branding instructions
- Test removing redundant phrases like 'single product view only, no collages or grids' to streamline prompt efficiency

### Next Steps

- Run expanded angle testing batch with 6-8 different views (including the successful three-quarter view) using identical technical parameters to identify optimal angle hierarchy
- Conduct A/B testing on the scale reference approach with lifestyle vs technical descriptions while maintaining the current high-performing prompt foundation

## Summary Statistics

- Tests: 2
- Mean Score: 8.05/10
- Std Dev: 0.21
- Median: 8.1
- Min: 7.9
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
| 1 | 7.9/10 | - | 755 | 1,322 | $0.16015 | claude-sonnet-4-20250514 | $0.00842 | $0.16857 |
| 2 | 8.2/10 | - | 1,638 | 1,313 | $0.16084 | claude-sonnet-4-20250514 | $0.00916 | $0.17000 |

**Total Generation Cost:** $0.32099
**Total Evaluation Cost:** $0.01758
**Grand Total:** $0.33857

## Test Results (2 tests)

### Test 1: 8.2/10
- Generated: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/c700b63c-04e4-467d-b8c2-6f5493208394.png
- Prompt: Generate image 2/2: three-quarter view view.
SCALE REQUIREMENT: Image 2 shows scale reference (hand-holdable size). Maintain exact same physical product dimensions in all generated images.
BRAND REQUIREMENT: Product shows "EMINENT
MIGLIORE" branding (metal plaque on front). Preserve this exact brand text and placement.
This must be distinctly different from any previous images.
Professional photo of Tote bag from three-quarter view, on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered at authentic scale (not scaled to fill frame), single product view only, no collages or grids

### Test 2: 7.9/10
- Generated: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/40d60311-46a5-4901-9740-020081e215f7.png
- Prompt: Generate image 1/2: front-on-model view.
SCALE REQUIREMENT: Image 2 shows scale reference (hand-holdable size). Maintain exact same physical product dimensions in all generated images.
BRAND REQUIREMENT: Product shows "EMINENT
MIGLIORE" branding (metal plaque on front). Preserve this exact brand text and placement.
This must be distinctly different from any previous images.
Professional photo of Tote bag from front-on-model, on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered at authentic scale (not scaled to fill frame), single product view only, no collages or grids

## Cost Summary

- Generation: $0.3210
- Evaluation: $0.0176
- Insights: $0.0101
- Total: $0.3487
