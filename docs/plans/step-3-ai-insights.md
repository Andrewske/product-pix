# Step 3: AI Insights Module

## Objective

Add `--insights` flag that uses Claude to analyze batch results and generate actionable recommendations. This is opt-in because it adds API cost and latency.

## Prerequisites

- Step 1 (Core HTML Report) must be completed first
- Step 2 (Baseline Comparison) recommended but not required
- Existing `evaluator.ts` provides Claude integration pattern

## Current State

- Report generates HTML with statistics and images
- No automated analysis or recommendations
- Claude is used in `evaluator.ts` for image scoring

## Target State

- `--insights` flag triggers Claude analysis of batch results
- Insights include:
  - Key findings (patterns in high/low scores)
  - Optimization recommendations
  - Next steps for prompt improvement
- Insights section added to HTML report

## Implementation Tasks

### 1. Create insights.ts module

Create new file `scripts/commands/insights.ts`:

```typescript
/**
 * AI-powered insights generation using Claude
 */

import Anthropic from '@anthropic-ai/sdk';
import { Result, ok, err, createError } from '@/lib/prompts/errors';

// =============================================================================
// Types
// =============================================================================

export interface BatchSummary {
  label: string;
  testCount: number;
  stats: {
    mean: number;
    stdDev: number;
    min: number;
    max: number;
    median: number;
  };
  scoreDistribution: Record<string, number>;
  topTests: Array<{
    score: number;
    prompt: string;
  }>;
  bottomTests: Array<{
    score: number;
    prompt: string;
  }>;
  comparison?: {
    baselineLabel: string;
    baselineMean: number;
    meanDiff: number;
    significant: boolean;
  };
}

export interface InsightResult {
  keyFindings: string[];
  recommendations: string[];
  nextSteps: string[];
  tokensUsed: number;
  costUsd: number;
}

// =============================================================================
// Constants
// =============================================================================

const INSIGHTS_PROMPT = `You are an expert AI prompt engineer analyzing results from a prompt testing batch for e-commerce product image generation.

Based on the batch summary data below, provide actionable insights.

## Your Analysis Should Include:

1. **Key Findings** (3-5 bullet points)
   - Patterns you notice in high-scoring vs low-scoring prompts
   - Score distribution analysis
   - Notable outliers or anomalies

2. **Optimization Recommendations** (3-5 bullet points)
   - Specific prompt wording improvements
   - Parameter adjustments to try
   - Common issues to address

3. **Next Steps** (2-3 bullet points)
   - Concrete experiments to run next
   - Hypotheses to test

## Response Format

Return ONLY valid JSON:
{
  "keyFindings": ["Finding 1", "Finding 2", "Finding 3"],
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "nextSteps": ["Next step 1", "Next step 2"]
}

## Batch Data:
`;

/**
 * Calculate cost based on Claude Sonnet pricing
 * Sonnet 4: $3/1M input, $15/1M output
 */
const calculateCost = (inputTokens: number, outputTokens: number): number => {
  const inputCost = (inputTokens / 1_000_000) * 3;
  const outputCost = (outputTokens / 1_000_000) * 15;
  return inputCost + outputCost;
};

// =============================================================================
// Main Function
// =============================================================================

/**
 * Generate AI-powered insights for a batch of prompt test results
 */
export const generateInsights = async (
  summary: BatchSummary
): Promise<Result<InsightResult>> => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return err(createError('VALIDATION_ERROR', 'ANTHROPIC_API_KEY environment variable is required'));
  }

  const client = new Anthropic({ apiKey });

  // Format summary data for the prompt
  const summaryText = formatSummaryForPrompt(summary);

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `${INSIGHTS_PROMPT}\n${summaryText}`,
        },
      ],
    });

    // Extract text content
    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return err(createError('EVALUATION_ERROR', 'No text response from Claude'));
    }

    // Parse JSON response
    const parseResult = parseInsightsResponse(textContent.text);
    if (!parseResult.ok) {
      return parseResult;
    }

    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
    const costUsd = calculateCost(response.usage.input_tokens, response.usage.output_tokens);

    return ok({
      ...parseResult.data,
      tokensUsed,
      costUsd,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(createError('EVALUATION_ERROR', `Insights generation failed: ${message}`));
  }
};

// =============================================================================
// Helpers
// =============================================================================

const formatSummaryForPrompt = (summary: BatchSummary): string => {
  let text = `
Label: ${summary.label}
Total Tests: ${summary.testCount}

Statistics:
- Mean Score: ${summary.stats.mean.toFixed(2)}/10
- Std Deviation: ${summary.stats.stdDev.toFixed(2)}
- Range: ${summary.stats.min.toFixed(1)} - ${summary.stats.max.toFixed(1)}
- Median: ${summary.stats.median.toFixed(1)}

