/**
 * AI-powered insights generation using Claude
 */

import Anthropic from '@anthropic-ai/sdk';
import { Result, ok, err, createError } from '@bench/core/errors';
import type { TemplateData } from '@bench/core/types';
import { calculateCost } from '@bench/core/cost';

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
    templateData?: TemplateData;  // NEW: structured template data
  }>;
  bottomTests: Array<{
    score: number;
    prompt: string;
    templateData?: TemplateData;  // NEW: structured template data
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
    const costResult = calculateCost('claude-sonnet-4-20250514', {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    });

    if (!costResult.ok) {
      console.warn(`⚠️  Failed to calculate cost for insights: ${costResult.error.message}`);
      return err(createError(
        'EVALUATION_ERROR',
        `Cost calculation failed: ${costResult.error.message}`,
        { retryable: false }
      ));
    }

    const costData = costResult.data;

    return ok({
      ...parseResult.data,
      tokensUsed,
      costUsd: costData.total,
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