# Iterate Command Refactor Plan

## Overview

Refactor the `bun bench iterate` command to test a single template across multiple products, evaluate results, and suggest template improvements (not product variable changes).

## Current vs Desired Flow

### Current Flow
1. User runs `bun bench iterate --template <slug> --batch <file>`
2. Creates session with evolutionary approach
3. Generates cartesian product: variations × products
4. Evolves prompt variations based on scores
5. Human approval step
6. Report shows statistics across variations

### Desired Flow
1. User runs `bun bench iterate` (uses `prompt-bench/fixtures/images-batch.json` by default)
2. Load template (default: `ecommerce-base`) + variables from config file
3. For each product in batch: generate 1 image using template + config variables + source image
4. Evaluate each generated image
5. AI analyzes all evaluations and suggests **template improvements** (changes to templateData structure)
6. Generate report showing per-product: original image, generated image, analysis, and overall template suggestions

## Key Understanding

- **Template is what we iterate on**: The `templateData` structure (subject, background, lighting, camera, style, quality, negative)
- **Batch file structure**: Only contains `sourceImage` paths and optional `notes` (no per-product variables)
- **Variables come from config file**: A config file specifies the variable set to test (background_type, lighting_style, style, product name extraction, etc.) - same variables applied to all products
- **Workflow**: Test one variable combination at a time, iterate on template structure, then test different variable combinations
- **Goal**: Test if template produces good quality across different product types with a given variable set
- **Output**: Suggested improvements to the template itself, not variable values
- **Single iteration**: Fully automated, no human approval, no session management

## Key Changes Required

### 1. Simplify Command Interface
- **File**: `prompt-bench/commands/iterate.ts`
- Remove session management complexity
- Default to `prompt-bench/fixtures/images-batch.json` if no batch specified
- Require template (or use default `ecommerce-base`)
- Add config file option for variables (e.g., `--config variables.json`)
- Remove human approval step (fully automated, single iteration)

### 2. Change Generation Logic
- **File**: `prompt-bench/commands/iterate.ts` (function: `runAndEvaluatePopulation`)
- **Current**: Creates cartesian product (variations × products)
- **New**: Generate exactly 1 image per product in batch file
  - Load template + variables from config file
  - For each product: compile template with same variables (from config) + extract product name from source image → generate image from source image
- Remove variation evolution logic
- Simplify to: load template + config variables + batch → generate images → evaluate → analyze → suggest template changes

### 3. Update Batch File Schema
- **File**: `prompt-bench/core/types.ts`
- Remove `variables` field from `TestCase` (or make it optional/ignored)
- Batch file should only require: `sourceImage` and optional `notes`

### 4. Create Config File Support
- **New File**: `prompt-bench/commands/config-loader.ts` or add to `shared.ts`
- Load variables from config file (JSON format)
- Config file structure:
  ```json
  {
    "variables": {
      "product": "extract from filename", // or specific value
      "background_type": "pure white seamless",
      "lighting_style": "soft diffused studio",
      "style": "commercial catalog"
    }
  }
  ```
- Handle product name extraction from source image filename if needed

### 5. Create Template Suggestion Function
- **New File**: `prompt-bench/commands/template-suggestions.ts`
- Takes all evaluations + current template as input
- Uses AI model to analyze evaluation results across all products
- Suggests improvements to `templateData` structure (subject, lighting, camera, style, quality, etc.)
- Output format: suggested `templateData` object with rationale

### 6. Update Insights Generation
- **File**: `prompt-bench/commands/insights.ts`
- Create new function: `generateTemplateSuggestions`
- Input: current template + all product evaluations
- Output: suggested templateData improvements with explanations
- Focus on template structure, not individual product variables

### 7. Enhance Report Generation
- **File**: `prompt-bench/commands/report.ts`
- Add per-product section showing:
  - Original source image
  - Generated image
  - Evaluation analysis/details
  - Score breakdown
- Add template suggestions section:
  - Current template structure
  - Suggested improvements
  - Rationale for each suggestion
- Cost breakdown per product and total

### 8. Update Orchestrator Integration
- **File**: `prompt-bench/core/orchestrator.ts`
- Ensure it supports single-pass generation (no cartesian product)
- Verify cost tracking works for per-product basis

## Implementation Steps

1. **Simplify iterate command entry point**
   - Remove session management
   - Load template + batch file directly
   - Add config file loading for variables
   - Default to `ecommerce-base` template if not specified

2. **Update batch file structure**
   - Remove variables from batch file schema (or make optional)
   - Update `images-batch.json` to remove variables

3. **Refactor generation loop**
   - Replace `runAndEvaluatePopulation` with simpler `generateAndEvaluate`
   - One image per product: template + source image + config variables
   - No variations, no cartesian product
   - Extract product name from source image filename if needed

4. **Create config file loader**
   - Add function to load variables from config file
   - Handle product name extraction logic

5. **Create template suggestion system**
   - New function to analyze all evaluations
   - Generate suggested `templateData` improvements
   - Include rationale for each suggested change

6. **Update report format**
   - Add per-product detail section
   - Include original + generated images side-by-side
   - Show evaluation details
   - Add template suggestions section with before/after comparison

7. **Remove evolutionary components**
   - Remove `evolvePopulation` calls
   - Remove variation tracking
   - Remove convergence checking (single iteration)
   - Remove human approval step

## Files to Modify

- `prompt-bench/commands/iterate.ts` - Major refactor to single-iteration flow
- `prompt-bench/commands/insights.ts` - Add template suggestion function
- `prompt-bench/commands/report.ts` - Add per-product detail view + template suggestions
- `prompt-bench/core/orchestrator.ts` - Verify single-pass support
- `prompt-bench/core/types.ts` - Update batch file schema
- `prompt-bench/fixtures/images-batch.json` - Remove variables, keep only sourceImage and notes

## Files to Create

- `prompt-bench/commands/template-suggestions.ts` - Template improvement suggestion logic
- `prompt-bench/commands/config-loader.ts` - Config file loading (or add to shared.ts)
- Example config file: `prompt-bench/fixtures/iteration-variables.json`

## Testing Considerations

- Verify one image per product is generated
- Ensure evaluations are collected correctly
- Test template suggestion output format
- Verify report shows all required per-product details + template suggestions
- Confirm cost tracking works correctly
- Test config file loading and variable application
- Verify product name extraction from filenames (if implemented)

## Example Config File

```json
{
  "variables": {
    "background_type": "pure white seamless",
    "lighting_style": "soft diffused studio",
    "style": "commercial catalog",
    "product": "extract from filename"
  }
}
```

## Example Updated Batch File

```json
{
  "label": "cross-product-baseline",
  "tests": [
    {
      "sourceImage": "./prompt-bench/fixtures/images/tester-1-suitcase.jpg",
      "notes": "Product 1: Luggage/suitcase"
    },
    {
      "sourceImage": "./prompt-bench/fixtures/images/air-purifier.jpg",
      "notes": "Product 2: Home appliances"
    }
  ]
}
```

## Decisions Made

1. **Template iteration focus**: We iterate on the template structure, not product variables
2. **Batch file simplification**: Remove per-product variables, only keep sourceImage and notes
3. **Config file for variables**: Variables come from a separate config file, same for all products
4. **Single iteration**: Fully automated, no human approval, no session management
5. **One image per product**: No cartesian product, just one image per source image
6. **Template suggestions**: AI suggests improvements to templateData structure, not variable values

