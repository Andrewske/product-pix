# Stage 3 Experiment & Final Documentation

## Files to Modify/Create
- `docs/joyful-splashing-flame/results/stage3-results.md` (new, if Stage 3 runs)
- `docs/joyful-splashing-flame/results/final-recommendations.md` (new)

## Implementation Details

### Stage 3: Context Strategy (Conditional)

Only run if Stage 2 results show room for improvement on consistency or variety.

**Question:** Does telling the AI about its position in the sequence improve results?

| Condition | Prompt Addition |
|-----------|-----------------|
| A: None | (baseline - no context) |
| B: Position | "This is image 3 of 5 in the collection" |
| C: Prior | "You've generated front and back views. Generate something different." |

**When to run:**
- If winning strategy from Stage 2 scores <8.0 on consistency OR <7.0 on variety
- If results are close and we want to squeeze out more quality

**When to skip:**
- If Stage 2 winner clearly meets all targets
- Budget constraints

### Execution (If Running Stage 3)

```bash
# Use winning template from Stage 2 with context variations
bun bench run --template [winner]-with-position --batch fixtures/stage3-batch.json
bun bench run --template [winner]-with-prior --batch fixtures/stage3-batch.json

# Evaluate
bun bench evaluate --label stage3-position
bun bench evaluate --label stage3-prior
bun bench evaluate-collection --label stage3-position
bun bench evaluate-collection --label stage3-prior

# Compare against Stage 2 winner baseline
bun bench compare --baseline stage2-[winner] --candidate stage3-position
bun bench compare --baseline stage2-[winner] --candidate stage3-prior
```

---

## Final Documentation

Regardless of whether Stage 3 runs, document final findings.

### Final Recommendations Document

Create `docs/joyful-splashing-flame/results/final-recommendations.md`:

```markdown
# Multi-Image Generation: Experiment Conclusions

## Executive Summary
[2-3 sentences on what we learned and the recommended approach]

## Key Findings

### Does Multi-Image Input Help?
[Stage 1 conclusion]

### Best Variety Strategy
[Stage 2 conclusion]

### Context Strategy (If Tested)
[Stage 3 conclusion or "Not tested - Stage 2 results sufficient"]

## Recommended Production Configuration

```typescript
{
  inputImages: { min: 1, max: 5 },
  outputCount: { min: 1, max: 10, default: 5 },
  varietyStrategy: '[winner]',
  contextStrategy: '[winner or "none"]',
  pricing: '1 credit per output image'
}
```

## Quality Benchmarks Achieved

| Metric | Target | Achieved | Status |
|--------|--------|----------|--------|
| Per-image quality | ≥8.0 | X.X | ✓/✗ |
| Consistency | ≥8.5 | X.X | ✓/✗ |
| Variety | ≥7.0 | X.X | ✓/✗ |
| Plausibility | ≥8.0 | X.X | ✓/✗ |

## Next Steps for Production
1. Implement data model changes (collection entity)
2. Update API to support multi-image input/output
3. Build progressive enhancement UI
4. Deploy with winning configuration

## Appendix: All Reports
- [Stage 1 Report](./stage1-results.md)
- [Stage 2 Report](./stage2-results.md)
- [Stage 3 Report](./stage3-results.md) (if applicable)
```

## Acceptance Criteria

- [ ] Stage 3 run decision documented (why/why not)
- [ ] If run: Stage 3 results documented
- [ ] Final recommendations document created
- [ ] All findings traceable to experiment data
- [ ] Clear production configuration recommendation
- [ ] Cost summary accurate

## Dependencies

- Task 04 (Stage 1 Results)
- Task 05 (Stage 2 Results)