Score Distribution:
${Object.entries(summary.scoreDistribution)
  .map(([range, count]) => `- ${range}: ${count} tests`)
  .join('\n')}

Top 3 Scoring Prompts:
${summary.topTests.map((t, i) => `${i + 1}. [${t.score.toFixed(1)}/10] "${t.prompt}"`).join('\n')}

Bottom 3 Scoring Prompts:
${summary.bottomTests.map((t, i) => `${i + 1}. [${t.score.toFixed(1)}/10] "${t.prompt}"`).join('\n')}
`;

  if (summary.comparison) {
    text += `
Comparison with Baseline (${summary.comparison.baselineLabel}):
- Baseline Mean: ${summary.comparison.baselineMean.toFixed(2)}
- Mean Difference: ${summary.comparison.meanDiff > 0 ? '+' : ''}${summary.comparison.meanDiff.toFixed(3)}
- Statistically Significant: ${summary.comparison.significant ? 'Yes' : 'No'}
`;
  }

  return text;
};

const parseInsightsResponse = (text: string): Result<Omit<InsightResult, 'tokensUsed' | 'costUsd'>> => {
  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr.trim());

    // Validate required fields
    if (!Array.isArray(parsed.keyFindings)) {
      return err(createError('EVALUATION_ERROR', 'Missing keyFindings array'));
    }
    if (!Array.isArray(parsed.recommendations)) {
      return err(createError('EVALUATION_ERROR', 'Missing recommendations array'));
    }
    if (!Array.isArray(parsed.nextSteps)) {
      return err(createError('EVALUATION_ERROR', 'Missing nextSteps array'));
    }

    return ok({
      keyFindings: parsed.keyFindings,
      recommendations: parsed.recommendations,
      nextSteps: parsed.nextSteps,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(createError('EVALUATION_ERROR', `Failed to parse insights: ${message}`));
  }
};
```

### 2. Update ReportOptions interface

In `report.ts`:

```typescript
interface ReportOptions {
  label: string;
  baseline?: string;
  insights: boolean;  // NEW
  showUrls: boolean;
}

const parseReportOptions = (args: string[]): ReportOptions => {
  const { values } = parseArgs({
    args,
    options: {
      label: { type: 'string', short: 'l' },
      baseline: { type: 'string', short: 'b' },
      insights: { type: 'boolean', default: false },  // NEW
      urls: { type: 'boolean', default: false },
    },
  });

  // ... validation ...

  return {
    label: values.label,
    baseline: values.baseline,
    insights: values.insights ?? false,  // NEW
    showUrls: values.urls ?? false,
  };
};
```

### 3. Call insights generator when flag provided

In `reportCommand()`:

```typescript
import { generateInsights, BatchSummary, InsightResult } from './insights';

// ... existing code ...

let insights: InsightResult | null = null;

if (options.insights) {
  console.log('🤖 Generating AI insights...');

  const summary: BatchSummary = {
    label: options.label,
    testCount: scoredTests.length,
    stats: summarize(scores),
    scoreDistribution: getScoreDistribution(scores),
    topTests: sortedByScore.slice(0, 3).map(t => ({
      score: t.score,
      prompt: t.prompt,
    })),
    bottomTests: sortedByScore.slice(-3).reverse().map(t => ({
      score: t.score,
      prompt: t.prompt,
    })),
  };

  // Add comparison data if baseline provided
  if (comparisonData) {
    summary.comparison = {
      baselineLabel: comparisonData.baseline.label,
      baselineMean: comparisonData.baseline.stats.mean,
      meanDiff: comparisonData.analysis.meanDiff,
      significant: comparisonData.analysis.significant,
    };
  }

  const insightsResult = await generateInsights(summary);

  if (insightsResult.ok) {
    insights = insightsResult.data;
    console.log(`   ✓ Insights generated ($${insights.costUsd.toFixed(4)})`);
  } else {
    console.warn(`   ⚠ Insights generation failed: ${insightsResult.error.message}`);
    // Continue without insights - don't fail the whole report
  }
}
```

### 4. Update ReportData interface

```typescript
interface ReportData {
  label: string;
  generatedAt: string;
  stats: { /* ... */ };
  scoreDistribution: Record<string, number>;
  tests: Array<{ /* ... */ }>;
  costs: { /* ... */ };
  insights?: InsightResult;  // NEW
}
```

### 5. Pass insights to HTML generator

```typescript
const reportData: ReportData = {
  // ... existing fields ...
  insights: insights ?? undefined,
};

const html = generateHTML(reportData, comparisonData);
```

### 6. Update generateHTML to include insights

