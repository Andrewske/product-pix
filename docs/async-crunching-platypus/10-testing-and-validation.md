# Testing and Validation

## Unit Tests to Create
- `prompt-bench/__tests__/consensus.test.ts` (new)
- `prompt-bench/__tests__/analysis-cache.test.ts` (new)

## Unit Tests to Modify
- `prompt-bench/__tests__/compiler.test.ts` (add empty variable tests)

## Integration Tests
- Collection batch scenarios with various variable configurations

## Implementation Details

### 1. Consensus Logic Tests
Create `prompt-bench/__tests__/consensus.test.ts`:

```typescript
import { describe, it, expect } from 'bun:test';
import { mergeAnalysisResults, hashImageBatch } from '@bench/core/consensus';

describe('mergeAnalysisResults', () => {
  it('uses majority vote for single-value fields', () => {
    const results = [
      { product: 'bag', color: 'brown', material: 'leather', shape: 'rect', features: [] },
      { product: 'bag', color: 'brown', material: 'leather', shape: 'rect', features: [] },
      { product: 'bag', color: 'black', material: 'leather', shape: 'rect', features: [] },
    ];

    const merged = mergeAnalysisResults(results);

    expect(merged.product).toBe('bag');
    expect(merged.color).toBe('brown');  // 2 votes vs 1
    expect(merged.material).toBe('leather');
  });

  it('handles tie-breaking by first occurrence', () => {
    const results = [
      { product: 'bag', color: 'brown', material: 'leather', shape: 'rect', features: [] },
      { product: 'bag', color: 'black', material: 'leather', shape: 'rect', features: [] },
    ];

    const merged = mergeAnalysisResults(results);

    expect(merged.color).toBe('brown');  // Tie, first wins
  });

  it('creates union of features arrays', () => {
    const results = [
      { product: 'bag', color: 'brown', material: 'leather', shape: 'rect', features: ['zipper', 'strap'] },
      { product: 'bag', color: 'brown', material: 'leather', shape: 'rect', features: ['strap', 'pocket'] },
      { product: 'bag', color: 'brown', material: 'leather', shape: 'rect', features: ['zipper'] },
    ];

    const merged = mergeAnalysisResults(results);

    expect(merged.features).toEqual(['zipper', 'strap', 'pocket']);  // Union, no duplicates
  });

  it('handles single result gracefully', () => {
    const results = [
      { product: 'bag', color: 'brown', material: 'leather', shape: 'rect', features: ['zipper'] },
    ];

    const merged = mergeAnalysisResults(results);

    expect(merged).toEqual(results[0]);
  });

  it('throws on empty results array', () => {
    expect(() => mergeAnalysisResults([])).toThrow('Cannot merge empty analysis results');
  });
});

describe('hashImageBatch', () => {
  it('produces same hash for same image set', () => {
    const hash1 = hashImageBatch(['abc123', 'def456', 'ghi789']);
    const hash2 = hashImageBatch(['abc123', 'def456', 'ghi789']);

    expect(hash1).toBe(hash2);
  });

  it('produces different hash if any image changes', () => {
    const hash1 = hashImageBatch(['abc123', 'def456', 'ghi789']);
    const hash2 = hashImageBatch(['abc123', 'CHANGED', 'ghi789']);

    expect(hash1).not.toBe(hash2);
  });

  it('produces same hash regardless of order', () => {
    const hash1 = hashImageBatch(['abc123', 'def456', 'ghi789']);
    const hash2 = hashImageBatch(['ghi789', 'abc123', 'def456']);

    expect(hash1).toBe(hash2);  // Sorted before hashing
  });
});
```

### 2. Compiler Empty Variable Tests
Add to `prompt-bench/__tests__/compiler.test.ts`:

```typescript
import { stripEmptyVariables, compileTemplate } from '@bench/core/compiler';

describe('stripEmptyVariables', () => {
  it('removes middle empty variables with commas', () => {
    expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
  });

  it('removes trailing empty variables', () => {
    expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
  });

  it('handles multiple consecutive empty variables', () => {
    expect(stripEmptyVariables('bag, , , texture')).toBe('bag, texture');
  });

  it('cleans up extra whitespace', () => {
    expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
  });

  it('preserves non-empty text unchanged', () => {
    expect(stripEmptyVariables('red leather bag')).toBe('red leather bag');
  });
});

describe('compileTemplate with AI analysis variables', () => {
  it('compiles with all variables present', () => {
    const template = { subject: 'Photo of {product}, {color} {material}' };
    const schema = {
      product: { type: 'string', required: true },
      color: { type: 'string', required: false, default: '' },
      material: { type: 'string', required: false, default: '' }
    };

    const result = compileTemplate(template, schema, {
      product: 'bag',
      color: 'brown',
      material: 'leather'
    });

    expect(result.ok).toBe(true);
    expect(result.data.prompt).toBe('Photo of bag, brown leather');
  });

  it('strips empty optional variables', () => {
    const template = { subject: 'Photo of {product}, {color} {material}' };
    const schema = {
      product: { type: 'string', required: true },
      color: { type: 'string', required: false, default: '' },
      material: { type: 'string', required: false, default: '' }
    };

    const result = compileTemplate(template, schema, { product: 'bag' });

    expect(result.ok).toBe(true);
    expect(result.data.prompt).toBe('Photo of bag');  // No ", ," artifacts
  });
});
```

