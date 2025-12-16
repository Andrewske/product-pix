# Comparison Report: multi-angle-hybrid-20251216-02q6u2 vs multi-angle-hybrid-20251216-62w9gn

Generated: 2025-12-16T20:11:30.877Z

## AI-Powered Insights

Cost: $0.0108

### Key Findings

- The 45-degree angle requirement shows catastrophic failure (3.2/10) compared to front angles (8.7/10), suggesting AI struggles with specific geometric angle instructions
- Product-specific angle requirements perform inconsistently - 'front-on-model' for tote bags works well (8.7/10) while 'front' for electric guitars fails (4.2/10)
- Undefined angle requirements produce polarized results, scoring both highest (8.7/10) and lowest (4.2/10), indicating high variance when AI has creative freedom
- Strong clustering around good scores (14/25 tests in 8-9 range) suggests the base prompt template is solid but specific angle/product combinations cause failures
- Performance degraded vs baseline (-0.5 points) but not significantly, indicating the multi-angle approach needs refinement rather than abandonment

### Recommendations

- Replace precise geometric angles like '45-degree' with descriptive alternatives like 'diagonal view' or 'three-quarter angle' that are more intuitive for AI interpretation
- Implement product-specific angle mappings - avoid 'front' angles for electric guitars, prefer 'front-on-model' for wearable accessories like tote bags
- Add fallback instructions when using 'undefined' requirements, such as 'choose the most visually appealing primary angle for this product category'
- Include product orientation context in prompts, especially for complex shapes like guitars that may need 'upright front view' rather than just 'front'
- Test intermediate angle descriptors like 'slight angle' or 'subtle rotation' instead of specific degree measurements

### Next Steps

- Run targeted A/B test comparing geometric angle terms ('45-degree', '90-degree') vs descriptive terms ('diagonal', 'side profile', 'three-quarter') across the same product set
- Create product category-specific angle preference matrix by testing 5-10 angles per product type to identify optimal defaults for each category

## Comparison Summary

### Baseline: multi-angle-hybrid-20251216-62w9gn
- Mean Score: 7.74/10
- Tests: 5
- Std Dev: 1.98

### Candidate: multi-angle-hybrid-20251216-02q6u2
- Mean Score: 7.24/10
- Tests: 25
- Std Dev: 1.61

### Analysis
- Mean Difference: -0.500
- p-value: 0.5961
- Significant: No
- Effect Size: 0.30 (small)
- 95% CI: [-2.349, 1.349]

## Summary Statistics

- Tests: 25
- Mean Score: 7.24/10
- Std Dev: 1.61
- Median: 8.2
- Min: 3.2
- Max: 8.7

## Score Distribution

- 1-3 (Poor): 0 (0%)
- 4-5 (Below Avg): 3 (12%)
- 6-7 (Average): 8 (32%)
- 8-9 (Good): 14 (56%)
- 10 (Excellent): 0 (0%)

## Detailed Cost Breakdown (Per Test)

