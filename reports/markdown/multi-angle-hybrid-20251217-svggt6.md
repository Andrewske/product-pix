# Batch Report: multi-angle-hybrid-20251217-svggt6

Generated: 2025-12-17T18:58:47.853Z

## AI-Powered Insights

Cost: $0.0107

### Key Findings

- Three-quarter and back view angles significantly outperform other perspectives (8.3 and 8.2 vs 6.2-7.4), suggesting these angles provide optimal product showcase for tote bags
- Detail shots and flat-lay views perform poorly (both 6.2/10), indicating challenges with close-up fabric photography and overhead positioning for this product type
- Front-on-model view shows moderate performance (7.4/10), suggesting lifestyle context helps but may introduce complexity that affects image quality
- Tight score clustering (std dev 1.03, range 2.1) indicates consistent prompt structure with view angle being the primary differentiator
- No scores below 6.2 or above 8.3 suggests the base prompt template is solid but has limited upside potential without structural changes

### Recommendations

- Prioritize three-quarter and back view angles for tote bag photography as they consistently deliver highest scores
- Revise detail shot prompts to specify 'close-up of handles and stitching' or 'texture detail of main compartment' rather than generic 'detail-fabric' which may confuse the AI
- For flat-lay views, add specific instructions like 'tote bag laid flat with handles spread naturally' and consider reducing frame fill to 70% to accommodate the horizontal orientation
- Enhance on-model prompts by specifying model positioning: 'model holding tote bag by handles' or 'tote bag worn on shoulder' for clearer direction
- Consider adding 'no shadows on product' to lighting instructions for detail and flat-lay shots which may be suffering from unwanted shadow artifacts

### Next Steps

- Run A/B tests comparing current detail-fabric prompts against specific detail callouts (handles, stitching, logo placement) to improve close-up shot quality
- Test modified flat-lay prompts with reduced frame fill (70%) and specific handle positioning instructions to address the lowest-performing view angle

## Summary Statistics

- Tests: 5
- Mean Score: 7.26/10
- Std Dev: 1.03
- Median: 7.4
- Min: 6.2
- Max: 8.3

## Score Distribution

- 1-3 (Poor): 0 (0%)
- 4-5 (Below Avg): 0 (0%)
- 6-7 (Average): 2 (40%)
- 8-9 (Good): 3 (60%)
- 10 (Excellent): 0 (0%)

## Detailed Cost Breakdown (Per Test)

| Test # | Score | Generation Model | Input Tokens | Output Tokens | Generation Cost | Evaluation Model | Evaluation Cost | Total |
|--------|-------|------------------|--------------|---------------|-----------------|------------------|-----------------|-------|
| 1 | 7.4/10 | - | 686 | 1,270 | $0.15309 | claude-sonnet-4-20250514 | $0.00841 | $0.16150 |
| 2 | 8.3/10 | - | 1,045 | 1,264 | $0.15272 | claude-sonnet-4-20250514 | $0.00833 | $0.16105 |
| 3 | 8.2/10 | - | 1,398 | 1,281 | $0.15512 | claude-sonnet-4-20250514 | $0.00879 | $0.16391 |
| 4 | 6.2/10 | - | 1,755 | 1,264 | $0.15344 | claude-sonnet-4-20250514 | $0.00908 | $0.16252 |
| 5 | 6.2/10 | - | 2,112 | 1,266 | $0.15403 | claude-sonnet-4-20250514 | $0.00890 | $0.16293 |

**Total Generation Cost:** $0.76840
**Total Evaluation Cost:** $0.04351
**Grand Total:** $0.81191

## Test Results (5 tests)

### Test 1: 8.3/10
- Generated: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/0e22d93e-db9c-45d9-971a-17a1dc8284bb.png
- Prompt: Generate image 2/5: three-quarter view view.
This must be distinctly different from any previous images.
Professional photo of Tote bag from three-quarter view, on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

### Test 2: 8.2/10
- Generated: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/ec672bb0-72c6-42ad-926b-30d94b99e5de.png
- Prompt: Generate image 3/5: back view.
This must be distinctly different from any previous images.
Professional photo of Tote bag from back, on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

### Test 3: 7.4/10
- Generated: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/f0f766de-800f-489c-b998-175613677c01.png
- Prompt: Generate image 1/5: front-on-model view.
This must be distinctly different from any previous images.
Professional photo of Tote bag from front-on-model, on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

### Test 4: 6.2/10
- Generated: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/cd323640-8076-4806-8747-c5a16db5c075.png
- Prompt: Generate image 4/5: detail-fabric view.
This must be distinctly different from any previous images.
Professional photo of Tote bag from detail-fabric, on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

### Test 5: 6.2/10
- Generated: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/a4a1f1a9-d8aa-4f1f-8905-7d7b53624259.png
- Prompt: Generate image 5/5: flat-lay view.
This must be distinctly different from any previous images.
Professional photo of Tote bag from flat-lay, on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

## Cost Summary

- Generation: $0.7684
- Evaluation: $0.0435
- Insights: $0.0107
- Total: $0.8226