### 3. Integration Test Scenarios

**Scenario 1: Full AI Analysis (No Manual Variables)**
```bash
# Create batch file: fixtures/ai-analysis-full.json
{
  "label": "ai-full",
  "tests": [
    {
      "sourceImages": ["fixtures/images/bag1.jpg", "fixtures/images/bag2.jpg"]
      // No variables - AI provides all
    }
  ]
}

# Run test
bun bench test --template multi-angle-collection --batch fixtures/ai-analysis-full.json

# Verify:
# - Analysis runs for both images
# - Results merged via consensus
# - Prompt contains AI-extracted values
# - inputs.analysis stored in DB
```

**Scenario 2: Hybrid (Some Manual, Some AI)**
```bash
# Create batch file: fixtures/ai-analysis-hybrid.json
{
  "label": "ai-hybrid",
  "tests": [
    {
      "variables": { "product": "leather messenger bag" },  # Manual
      "sourceImages": ["fixtures/images/bag1.jpg", "fixtures/images/bag2.jpg"]
      # AI fills in color, material
    }
  ]
}

# Run test
bun bench test --template multi-angle-collection --batch fixtures/ai-analysis-hybrid.json

# Verify:
# - Manual "product" overrides AI analysis
# - AI provides color and material
# - Manual precedence respected
```

**Scenario 3: Manual Precedence (All Manual Variables)**
```bash
# Create batch file: fixtures/ai-analysis-manual.json
{
  "label": "ai-manual",
  "tests": [
    {
      "variables": {
        "product": "custom bag name",
        "color": "custom brown",
        "material": "custom leather"
      },
      "sourceImages": ["fixtures/images/bag1.jpg"]
    }
  ]
}

# Run test
bun bench test --template multi-angle-collection --batch fixtures/ai-analysis-manual.json

# Verify:
# - All manual variables used
# - AI analysis still runs (and cached)
# - Manual values override AI results
```

**Scenario 4: Analysis Disabled**
```bash
# Run with --no-analysis flag
bun bench test --template multi-angle-collection --batch fixtures/basic-batch.json --no-analysis

# Verify:
# - No analysis API calls made
# - Only manual variables used
# - Backwards compatible behavior
```

**Scenario 5: Cache Behavior**
```bash
# Run same batch twice
bun bench test --template multi-angle-collection --batch fixtures/ai-analysis-full.json
bun bench test --template multi-angle-collection --batch fixtures/ai-analysis-full.json

# Verify:
# - First run: Analysis API calls made
# - Second run: Results from cache (no API calls)
# - Results identical
```

## Acceptance Criteria
- [ ] All unit tests pass
- [ ] Integration scenarios produce expected results
- [ ] Existing collection batches work without modification
- [ ] Analysis results stored correctly in `prompt_tests.inputs.analysis`
- [ ] Empty variables don't create ", , " artifacts in prompts
- [ ] Manual variables always override AI analysis
- [ ] Cache prevents redundant API calls
- [ ] `--no-analysis` flag works correctly

## Validation Checklist
Run these commands after implementation:

```bash
# 1. Run all tests
bun test prompt-bench

# 2. Sync analysis prompts
bun bench sync-analysis

# 3. Test collection generation with analysis
bun bench test --template multi-angle-collection --batch fixtures/multi-image-batch.json

# 4. Verify database contents
psql -d productpix -c "SELECT * FROM analysis_prompts;"
psql -d productpix -c "SELECT * FROM analysis_cache LIMIT 5;"
psql -d productpix -c "SELECT inputs FROM prompt_tests WHERE inputs ? 'analysis' LIMIT 3;"

# 5. Test cache behavior
bun bench test --template multi-angle-collection --batch fixtures/multi-image-batch.json --no-cache
```

## Dependencies
All previous tasks (1-9) must be completed
