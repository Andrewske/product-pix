# Run Stage 2 Experiment

## Files to Modify/Create
- None (operational task)

## Implementation Details

Execute Stage 2 pilot study to answer: **Which variety strategy produces the best consistency + variety balance?**

**Note:** This is a pilot study (N=6 per strategy). Results inform direction; we focus on effect magnitude and qualitative differences rather than statistical significance.

### Experiment Design

| Strategy | Prompt Approach | Output Count |
|----------|-----------------|--------------|
| A: Category-based | Detect category → use research-backed angles for that category | 5 per product |
| B: AI-decided | "Generate 5 diverse angles for e-commerce" (no angle guidance) | 5 per product |
| C: Hybrid | First 2 angles from category, AI decides remaining 3 | 5 per product |

- 6 products × 3 strategies = 18 test runs
- 18 × 5 outputs = 90 generated images
- All tests use 3 input images (multi-input)

### Execution Commands

```bash
# 1. Run with category-based strategy template
bun bench run --template multi-angle-category-based --batch fixtures/stage2-batch-category-based.json

# 2. Run with AI-decided strategy template
bun bench run --template multi-angle-ai-decided --batch fixtures/stage2-batch-ai-decided.json

# 3. Run with hybrid strategy template
bun bench run --template multi-angle-hybrid --batch fixtures/stage2-batch-hybrid.json

# 4. Evaluate per-image quality for all
bun bench evaluate --label stage2-category-based
bun bench evaluate --label stage2-ai-decided
bun bench evaluate --label stage2-hybrid

# 5. Run collection-level evaluation (new evaluator)
bun bench evaluate-collection --label stage2-category-based
bun bench evaluate-collection --label stage2-ai-decided
bun bench evaluate-collection --label stage2-hybrid

# 6. Generate comparison reports
bun bench compare --baseline stage2-category-based --candidate stage2-ai-decided
bun bench compare --baseline stage2-category-based --candidate stage2-hybrid
```

### Analysis Method

**Per-Image Metrics** (existing evaluator):
- Composition, Lighting, Product Visibility, Background, Professional Quality

**Collection Metrics** (new evaluator):
- Consistency (target: ≥8.5)
- Variety (target: ≥7.0)
- Physical Plausibility (target: ≥8.0)

**Comparison Matrix:**

| Strategy | Per-Image Mean | Consistency | Variety | Plausibility | Overall |
|----------|----------------|-------------|---------|--------------|---------|
| Category-based | ? | ? | ? | ? | ? |
| AI-decided | ? | ? | ? | ? | ? |
| Hybrid | ? | ? | ? | ? | ? |

### Expected Outcomes

| Outcome | Interpretation |
|---------|----------------|
| Category-based wins | Research-backed angles + auto-detection = optimal results |
| AI-decided wins | Let the AI be creative = more natural variety |
| Hybrid wins | Best of both: key angles guaranteed + creative freedom |
| No clear winner | May depend on product type |

## Acceptance Criteria

- [ ] All 90 images generated across 3 strategies
- [ ] All 90 per-image evaluations complete
- [ ] All 18 collection evaluations complete
- [ ] Comparison reports generated
- [ ] Winner identified based on effect magnitude and qualitative assessment

## Dependencies

- Task 01 (Collection Evaluator) - required for collection-level metrics
- Task 02 (Multi-Image Infrastructure) - templates and orchestrator
- Task 03 (Test Data) - product images
- Task 04 (Stage 1) - confirms multi-input is worth using

## Output Artifacts

Document results in: `docs/joyful-splashing-flame/results/stage2-results.md`

```markdown
# Stage 2 Results

## Summary
Winner: [Category-based / AI-decided / Hybrid / Inconclusive]

## Detailed Scores

### Per-Image Quality
| Strategy | Mean | StdDev | Min | Max |
|----------|------|--------|-----|-----|
| Category-based | X.XX | X.XX | X.X | X.X |
| AI-decided | X.XX | X.XX | X.X | X.X |
| Hybrid | X.XX | X.XX | X.X | X.X |

### Collection Metrics
| Strategy | Consistency | Variety | Plausibility |
|----------|-------------|---------|--------------|
| Category-based | X.X | X.X | X.X |
| AI-decided | X.X | X.X | X.X |
| Hybrid | X.X | X.X | X.X |

### Category Detection Accuracy
[Were products correctly classified? Any misclassifications affecting results?]

## Effect Magnitudes
- Category-based vs AI-decided: Δ = X.XX [Large/Moderate/Small]
- Category-based vs Hybrid: Δ = X.XX [Large/Moderate/Small]
- AI-decided vs Hybrid: Δ = X.XX [Large/Moderate/Small]

## Per-Product Analysis
[Any product-specific patterns observed]

## Recommendation
Based on these results, recommend [strategy] for production implementation.

## Next Steps
- Proceed to Stage 3: Yes/No
- If no, document final recommendation
```
