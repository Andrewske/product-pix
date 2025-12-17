# Batch Report: multi-angle-hybrid-20251216-62w9gn

Generated: 2025-12-16T20:02:56.579Z

## AI-Powered Insights

Cost: $0.0106

### Key Findings
- Strong overall performance with 80% of prompts scoring 8+ and a high mean of 7.74, indicating the base prompt structure is effective for Lego Minifigure photography
- Dramatic performance drop when specifying 'front' view (4.2/10) compared to 'three-quarter view' (8.7/10), suggesting front angles may be problematic for this product type
- Prompts with 'undefined' angle specification consistently achieve top scores (8.7/10), indicating AI performs better with creative freedom than rigid angle constraints
- High standard deviation (1.98) with a clear bimodal distribution - prompts either perform very well (8+) or poorly (4-5), with no middle-ground scores
- The single poor-performing prompt is an extreme outlier, dragging down the mean despite 80% of tests being high-quality

### Recommendations
- Avoid specifying 'front' view angles for Lego Minifigures and test other potentially problematic angles like 'back view' or 'top-down' to identify angle-specific issues
- Prioritize 'three-quarter view' or 'undefined' angle specifications for optimal results, as these consistently produce high-quality outputs
- Implement angle validation logic to flag or avoid angle specifications that historically perform poorly for specific product categories
- Test intermediate angle descriptions like 'slight angle' or 'dynamic perspective' to find the sweet spot between creative freedom and direction
- Consider product-specific angle recommendations - what works for Lego Minifigures may differ significantly for other product types

### Next Steps
- Run a comprehensive angle testing batch comparing 'front', 'back', 'side', 'three-quarter', and 'undefined' specifications across 10+ iterations to validate the front-view hypothesis
- Test the same angle specifications with different product types (electronics, clothing, toys) to determine if this is a Lego-specific issue or a broader pattern

## Summary Statistics

- Tests: 5
- Mean Score: 7.74/10
- Std Dev: 1.98
- Median: 8.7
- Min: 4.2
- Max: 8.7

## Score Distribution

- 1-3 (Poor): 0 (0%)
- 4-5 (Below Avg): 1 (25%)
- 6-7 (Average): 0 (0%)
- 8-9 (Good): 4 (100%)
- 10 (Excellent): 0 (0%)

## Detailed Cost Breakdown (Per Test)

| Test # | Score | Generation Model | Input Tokens | Output Tokens | Generation Cost | Evaluation Model | Evaluation Cost | Total |
|--------|-------|------------------|--------------|---------------|-----------------|------------------|-----------------|-------|
| 1 | 4.2/10 | - | 347 | 1,324 | $0.15923 | claude-sonnet-4-20250514 | $0.00931 | $0.16854 |
| 2 | 8.7/10 | - | 350 | 1,303 | $0.15671 | claude-sonnet-4-20250514 | $0.00878 | $0.16549 |
| 3 | 8.7/10 | - | 347 | 1,279 | $0.15383 | claude-sonnet-4-20250514 | $0.00928 | $0.16311 |
| 4 | 8.4/10 | - | 347 | 1,263 | $0.15191 | claude-sonnet-4-20250514 | $0.00889 | $0.16080 |
| 5 | 8.7/10 | - | 347 | 1,286 | $0.15467 | claude-sonnet-4-20250514 | $0.00884 | $0.16351 |

**Total Generation Cost:** $0.77635  
**Total Evaluation Cost:** $0.04510  
**Grand Total:** $0.82145

## Test Results (5 tests)

### Test 1: 8.7/10 (Good)
- Source: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/sources/a41bd6ab3ed366a7a9471fd07c2046e21be51d407d76cf1748f42892fad7a852.jpg
- Generated: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/6c1321f8-ba38-4686-ba5c-100412f9e65b.png
- Prompt: Professional photo of Lego Minifigure. Required: three-quarter view. For remaining images, choose creative angles appropriate for this product type., on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

### Test 2: 8.7/10 (Good)
- Source: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/sources/601b513287e9a8a935e5eb3b9c3713a697aa763faa4cde55c330cc979e527fcc.jpg
- Generated: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/07e6aff8-8ba2-4846-a57a-7a1ae35da765.png
- Prompt: Professional photo of Lego Minifigure. Required: undefined. For remaining images, choose creative angles appropriate for this product type., on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

### Test 3: 8.7/10 (Good)
- Source: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/sources/601b513287e9a8a935e5eb3b9c3713a697aa763faa4cde55c330cc979e527fcc.jpg
- Generated: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/f2d62430-6a88-446f-8c0c-aa75b9e19923.png
- Prompt: Professional photo of Lego Minifigure. Required: undefined. For remaining images, choose creative angles appropriate for this product type., on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

### Test 4: 8.4/10 (Good)
- Source: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/sources/a41bd6ab3ed366a7a9471fd07c2046e21be51d407d76cf1748f42892fad7a852.jpg
- Generated: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/076a7595-a692-43a8-ab07-38fa8758e244.png
- Prompt: Professional photo of Lego Minifigure. Required: undefined. For remaining images, choose creative angles appropriate for this product type., on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

### Test 5: 4.2/10 (Low)
- Source: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/sources/601b513287e9a8a935e5eb3b9c3713a697aa763faa4cde55c330cc979e527fcc.jpg
- Generated: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/6f163efe-5932-44a7-a3c5-5e13799d9070.png
- Prompt: Professional photo of Lego Minifigure. Required: front. For remaining images, choose creative angles appropriate for this product type., on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

## Cost Summary

- Generation: $0.7763
- Evaluation: $0.0451
- Insights: $0.0106
- Total: $0.8320