| Test # | Score | Generation Model | Input Tokens | Output Tokens | Generation Cost | Evaluation Model | Evaluation Cost | Total |
|--------|-------|------------------|--------------|---------------|-----------------|------------------|-----------------|-------|
| 1 | 8.7/10 | - | 349 | 1,274 | $0.15323 | claude-sonnet-4-20250514 | $0.00859 | $0.16182 |
| 2 | 8.3/10 | - | 349 | 1,286 | $0.15467 | claude-sonnet-4-20250514 | $0.00870 | $0.16337 |
| 3 | 8.4/10 | - | 345 | 1,287 | $0.15479 | claude-sonnet-4-20250514 | $0.00877 | $0.16356 |
| 4 | 4.2/10 | - | 345 | 1,362 | $0.16379 | claude-sonnet-4-20250514 | $0.00875 | $0.17254 |
| 5 | 8.6/10 | - | 345 | 1,266 | $0.15227 | claude-sonnet-4-20250514 | $0.00911 | $0.16138 |
| 6 | 8.7/10 | - | 347 | 1,287 | $0.15479 | claude-sonnet-4-20250514 | $0.00895 | $0.16374 |
| 7 | 3.2/10 | - | 351 | 1,399 | $0.16823 | claude-sonnet-4-20250514 | $0.00932 | $0.17755 |
| 8 | 8.7/10 | - | 347 | 1,270 | $0.15275 | claude-sonnet-4-20250514 | $0.00908 | $0.16183 |
| 9 | 8.7/10 | - | 347 | 1,289 | $0.15503 | claude-sonnet-4-20250514 | $0.00853 | $0.16356 |
| 10 | 8.7/10 | - | 347 | 1,266 | $0.15227 | claude-sonnet-4-20250514 | $0.00874 | $0.16101 |
| 11 | 4.2/10 | - | 345 | 1,375 | $0.16535 | claude-sonnet-4-20250514 | $0.00873 | $0.17408 |
| 12 | 8.2/10 | - | 349 | 1,293 | $0.15551 | claude-sonnet-4-20250514 | $0.00825 | $0.16376 |
| 13 | 6.2/10 | - | 345 | 1,361 | $0.16367 | claude-sonnet-4-20250514 | $0.00860 | $0.17227 |
| 14 | 6.2/10 | - | 345 | 1,329 | $0.15983 | claude-sonnet-4-20250514 | $0.00873 | $0.16856 |
| 15 | 6.2/10 | - | 345 | 1,273 | $0.15311 | claude-sonnet-4-20250514 | $0.00854 | $0.16165 |
| 16 | 6.8/10 | - | 344 | 1,289 | $0.15502 | claude-sonnet-4-20250514 | $0.00886 | $0.16388 |
| 17 | 6.8/10 | - | 348 | 1,278 | $0.15371 | claude-sonnet-4-20250514 | $0.00864 | $0.16235 |
| 18 | 8.3/10 | - | 344 | 1,279 | $0.15382 | claude-sonnet-4-20250514 | $0.00829 | $0.16211 |
| 19 | 6.1/10 | - | 344 | 1,294 | $0.15562 | claude-sonnet-4-20250514 | $0.00898 | $0.16460 |
| 20 | 6.2/10 | - | 344 | 1,320 | $0.15874 | claude-sonnet-4-20250514 | $0.00889 | $0.16763 |
| 21 | 8.3/10 | - | 345 | 1,264 | $0.15203 | claude-sonnet-4-20250514 | $0.00848 | $0.16051 |
| 22 | 7.8/10 | - | 349 | 1,272 | $0.15299 | claude-sonnet-4-20250514 | $0.00860 | $0.16159 |
| 23 | 8.4/10 | - | 345 | 1,282 | $0.15419 | claude-sonnet-4-20250514 | $0.00866 | $0.16285 |
| 24 | 8.3/10 | - | 345 | 1,264 | $0.15203 | claude-sonnet-4-20250514 | $0.00886 | $0.16089 |
| 25 | 6.8/10 | - | 345 | 1,366 | $0.16427 | claude-sonnet-4-20250514 | $0.00853 | $0.17280 |

**Total Generation Cost:** $3.91171
**Total Evaluation Cost:** $0.21818
**Grand Total:** $4.12989

## Comparison Results

### Top 5 Results from multi-angle-hybrid-20251216-62w9gn

#### 1. 4.2/10
- Image: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/6f163efe-5932-44a7-a3c5-5e13799d9070.png
- Source: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/sources/601b513287e9a8a935e5eb3b9c3713a697aa763faa4cde55c330cc979e527fcc.jpg
- Prompt: Professional photo of Lego Minifigure. Required: front. For remaining images, choose creative angles appropriate for this product type., on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

#### 2. 8.7/10
- Image: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/6c1321f8-ba38-4686-ba5c-100412f9e65b.png
- Source: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/sources/a41bd6ab3ed366a7a9471fd07c2046e21be51d407d76cf1748f42892fad7a852.jpg
- Prompt: Professional photo of Lego Minifigure. Required: three-quarter view. For remaining images, choose creative angles appropriate for this product type., on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

