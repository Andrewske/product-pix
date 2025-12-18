# Batch Report: multi-angle-hybrid-20251217-np2kln

Generated: 2025-12-17T20:56:14.873Z

## AI-Powered Insights

Cost: $0.0098

### Key Findings

- Extremely small sample size (only 2 tests) makes statistical analysis unreliable - standard deviation of 0.35 and range of 0.5 points suggests minimal variation
- Both prompts achieved consistently high scores (8.2-8.7) indicating the base prompt structure is very effective for e-commerce product photography
- Three-quarter view angle outperformed front-on-model view by 0.5 points, suggesting certain viewing angles may be more commercially appealing
- The standardized technical photography parameters (85mm lens, f/8, 4K resolution, 85% frame fill) appear to be well-optimized across both prompts
- Both prompts use identical technical specifications with only the viewing angle differing, yet produce measurably different quality scores

### Recommendations

- Significantly expand the test batch size to at least 10-20 prompts to generate statistically meaningful insights and identify true performance patterns
- Test additional viewing angles beyond front-on-model and three-quarter view (such as flat lay, side profile, back view, or angled-with-shadow) to find optimal perspectives
- Experiment with model presentation variations for the front-on-model view, such as different poses, hand positions, or model positioning to improve its lower performance
- Remove the redundant 'view view' phrasing in the three-quarter prompt and test if cleaner wording maintains or improves the high score
- A/B test the 85% frame fill parameter against other percentages (75%, 90%, 95%) to optimize product prominence in the frame

### Next Steps

- Create a comprehensive viewing angle experiment testing 6-8 different product perspectives using the same technical parameters to establish a ranking of most effective angles
- Design a batch of 15-20 prompts with systematic variations in model poses, lighting descriptions, and camera angles to build a more robust performance dataset

## Summary Statistics

- Tests: 2
- Mean Score: 8.45/10
- Std Dev: 0.35
- Median: 8.4
- Min: 8.2
- Max: 8.7

## Score Distribution

- 1-3 (Poor): 0 (0%)
- 4-5 (Below Avg): 0 (0%)
- 6-7 (Average): 0 (0%)
- 8-9 (Good): 2 (100%)
- 10 (Excellent): 0 (0%)

## Detailed Cost Breakdown (Per Test)

| Test # | Score | Generation Model | Input Tokens | Output Tokens | Generation Cost | Evaluation Model | Evaluation Cost | Total |
|--------|-------|------------------|--------------|---------------|-----------------|------------------|-----------------|-------|
| 1 | 8.2/10 | - | 695 | 1,275 | $0.15370 | claude-sonnet-4-20250514 | $0.00867 | $0.16237 |
| 2 | 8.7/10 | - | 1,054 | 1,289 | $0.15573 | claude-sonnet-4-20250514 | $0.00881 | $0.16454 |

**Total Generation Cost:** $0.30943
**Total Evaluation Cost:** $0.01748
**Grand Total:** $0.32691

## Test Results (2 tests)

### Test 1: 8.7/10
- Generated: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/b6768e08-756f-415f-9dcf-500f0d20db00.png
- Prompt: Generate image 2/2: three-quarter view view.
This must be distinctly different from any previous images.
Professional photo of Tote bag from three-quarter view, on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

### Test 2: 8.2/10
- Generated: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/2fc76c21-8c02-456a-94cf-ee989c0997e0.png
- Prompt: Generate image 1/2: front-on-model view.
This must be distinctly different from any previous images.
Professional photo of Tote bag from front-on-model, on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

## Cost Summary

- Generation: $0.3094
- Evaluation: $0.0175
- Insights: $0.0098
- Total: $0.3367