```typescript
const generateHTML = (data: ReportData, comparison?: ComparisonData): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- ... existing head ... -->
</head>
<body class="bg-gray-50 min-h-screen">
  <div class="max-w-6xl mx-auto p-8">
    ${renderHeader(data, comparison)}
    ${comparison ? renderComparisonSummary(comparison) : ''}
    ${data.insights ? renderInsights(data.insights) : ''}  <!-- NEW -->
    ${renderSummaryStats(data)}
    ${renderScoreDistribution(data)}
    ${comparison ? renderComparisonGrid(comparison) : renderTestGrid(data)}
    ${renderCostSummary(data)}
  </div>
</body>
</html>
`;
```

### 7. Implement renderInsights function

```typescript
const renderInsights = (insights: InsightResult): string => `
  <section class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow p-6 mb-8 border border-purple-100">
    <div class="flex items-center gap-2 mb-4">
      <span class="text-2xl">🤖</span>
      <h2 class="text-lg font-semibold">AI-Powered Insights</h2>
      <span class="text-xs text-gray-500 ml-auto">Cost: $${insights.costUsd.toFixed(4)}</span>
    </div>

    <!-- Key Findings -->
    <div class="mb-6">
      <h3 class="font-semibold text-gray-700 mb-2">📊 Key Findings</h3>
      <ul class="space-y-2">
        ${insights.keyFindings.map(finding => `
          <li class="flex items-start gap-2">
            <span class="text-purple-500 mt-1">•</span>
            <span class="text-gray-700">${escapeHtml(finding)}</span>
          </li>
        `).join('')}
      </ul>
    </div>

    <!-- Recommendations -->
    <div class="mb-6">
      <h3 class="font-semibold text-gray-700 mb-2">💡 Recommendations</h3>
      <ul class="space-y-2">
        ${insights.recommendations.map(rec => `
          <li class="flex items-start gap-2">
            <span class="text-blue-500 mt-1">•</span>
            <span class="text-gray-700">${escapeHtml(rec)}</span>
          </li>
        `).join('')}
      </ul>
    </div>

    <!-- Next Steps -->
    <div>
      <h3 class="font-semibold text-gray-700 mb-2">🎯 Next Steps</h3>
      <ul class="space-y-2">
        ${insights.nextSteps.map(step => `
          <li class="flex items-start gap-2">
            <span class="text-green-500 mt-1">•</span>
            <span class="text-gray-700">${escapeHtml(step)}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  </section>
`;
```

### 8. Add insights styles

Add to `getStyles()`:

```typescript
/* Insights section */
.from-purple-50 { --tw-gradient-from: #faf5ff; }
.to-blue-50 { --tw-gradient-to: #eff6ff; }
.bg-gradient-to-r { background-image: linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to)); }
.border-purple-100 { border-color: #f3e8ff; }
.text-purple-500 { color: #a855f7; }
.text-blue-500 { color: #3b82f6; }
.text-green-500 { color: #22c55e; }
.space-y-2 > * + * { margin-top: 0.5rem; }
.mt-1 { margin-top: 0.25rem; }
.ml-auto { margin-left: auto; }
```

### 9. Update cost summary to include insights

```typescript
const renderCostSummary = (data: ReportData): string => {
  const insightsCost = data.insights?.costUsd ?? 0;
  const total = data.costs.total + insightsCost;

  return `
    <section class="bg-white rounded-lg shadow p-4">
      <h2 class="text-lg font-semibold mb-4">Cost Summary</h2>
      <div class="grid grid-cols-${data.insights ? '4' : '3'} gap-4">
        ${renderStatCard('Generation', '$' + data.costs.generation.toFixed(4))}
        ${renderStatCard('Evaluation', '$' + data.costs.evaluation.toFixed(4))}
        ${data.insights ? renderStatCard('Insights', '$' + insightsCost.toFixed(4)) : ''}
        ${renderStatCard('Total', '$' + total.toFixed(4))}
      </div>
    </section>
  `;
};
```

## Files to Create

| File | Purpose |
|------|---------|
| `scripts/commands/insights.ts` | AI insights generation module |

## Files to Modify

| File | Changes |
|------|---------|
| `scripts/commands/report.ts` | Add --insights flag, call insights generator, render section |

## Testing

1. Run `pnpm bench report --label <batch>` (without insights)
   - Verify no Claude API call made
   - Verify no insights section in HTML

2. Run `pnpm bench report --label <batch> --insights`
   - Verify Claude API called
   - Verify insights section appears in HTML
   - Check cost reported in console and HTML

3. Run `pnpm bench report --label <batch> --baseline <baseline> --insights`
   - Verify comparison data included in insights prompt
   - Verify insights reference the comparison

4. Test error handling:
   - Remove ANTHROPIC_API_KEY and verify graceful degradation
   - Report should still generate without insights section

## Success Criteria

- [ ] `--insights` flag parsed and triggers Claude call
- [ ] Insights module returns structured JSON
- [ ] Key findings, recommendations, next steps rendered in HTML
- [ ] Cost tracked and displayed
- [ ] Graceful fallback if Claude call fails
- [ ] No API call when flag not provided
- [ ] Comparison context included when baseline provided
