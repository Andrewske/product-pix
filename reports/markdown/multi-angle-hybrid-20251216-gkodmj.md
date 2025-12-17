# Batch Report: multi-angle-hybrid-20251216-gkodmj

Generated: 2025-12-16T22:31:12.964Z

## AI-Powered Insights

Cost: $0.0100

### Key Findings

- Camera angle significantly impacts performance - front and three-quarter views consistently score 8.7/10 while back views drop to 7.8-8.4/10, indicating customer preference for face-forward product visibility
- Extremely tight score distribution (0.39 std dev) with all prompts in 'Good' range suggests the core prompt template is highly optimized and stable
- Adding descriptive phrases like 'of the lego figurine' appears to slightly improve back view performance (8.4 vs 7.8) but has no impact on front views
- No prompts achieved excellence (10/10), indicating room for refinement despite strong baseline performance
- The 0.9 point gap between best and worst performing angles represents significant optimization potential

### Recommendations

- Prioritize front and three-quarter view angles for Lego Minifigure photography as they consistently outperform back views by 0.3-0.9 points
- For unavoidable back view shots, include descriptive clarifiers like 'of the lego figurine' to boost performance from 7.8 to 8.4
- Test lighting modifications to break the 8.7 ceiling - experiment with 'key light with subtle rim lighting' or 'multi-point studio lighting setup'
- Investigate composition alternatives like 'product centered filling 90% of frame' or 'slight upward camera angle' to push scores above 8.7
- Consider adding material-specific descriptors like 'highlighting plastic texture and vibrant colors' for Lego products

### Next Steps

- Run a lighting variation test using the best-performing front view prompt as baseline, testing 3-4 different lighting setups to break the 8.7 score ceiling
- Create an angle-specific optimization batch testing different descriptive phrases and composition adjustments for back views to close the performance gap

## Summary Statistics

- Tests: 5
- Mean Score: 8.46/10
- Std Dev: 0.39
- Median: 8.7
- Min: 7.8
- Max: 8.7

## Score Distribution

- 1-3 (Poor): 0 (0%)
- 4-5 (Below Avg): 0 (0%)
- 6-7 (Average): 0 (0%)
- 8-9 (Good): 5 (100%)
- 10 (Excellent): 0 (0%)

## Detailed Cost Breakdown (Per Test)

| Test # | Score | Generation Model | Input Tokens | Output Tokens | Generation Cost | Evaluation Model | Evaluation Cost | Total |
|--------|-------|------------------|--------------|---------------|-----------------|------------------|-----------------|-------|
| 1 | 8.7/10 | - | 337 | 1,295 | $0.15574 | claude-sonnet-4-20250514 | $0.00856 | $0.16430 |
| 2 | 8.4/10 | - | 337 | 1,256 | $0.15106 | claude-sonnet-4-20250514 | $0.00856 | $0.15962 |
| 3 | 8.7/10 | - | 332 | 1,291 | $0.15525 | claude-sonnet-4-20250514 | $0.00836 | $0.16361 |
| 4 | 8.7/10 | - | 335 | 1,309 | $0.15742 | claude-sonnet-4-20250514 | $0.00855 | $0.16597 |
| 5 | 7.8/10 | - | 332 | 1,297 | $0.15597 | claude-sonnet-4-20250514 | $0.00866 | $0.16463 |

**Total Generation Cost:** $0.77544
**Total Evaluation Cost:** $0.04269
**Grand Total:** $0.81813

## Test Results (5 tests)

### Test 1: 8.7/10
- Generated: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/0405963f-34bb-4c41-a3b7-412522226c84.png
- Source: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/sources/601b513287e9a8a935e5eb3b9c3713a697aa763faa4cde55c330cc979e527fcc.jpg
- Prompt: Professional photo of Lego Minifigure from front view of the lego figurine., on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

### Test 2: 8.7/10
- Generated: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/0526dba4-949f-4914-8934-2505163dd53f.png
- Source: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/sources/601b513287e9a8a935e5eb3b9c3713a697aa763faa4cde55c330cc979e527fcc.jpg
- Prompt: Professional photo of Lego Minifigure from front, on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

### Test 3: 8.7/10
- Generated: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/77430aea-bb75-4d62-87d3-ee4e32342559.png
- Source: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/sources/601b513287e9a8a935e5eb3b9c3713a697aa763faa4cde55c330cc979e527fcc.jpg
- Prompt: Professional photo of Lego Minifigure from three-quarter view, on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

### Test 4: 8.4/10
- Generated: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/fc89b7fb-b84f-4e78-9683-a1a0041b959b.png
- Source: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/sources/a41bd6ab3ed366a7a9471fd07c2046e21be51d407d76cf1748f42892fad7a852.jpg
- Prompt: Professional photo of Lego Minifigure from back view of the lego figurine., on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

### Test 5: 7.8/10
- Generated: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/f69be35a-334b-43f1-b99a-550a60d1485d.png
- Source: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/sources/601b513287e9a8a935e5eb3b9c3713a697aa763faa4cde55c330cc979e527fcc.jpg
- Prompt: Professional photo of Lego Minifigure from back, on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

## Cost Summary

- Generation: $0.7754
- Evaluation: $0.0427
- Insights: $0.0100
- Total: $0.8281