#### 3. 8.7/10
- Image: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/07e6aff8-8ba2-4846-a57a-7a1ae35da765.png
- Source: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/sources/601b513287e9a8a935e5eb3b9c3713a697aa763faa4cde55c330cc979e527fcc.jpg
- Prompt: Professional photo of Lego Minifigure. Required: undefined. For remaining images, choose creative angles appropriate for this product type., on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

#### 4. 8.4/10
- Image: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/076a7595-a692-43a8-ab07-38fa8758e244.png
- Source: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/sources/a41bd6ab3ed366a7a9471fd07c2046e21be51d407d76cf1748f42892fad7a852.jpg
- Prompt: Professional photo of Lego Minifigure. Required: undefined. For remaining images, choose creative angles appropriate for this product type., on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

#### 5. 8.7/10
- Image: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/f2d62430-6a88-446f-8c0c-aa75b9e19923.png
- Source: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/sources/601b513287e9a8a935e5eb3b9c3713a697aa763faa4cde55c330cc979e527fcc.jpg
- Prompt: Professional photo of Lego Minifigure. Required: undefined. For remaining images, choose creative angles appropriate for this product type., on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

### Top 6 Results from multi-angle-hybrid-20251216-02q6u2

#### 1. 8.7/10
- Image: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/817d28a6-ed54-4343-b2bf-93c662bcd7bb.png
- Source: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/sources/831a44672345021b911d96c14ab7daa2eb8b3d22c4f7dce5f7eeb2b9fc44eb22.jpg
- Prompt: Professional photo of Tote bag. Required: front-on-model. For remaining images, choose creative angles appropriate for this product type., on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

#### 2. 8.3/10
- Image: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/dde45187-99ce-4a82-8c63-7e0b3d6e8563.png
- Source: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/sources/4f4de77236822a48a54767fe5aec686e262d723549b66eb2f49782d0aab528a1.jpg
- Prompt: Professional photo of Tote bag. Required: 45-degree. For remaining images, choose creative angles appropriate for this product type., on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

#### 3. 8.4/10
- Image: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/7cc96e95-a59f-4cef-9c18-79cd62150522.png
- Source: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/sources/91db72364f0818bbe40d4c188d2b5fa01a775c732feea598556e491de0cf90a0.jpg
- Prompt: Professional photo of Tote bag. Required: undefined. For remaining images, choose creative angles appropriate for this product type., on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

#### 4. 4.2/10
- Image: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/c7932448-7373-4dcc-9fda-2cfe3ea8295b.png
- Source: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/sources/fe8b199e810ade4d3c3fb3aa99f43da0f7372867f8b61c59a6a5ac65fe402816.jpg
- Prompt: Professional photo of Tote bag. Required: undefined. For remaining images, choose creative angles appropriate for this product type., on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

#### 5. 8.6/10
- Image: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/be5f9ab9-3565-4b6a-81a3-2cd84c9a7e1c.png
- Source: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/sources/84df826845c4d38c5fe60a2f2bdf4b4659ff1a5cb72a504ee50892d0cd3e6c22.jpg
- Prompt: Professional photo of Tote bag. Required: undefined. For remaining images, choose creative angles appropriate for this product type., on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

#### 6. 8.7/10
- Image: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/5687ae76-0ecb-438b-86a8-bfd427b6aa26.png
- Source: https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/sources/601b513287e9a8a935e5eb3b9c3713a697aa763faa4cde55c330cc979e527fcc.jpg
- Prompt: Professional photo of Lego Minifigure. Required: front. For remaining images, choose creative angles appropriate for this product type., on pure white seamless background, soft diffused studio lighting with soft fill, shot on DSLR with 85mm lens f/8, commercial catalog photography, color-accurate, 4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids

## Cost Summary

- Generation: $3.9117
- Evaluation: $0.2182
- Insights: $0.0108
- Total: $4.1407
