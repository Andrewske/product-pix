# Batch Report: multi-angle-hybrid-20251218-reopgl

Generated: 2025-12-18T23:31:19.749Z

## AI-Powered Insights

Cost: $0.0100

### Key Findings

- Both prompts achieved good scores (7.4-8.1) with minimal variation, indicating the core prompt structure is solid and consistent
- Three-quarter view angle (8.1) outperformed front-on-model view (7.4) by 0.7 points, suggesting certain camera angles are more effective for tote bag photography
- The comprehensive multi-requirement approach (scale, brand, angle specifications) appears to work well, with no tests falling below the 'Good' category
- Small sample size (2 tests) limits statistical significance, but the tight score clustering suggests stable prompt performance
- Both prompts contain identical technical specifications and differ only in viewing angle, making this a clean A/B test of camera positioning

### Recommendations

- Prioritize three-quarter view angles for tote bags as they scored 9.5% higher than front-facing shots, likely due to better dimension visibility
- Test additional viewing angles (side profile, top-down, detail shots) to expand the successful angle repertoire beyond the current two options
- Consider removing redundant text like 'view view' in the three-quarter prompt to improve clarity and professionalism
- Experiment with different scale reference methods beyond 'hand-holdable size' to see if more specific references improve scoring
- Test the prompt structure with different product categories to validate if this multi-requirement format is universally effective

### Next Steps

- Run a larger batch (8-10 tests) testing 4-5 different camera angles for tote bags using the same technical specifications to identify the optimal viewing angle hierarchy
- Create A/B tests comparing the current detailed brand requirement format against simplified brand instructions to determine if the verbose specification is necessary for quality

## Summary Statistics

- Tests: 2
- Mean Score: 7.75/10
- Std Dev: 0.49
- Median: 7.8
- Min: 7.4
- Max: 8.1

## Score Distribution

- 1-3 (Poor): 0 (0%)
- 4-5 (Below Avg): 0 (0%)
- 6-7 (Average): 0 (0%)
- 8-9 (Good): 2 (100%)
- 10 (Excellent): 0 (0%)

## Detailed Cost Breakdown (Per Test)

| Test # | Score | Generation Model | Input Tokens | Output Tokens | Generation Cost | Evaluation Model | Evaluation Cost | Total |
|--------|-------|------------------|--------------|---------------|-----------------|------------------|-----------------|-------|
| 1 | 7.4/10 | - | 777 | 1,279 | $0.15426 | claude-sonnet-4-20250514 | $0.00956 | $0.16382 |
| 2 | 8.1/10 | - | 1,207 | 1,259 | $0.15229 | claude-sonnet-4-20250514 | $0.00879 | $0.16108 |

**Total Generation Cost:** $0.30655
**Total Evaluation Cost:** $0.01835
**Grand Total:** $0.32490

## Test Results (2 tests)

### Test 1: 8.1/10
- Generated: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/814ed587-273c-4ae1-806a-f043084bbeda.png
- Prompt: Generate image 2/2: three-quarter view view.
SCALE REQUIREMENT: Image 2 shows scale reference (hand-holdable size). Maintain exact same physical product dimensions in all generated images.
BRAND REQUIREMENT: Product shows "Tosca Blu" branding (The Tosca Blu logo is displayed on a metal plaque on the front of the bag.). Preserve this exact brand text and placement.
This must be distinctly different from any previous images.
Professional photo of Tote bag from three-quarter view, on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered at authentic scale (not scaled to fill frame), single product view only, no collages or grids

### Test 2: 7.4/10
- Generated: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/b46558de-9b31-454f-aefc-38964e57d75d.png
- Prompt: Generate image 1/2: front-on-model view.
SCALE REQUIREMENT: Image 2 shows scale reference (hand-holdable size). Maintain exact same physical product dimensions in all generated images.
BRAND REQUIREMENT: Product shows "Tosca Blu" branding (The Tosca Blu logo is displayed on a metal plaque on the front of the bag.). Preserve this exact brand text and placement.
This must be distinctly different from any previous images.
Professional photo of Tote bag from front-on-model, on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered at authentic scale (not scaled to fill frame), single product view only, no collages or grids

## Cost Summary

- Generation: $0.3065
- Evaluation: $0.0183
- Insights: $0.0100
- Total: $0.3349
