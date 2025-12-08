# Task 03: Enhance Insights with Structured Variations

## Objective
Modify the insights module to return machine-readable prompt variations alongside human-readable recommendations.

## File to Modify
`prompt-bench/commands/insights.ts`

## Context
- Current insights return: `keyFindings`, `recommendations`, `nextSteps`
- Need to add: `proposedVariations`, `successPatterns`, `failurePatterns`
- Uses Claude Sonnet for analysis
- Types from `prompt-bench/core/iteration-types.ts`

## Changes Required

### 1. Update BatchSummary Interface
Add fields for raw templateData from top/bottom tests:
```typescript
export interface BatchSummary {
  // ... existing fields ...
  topTests: Array<{
    score: number;
    prompt: string;
    templateData?: TemplateData;  // NEW: structured template data
  }>;
  bottomTests: Array<{
    score: number;
    prompt: string;
    templateData?: TemplateData;  // NEW: structured template data
  }>;
}
```

### 2. Create New Function: generateStructuredInsights
```typescript
export const generateStructuredInsights = async (
  summary: BatchSummary,
  variationCount?: number  // default 5
): Promise<Result<StructuredInsight>>
```

### 3. New System Prompt
Create `STRUCTURED_INSIGHTS_PROMPT` that instructs Claude to return:

```
You are an expert AI prompt engineer analyzing e-commerce product image generation results.

Analyze the batch data and return structured insights with concrete prompt variations to test.

## Analysis Tasks:
1. Identify patterns in high-scoring prompts (success patterns)
2. Identify patterns in low-scoring prompts (failure patterns)
3. Generate {variationCount} new prompt variations using:
   - Mutations: modify wording, add/remove elements
   - Crossovers: combine successful elements from different prompts
   - Wild: creative experiments avoiding known failures

## Response Format (JSON only):
{
  "keyFindings": ["...", "..."],
  "recommendations": ["...", "..."],
  "nextSteps": ["...", "..."],
  "proposedVariations": [
    {
      "id": "var-{uuid}",
      "parentIds": ["parent-id-if-mutation"],
      "source": "mutation|crossover|wild",
      "mutationType": "wording|addition|removal|substitution|emphasis|wild",
      "templateData": {
        "subject": "...",
        "background": "...",
        "lighting": "...",
        "camera": "...",
        "style": "...",
        "quality": "...",
        "negative": "..."
      },
      "rationale": "Why this variation should improve scores",
      "confidence": 0.75
    }
  ],
  "successPatterns": [
    { "pattern": "soft diffused lighting", "component": "lighting", "frequency": 0.8, "avgScore": 8.5 }
  ],
  "failurePatterns": [
    { "pattern": "harsh direct light", "component": "lighting", "frequency": 0.6, "avgScore": 5.2 }
  ]
}
```

### 4. Update formatSummaryForPrompt
Include templateData in the prompt when available:
```typescript
const formatSummaryForPrompt = (summary: BatchSummary): string => {
  // ... existing formatting ...

  // Add structured template data for top tests
  if (summary.topTests[0]?.templateData) {
    text += '\nTop Test Template Components:\n';
    text += JSON.stringify(summary.topTests[0].templateData, null, 2);
  }
  // Similar for bottom tests
};
```

### 5. Update parseInsightsResponse
Add parsing for new fields:
```typescript
const parseStructuredInsightsResponse = (
  text: string
): Result<Omit<StructuredInsight, 'tokensUsed' | 'costUsd'>> => {
  // Extract JSON
  // Validate proposedVariations array
  // Validate successPatterns array
  // Validate failurePatterns array
  // Generate UUIDs for variations if not provided
};
```

### 6. Keep Backward Compatibility
- Keep existing `generateInsights` function unchanged
- New `generateStructuredInsights` is additive
- Report command can choose which to use

## Testing Notes
- Test with real batch data to ensure Claude returns valid JSON
- Verify templateData in variations is valid TemplateData schema
- Check confidence scores are in 0-1 range
