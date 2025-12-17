# Batch Report: multi-angle-hybrid-20251217-uol8me

Generated: 2025-12-17T18:52:57.779Z

## AI-Powered Insights

Cost: $0.0100

### Key Findings

- View angle dramatically impacts generation quality - three-quarter view (8.7) and front-on-model (8.2) significantly outperform flat-lay (6.2) and back view (7.2), suggesting certain angles are more challenging for the AI model
- Strong overall performance with 80% of prompts scoring 8+ and mean of 7.62, indicating the base prompt structure with professional photography specifications is highly effective
- Flat-lay view shows the largest performance drop (6.2/10), likely due to AI difficulty in rendering proper perspective and natural bag positioning from above
- Detail-fabric view performs moderately well (7.8) but may lack specificity - the prompt doesn't clearly define which fabric details to highlight or how to frame them effectively

### Recommendations

- Avoid flat-lay angles for tote bags or add specific positioning instructions like 'artfully arranged flat with handles spread naturally' and 'shot from directly overhead at 90-degree angle'
- Enhance the detail-fabric prompt by specifying exact details to capture: 'close-up of fabric texture and weave pattern' or 'detail shot of stitching and material quality at handle attachment point'
- Prioritize three-quarter and front-facing angles in multi-angle sets as they consistently generate higher quality results for bag products
- For back view improvements, add descriptive elements like 'showing back panel construction and seam details' to give the AI more specific visual guidance

### Next Steps

- Test alternative flat-lay formulations with explicit positioning instructions and compare against the current 6.2 baseline to determine if this angle can be salvaged
- Run A/B tests on detail shots with specific fabric elements mentioned versus generic 'detail-fabric' to optimize close-up generation quality

## Summary Statistics

- Tests: 5
- Mean Score: 7.62/10
- Std Dev: 0.97
- Median: 7.8
- Min: 6.2
- Max: 8.7

## Score Distribution

- 1-3 (Poor): 0 (0%)
- 4-5 (Below Avg): 0 (0%)
- 6-7 (Average): 1 (20%)
- 8-9 (Good): 4 (80%)
- 10 (Excellent): 0 (0%)

## Detailed Cost Breakdown (Per Test)

| Test # | Score | Generation Model | Input Tokens | Output Tokens | Generation Cost | Evaluation Model | Evaluation Cost | Total |
|--------|-------|------------------|--------------|---------------|-----------------|------------------|-----------------|-------|
| 1 | 8.2/10 | - | 1,483 | 1,287 | $0.15592 | claude-sonnet-4-20250514 | $0.00820 | $0.16412 |
| 2 | 8.7/10 | - | 1,842 | 1,286 | $0.15616 | claude-sonnet-4-20250514 | $0.00833 | $0.16449 |
| 3 | 7.2/10 | - | 2,195 | 1,301 | $0.15832 | claude-sonnet-4-20250514 | $0.00849 | $0.16681 |
| 4 | 7.8/10 | - | 2,552 | 1,284 | $0.15663 | claude-sonnet-4-20250514 | $0.00830 | $0.16493 |
| 5 | 6.2/10 | - | 2,909 | 1,292 | $0.15795 | claude-sonnet-4-20250514 | $0.00861 | $0.16656 |

**Total Generation Cost:** $0.78498
**Total Evaluation Cost:** $0.04193
**Grand Total:** $0.82691

## Test Results (5 tests)

### Test 1: 8.7/10
- Generated: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/8795d7dd-63d0-4c1a-a4ca-a27f871b6d8f.png
- Prompt: Generate image 2/5: three-quarter view view.
This must be distinctly different from any previous images.
Professional photo of Tote bag from three-quarter view, on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

### Test 2: 8.2/10
- Generated: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/4482d235-b12d-4801-bb19-c539f6b70f6e.png
- Prompt: Generate image 1/5: front-on-model view.
This must be distinctly different from any previous images.
Professional photo of Tote bag from front-on-model, on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

### Test 3: 7.8/10
- Generated: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/f5209a86-c47e-4eff-a540-2c366eb486dd.png
- Prompt: Generate image 4/5: detail-fabric view.
This must be distinctly different from any previous images.
Professional photo of Tote bag from detail-fabric, on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

### Test 4: 7.2/10
- Generated: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/30d8accf-7036-483d-bcda-e746f786ae8a.png
- Prompt: Generate image 3/5: back view.
This must be distinctly different from any previous images.
Professional photo of Tote bag from back, on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

### Test 5: 6.2/10
- Generated: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/a204d304-97b2-4e5e-9321-74986b411963.png
- Prompt: Generate image 5/5: flat-lay view.
This must be distinctly different from any previous images.
Professional photo of Tote bag from flat-lay, on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

## Cost Summary

- Generation: $0.7850
- Evaluation: $0.0419
- Insights: $0.0100
- Total: $0.8369
