# AI Product Analysis Integration Plan for Prompt-Bench

## Overview
This plan outlines the implementation to add the same AI product analysis that exists in the Next.js `/generate` endpoint to the prompt-bench pipeline. The analysis will extract product details (product name, color, material) from source images and automatically populate template variables.

## Current State Analysis

### Next.js `/generate` Analysis (`src/lib/ai/product-analyzer.ts`)
- Uses Gemini vision to extract: `product`, `color`, `material`, `shape`, `features[]`
- Called before prompt compilation when source images are provided
- Results passed to `buildPromptFromTemplateSlug()` for variable substitution

### Current Prompt-Bench State
- **Regular templates**: No AI analysis, variables manually specified in batch files
- **Collection templates**: Only category classification (`classifyProduct`) for angle determination
- Variables like `product`, `color`, `material` are hardcoded in batch test cases

## Implementation Plan

### 1. Add AI Analysis to Prompt-Bench Core
- Import `analyzeProductImage` from main app (`src/lib/ai/product-analyzer.ts`)
- Import `ProductAnalysis` type from main app
- Create analysis function in `prompt-bench/core/` that wraps the main app's analyzer

### 2. Modify Collection Template Variable Schema
Update collection templates (`prompt-bench/templates/multi-angle-collection.ts`) to include analysis variables:

```typescript
variablesSchema: {
  product: { type: 'string', required: true },     // Will be filled by AI
  color: { type: 'string', required: false },      // Will be filled by AI
  material: { type: 'string', required: false },   // Will be filled by AI
  angle: { type: 'string', required: true },       // From category angles
}
```

### 3. Integrate Analysis in Orchestrator
Modify `coordinateCollectionGeneration()` in `prompt-bench/core/orchestrator.ts`:
- After source images are resolved (currently lines 489-504)
- Add analysis call using first source image (max(5) photos constraint satisfied)
- Store analysis results in `testInputs.analysis` for each test record
- Use analysis to populate `product`, `color`, `material` variables before compilation

### 4. Handle Max(5) Photos Requirement
For collections with multiple source images:
- **Strategy**: Analyze only the first resolved source image per test case
- **Rationale**: Provides consistent analysis across all 5 generated images while respecting the max(5) constraint
- **Implementation**: Single `analyzeProductImage()` call per test case, results applied to all collection images

### 5. Update Data Storage
Extend `prompt_tests.inputs` JSON field to include analysis:
```typescript
{
  // Existing manual variables
  "product": "leather messenger bag",

  // New AI analysis results
  "analysis": {
    "product": "genuine leather messenger bag",
    "color": "dark brown",
    "material": "full-grain leather",
    "shape": "rectangular with flap",
    "features": ["zipper closure", "adjustable strap"]
  },

  // Collection metadata
  "outputIndex": 0,
  "detectedCategory": "apparel",
  "anglesUsed": ["front", "45-degree", "back", "detail-fabric", "flat-lay"]
}
```

### 6. Backward Compatibility
- Existing batch files with manual `product`, `color`, `material` variables continue to work
- AI analysis enhances but doesn't override manually specified variables
- New batches can omit these variables and let AI fill them in

### 7. Template Updates
- Update collection templates to use analysis variables in prompts:
  ```
  subject: 'Professional photo of {product}, {color} {material} from {angle} view'
  ```
- Keep regular templates unchanged (they work with manual variables)

## Implementation Sequence

1. **Phase 1**: Add analysis import and wrapper function
2. **Phase 2**: Modify orchestrator to call analysis for collections
3. **Phase 3**: Update collection templates to use analysis variables
4. **Phase 4**: Test with existing collection batches
5. **Phase 5**: Update documentation and examples

## Tradeoffs & Considerations

### Analysis Strategy
- **Single image per collection**: Cost-effective but may miss details from multiple angles
- **Aggregate multiple images**: More comprehensive but higher cost and complexity

### Variable Override Logic
- **AI takes precedence**: Always use analysis results (breaks existing batches)
- **Manual takes precedence**: Keep existing behavior, AI only fills missing variables
- **Hybrid**: AI enhances but manual variables override

### Cost Impact
- Adds ~1 API call per collection test case
- Minimal impact since analysis is cheaper than image generation

## Open Questions

1. **Variable precedence**: Should AI analysis override manually specified variables in batch files, or only fill in missing ones?

2. **Scope**: Should this apply only to collection templates, or also add analysis to regular single-image templates?

3. **Multi-image analysis**: For collections with multiple source images, should we analyze all images and aggregate results, or just use the first image?

4. **Template updates**: Are you okay with modifying the existing collection templates to use the new analysis variables, or should we create new template versions?

5. **Cost considerations**: Since this adds API calls, should we make analysis optional via a command-line flag?

## Files to Modify
- `prompt-bench/core/orchestrator.ts` - Add analysis integration
- `prompt-bench/templates/multi-angle-collection.ts` - Update variable schemas
- `prompt-bench/core/` - Add analysis wrapper function
- Batch file examples - Update to demonstrate AI analysis usage

## Testing Strategy
- Test with existing collection batches to ensure backward compatibility
- Test with new batches that omit manual variables
- Verify analysis results are stored correctly in database
- Confirm generated prompts use analysis variables properly</content>
<parameter name="filePath">docs/ai-analysis-integration-plan.md