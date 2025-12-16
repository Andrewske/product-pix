# Orchestrator Integration: Add Analysis to Collection Generation

## Files to Modify
- `prompt-bench/core/orchestrator.ts` (lines 506-517, 523, 609)

## Implementation Details

Integrate AI product analysis into the collection generation flow at three specific points:

### 1. Import Analysis Functions
Add imports at the top of the file:

```typescript
import { analyzeProductImages } from './product-analyzer';
import type { ProductAnalysis } from '@/types/analysis';
```

### 2. Run Analysis After Category Detection (Line 506-517)
Insert analysis logic immediately after category detection completes:

**Location:** Between line 506 (`angles = getAnglesForCategory(category)`) and line 509 (start of inner loop)

```typescript
// Line 506 - Category detection complete
angles = getAnglesForCategory(category);

// NEW: Product analysis integration
let mergedAnalysis: ProductAnalysis | undefined;

// Only run analysis if template uses product/color/material variables
if (
  template.variablesSchema.product ||
  template.variablesSchema.color ||
  template.variablesSchema.material
) {
  // Resolve all source images for analysis
  const imagesToAnalyze = await Promise.all(
    sourceImages.map(img =>
      resolveSourceImage(img, {
        uploadToR2: true,
        r2Prefix: `prompt-bench/source/${Date.now()}`,
        hashForDedup: true
      })
    )
  );

  // Check if all resolutions succeeded
  const failedResolution = imagesToAnalyze.find(r => !r.ok);
  if (failedResolution) {
    return err(failedResolution.error);
  }

  // Extract buffers and MIME types
  const imageData = imagesToAnalyze.map(r => ({
    buffer: r.data.buffer,
    mimeType: r.data.mimeType
  }));

  // Run analysis with configured model
  const analysisResult = await analyzeProductImages(imageData, {
    model: config.analysisModel || 'gemini-2.0-flash',
    promptSlug: config.analysisPromptSlug || 'product-analysis',
    cacheEnabled: config.analysisCacheEnabled !== false
  });

  if (!analysisResult.ok) {
    // Fail fast with detailed error
    return err(
      createError(
        'ANALYSIS_FAILED',
        `Failed to analyze images for test case ${i + 1}: ${analysisResult.error.message}`
      )
    );
  }

  mergedAnalysis = analysisResult.data;
}

// Line 509 - Start inner loop (existing code)
for (let j = 0; j < template.outputCount; j++) {
```

### 3. Merge Analysis into Variables (Line 523)
Update variable population to implement manual precedence:

**Before:**
```typescript
const compileResult = compileTemplate(
  template.templateData,
  template.variablesSchema,
  {
    ...testCase.variables,
    angle,
    category,
    outputIndex: j,
    totalOutputs: template.outputCount
  }
);
```

**After:**
```typescript
const compileResult = compileTemplate(
  template.templateData,
  template.variablesSchema,
  {
    // Manual precedence: AI provides defaults, user variables override
    ...(mergedAnalysis || {}),     // AI-extracted values (lower priority)
    ...testCase.variables,          // User-provided values (higher priority)
    angle,
    category,
    outputIndex: j,
    totalOutputs: template.outputCount
  }
);
```

### 4. Store Analysis in Test Record (Line 609)
Update the `inputs` object to include analysis results:

**Before:**
```typescript
inputs: {
  ...testCase.variables,
  angle,
  outputIndex: j,
  detectedCategory: category,
  anglesUsed: angles,
} as any
```

**After:**
```typescript
inputs: {
  ...testCase.variables,
  angle,
  outputIndex: j,
  detectedCategory: category,
  anglesUsed: angles,
  ...(mergedAnalysis && { analysis: mergedAnalysis })  // Store for audit
} as any
```

## Acceptance Criteria
- [ ] Analysis runs after category detection, before inner loop
- [ ] Analysis only runs if template uses product/color/material variables
- [ ] All source images resolved and analyzed (multi-image support)
- [ ] Analysis failures fail fast with detailed error message
- [ ] Manual variables override AI analysis (manual precedence)
- [ ] Analysis results stored in `prompt_tests.inputs.analysis`
- [ ] Config values read from orchestrator config object
- [ ] Existing collection generation tests still pass

## Integration Points
- **Before:** Category detection at line 501
- **After:** Inner loop starts at line 509
- **Variables merged:** Line 523
- **Database storage:** Line 609

## Config Schema
Ensure orchestrator config supports new fields:
```typescript
interface OrchestratorConfig {
  analysisModel?: string;           // e.g., 'gemini-2.0-flash'
  analysisPromptSlug?: string;      // e.g., 'product-analysis'
  analysisCacheEnabled?: boolean;   // default: true
  // ... existing fields
}
```

## Dependencies
- Task 05 (product analyzer implementation)
- Task 06 (compiler stripping to handle empty variables)
