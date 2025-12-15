# Test Data Preparation

## Files to Modify/Create
- `prompt-bench/fixtures/images/` (new directory structure)
- `prompt-bench/fixtures/stage1-batch.json` (new)
- `prompt-bench/fixtures/stage2-batch.json` (new)

## Implementation Details

Prepare the test dataset for multi-image experiments. Need multiple angles of each product.

### Required Product Images

For each of the 6 test products, gather 3 distinct angles:

| Product | Front | Back | Side/45° |
|---------|-------|------|----------|
| Suitcase (monos) | ✓ existing | need | need |
| Coffee grinder | ✓ existing | need | need |
| Monitor | ✓ existing | need | need |
| Peanut butter jar | ✓ existing | need | need |
| Espresso machine | ✓ existing | need | need |
| Air purifier | ✓ existing | need | need |

### Image Requirements

- Resolution: 1024px minimum on shortest side
- Format: JPEG or PNG
- Background: Any (will be replaced)
- Angles: Clearly distinct (front, back, and one side view)

### Directory Structure

```
prompt-bench/fixtures/images/
├── suitcase/
│   ├── front.jpg
│   ├── back.jpg
│   └── side.jpg
├── coffee-grinder/
│   ├── front.jpg
│   ├── back.jpg
│   └── side.jpg
├── monitor/
│   ├── front.jpg
│   ├── back.jpg
│   └── side.jpg
├── peanut-butter/
│   ├── front.jpg
│   ├── back.jpg
│   └── side.jpg
├── espresso-machine/
│   ├── front.jpg
│   ├── back.jpg
│   └── side.jpg
└── air-purifier/
    ├── front.jpg
    ├── back.jpg
    └── side.jpg
```

### Stage 1 Batch File

```json
{
  "label": "stage1-single-vs-multi-input",
  "description": "Does multiple input images improve output quality?",
  "tests": [
    {
      "sourceImages": ["fixtures/images/suitcase/front.jpg"],
      "variables": { "product": "monos suitcase" },
      "notes": "Single input - suitcase"
    },
    {
      "sourceImages": [
        "fixtures/images/suitcase/front.jpg",
        "fixtures/images/suitcase/back.jpg",
        "fixtures/images/suitcase/side.jpg"
      ],
      "variables": { "product": "monos suitcase" },
      "notes": "Multi input - suitcase"
    }
    // ... repeat for all 6 products (12 tests total)
  ]
}
```

### Stage 2 Batch Files

Create three separate batch files, one per strategy:

**`stage2-batch-category-based.json`**
```json
{
  "label": "stage2-category-based",
  "description": "Category-based angles strategy (research-backed)",
  "tests": [
    {
      "sourceImages": [
        "fixtures/images/suitcase/front.jpg",
        "fixtures/images/suitcase/back.jpg",
        "fixtures/images/suitcase/side.jpg"
      ],
      "variables": { "product": "monos suitcase" },
      "notes": "Suitcase - category-based angles"
    }
    // ... repeat for all 6 products (6 tests)
  ]
}
```

**`stage2-batch-ai-decided.json`**
```json
{
  "label": "stage2-ai-decided",
  "description": "AI-decided angles strategy",
  "tests": [
    {
      "sourceImages": [
        "fixtures/images/suitcase/front.jpg",
        "fixtures/images/suitcase/back.jpg",
        "fixtures/images/suitcase/side.jpg"
      ],
      "variables": { "product": "monos suitcase" },
      "notes": "Suitcase - AI-decided angles"
    }
    // ... repeat for all 6 products (6 tests)
  ]
}
```

**`stage2-batch-hybrid.json`**
```json
{
  "label": "stage2-hybrid",
  "description": "Hybrid angles strategy",
  "tests": [
    {
      "sourceImages": [
        "fixtures/images/suitcase/front.jpg",
        "fixtures/images/suitcase/back.jpg",
        "fixtures/images/suitcase/side.jpg"
      ],
      "variables": { "product": "monos suitcase" },
      "notes": "Suitcase - hybrid angles"
    }
    // ... repeat for all 6 products (6 tests)
  ]
}
```

## Acceptance Criteria

- [ ] All 6 products have 3 distinct angle images
- [ ] Images organized in directory structure above
- [ ] `stage1-batch.json` has 12 tests (6 products × 2 conditions)
- [ ] `stage2-batch-category-based.json` has 6 tests (6 products)
- [ ] `stage2-batch-ai-decided.json` has 6 tests (6 products)
- [ ] `stage2-batch-hybrid.json` has 6 tests (6 products)
- [ ] All image paths resolve correctly

## Dependencies

- None (can be done in parallel with Tasks 01-02)

## Notes

- Existing product images are in `prompt-bench/fixtures/` - check what's available
- May need to source additional angles from product websites or take new photos
- Consider using the same products from existing evaluation batches for baseline comparison
