/**
 * AI Analyzer Agent - Diagnoses template issues and generates improvement suggestions
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Result } from '@bench/core/errors';
import { ok, err, createError } from '@bench/core/errors';
import type { PromptTemplate, TestResults } from '@bench/core/types';
import type {
  StructuredAnalysis,
  Suggestion,
  Pattern,
  SegmentAnalysis,
} from '@bench/core/improvement-types';
import { calculateCost } from '@/lib/pricing';

// =============================================================================
// Types
// =============================================================================

export interface AnalysisInput {
  template: PromptTemplate;
  testResults: TestResults;
  productDiversity?: Array<{
    productId: string;
    category: string;
    score: number;
  }>;
}

export interface AnalysisResult {
  analysis: StructuredAnalysis;
  costUsd: number;
  tokensUsed: number;
}

// =============================================================================
// Prompt Building
// =============================================================================

/**
 * Build the analyzer prompt with template and evaluation data
 */
export const buildAnalyzerPrompt = (input: AnalysisInput): string => {
  const { template, testResults, productDiversity } = input;

  const prompt = `You are an expert AI prompt engineer specializing in e-commerce product photography prompts.

## Task
Analyze the template and test results to identify issues, patterns, and improvement opportunities.

## Template Structure
\`\`\`json
${JSON.stringify(
  {
    slug: template.slug,
    templateData: template.templateData,
    variablesSchema: template.variablesSchema,
  },
  null,
  2
)}
\`\`\`

## Test Results
- Mean Score: ${testResults.meanScore.toFixed(2)}
- Median Score: ${testResults.medianScore.toFixed(2)}
- Score Range: ${testResults.minScore.toFixed(2)} - ${testResults.maxScore.toFixed(2)}
- Total Tests: ${testResults.scores.length}

### Per-Product Scores:
${testResults.productScores
  .map((p) => `- ${p.productId}: ${p.score.toFixed(2)}`)
  .join('\n')}

${productDiversity
  ? `### Product Diversity:
${productDiversity
  .map((p) => `- ${p.productId} (${p.category}): ${p.score.toFixed(2)}`)
  .join('\n')}`
  : ''}

## Analysis Requirements

1. **Summary**: 2-3 sentence overview of template performance
2. **Strengths**: List 3-5 things the template does well
3. **Weaknesses**: List 3-5 specific issues or areas for improvement
4. **Patterns**: Identify success and failure patterns with examples
5. **Segment Analysis**: If product diversity data is provided, analyze performance by category
6. **Prioritized Suggestions**: 5-8 concrete improvement suggestions with:
   - Priority (high/medium/low)
   - Category (prompt_structure/variable_usage/style_guidance/technical)
   - Description
   - Rationale
   - Expected impact
   - Confidence (0-1)

## CRITICAL CONSTRAINT FOR SUGGESTIONS

All suggestions MUST be implementable by modifying ONLY the templateData prompts.
**DO NOT suggest:**
- Adding new variables to variablesSchema
- Removing existing variables
- Changing variable names, types, or options
- Product-specific conditional logic

**INSTEAD, suggest:**
- Rewriting prompts to be more universal and robust
- Adding specific guidance within existing prompt text (e.g., anti-glare language)
- Improving how existing variables are used in the templates
- Making technical specifications more flexible for diverse products

**Example GOOD suggestion:**
"Modify the lighting section in templateData to include anti-reflection guidance by default, making it work better for electronics with screens"

**Example BAD suggestion:**
"Add a product_category variable to handle electronics differently from other products"

## Response Format

Return ONLY valid JSON:
{
  "summary": "Brief summary...",
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "patterns": [
    {
      "type": "success",
      "description": "Pattern description",
      "frequency": 0.75,
      "examples": ["Example 1", "Example 2"],
      "confidence": 0.8
    }
  ],
  "segmentAnalysis": [
    {
      "segment": "electronics",
      "meanScore": 7.5,
      "issues": ["Issue 1"],
      "recommendations": ["Recommendation 1"]
    }
  ],
  "prioritizedSuggestions": [
    {
      "id": "suggestion-1",
      "priority": "high",
      "category": "prompt_structure",
      "description": "What to change",
      "rationale": "Why this helps",
      "expectedImpact": "Expected improvement",
      "confidence": 0.85
    }
  ]
}`;

  return prompt;
};

// =============================================================================
// Main Analysis Function
// =============================================================================

/**
 * Analyze a template and generate structured improvement suggestions
 */
export const analyzeTemplate = async (
  input: AnalysisInput,
  model: string = 'claude-sonnet-4-20250514'
): Promise<Result<AnalysisResult>> => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return err(
      createError(
        'VALIDATION_ERROR',
        'ANTHROPIC_API_KEY environment variable is required'
      )
    );
  }

  const client = new Anthropic({ apiKey });
  const prompt = buildAnalyzerPrompt(input);

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return err(createError('EVALUATION_ERROR', 'No text response from Claude'));
    }

    // Parse JSON response
    const parseResult = parseAnalysisResponse(textContent.text);
    if (!parseResult.ok) {
      return parseResult;
    }

    // Calculate cost
    const costResult = calculateCost(model, {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    });

    if (!costResult.ok) {
      console.warn(
        `⚠️  Failed to calculate cost for analysis: ${costResult.error.message}`
      );
      return err(
        createError(
          'EVALUATION_ERROR',
          `Cost calculation failed: ${costResult.error.message}`
        )
      );
    }

    const tokensUsed =
      response.usage.input_tokens + response.usage.output_tokens;

    return ok({
      analysis: parseResult.data,
      costUsd: costResult.data.total,
      tokensUsed,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(
      createError('EVALUATION_ERROR', `Analysis failed: ${message}`, {
        retryable: true,
      })
    );
  }
};

// =============================================================================
// Response Parsing
// =============================================================================

/**
 * Parse and validate the JSON response from Claude
 */
const parseAnalysisResponse = (
  text: string
): Result<StructuredAnalysis> => {
  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      // Try to find JSON object in the text
      const braceMatch = text.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        jsonStr = braceMatch[0];
      }
    }

    const parsed = JSON.parse(jsonStr.trim());

    // Validate and structure the response
    const analysis: StructuredAnalysis = {
      summary: parsed.summary || 'No summary provided',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      patterns: parsePatterns(parsed.patterns || []),
      segmentAnalysis: parseSegmentAnalysis(parsed.segmentAnalysis || []),
      prioritizedSuggestions: parseSuggestions(parsed.prioritizedSuggestions || []),
    };

    return ok(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(
      createError('EVALUATION_ERROR', `Failed to parse analysis: ${message}`)
    );
  }
};

const parsePatterns = (patterns: unknown[]): Pattern[] => {
  return patterns
    .filter((p): p is Record<string, unknown> => typeof p === 'object' && p !== null)
    .map((p) => ({
      type: (p.type === 'success' ? 'success' : 'failure') as 'success' | 'failure',
      description: String(p.description || ''),
      frequency: typeof p.frequency === 'number' ? p.frequency : 0,
      examples: Array.isArray(p.examples)
        ? p.examples.map(String)
        : [],
      confidence: typeof p.confidence === 'number' ? p.confidence : 0.5,
    }));
};

const parseSegmentAnalysis = (segments: unknown[]): SegmentAnalysis[] => {
  return segments
    .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
    .map((s) => ({
      segment: String(s.segment || ''),
      meanScore: typeof s.meanScore === 'number' ? s.meanScore : 0,
      issues: Array.isArray(s.issues) ? s.issues.map(String) : [],
      recommendations: Array.isArray(s.recommendations)
        ? s.recommendations.map(String)
        : [],
    }));
};

const parseSuggestions = (suggestions: unknown[]): Suggestion[] => {
  return suggestions
    .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
    .map((s, idx) => ({
      id: String(s.id || `suggestion-${idx + 1}`),
      priority: (['high', 'medium', 'low'].includes(String(s.priority))
        ? s.priority
        : 'medium') as 'high' | 'medium' | 'low',
      category: (['prompt_structure', 'variable_usage', 'style_guidance', 'technical'].includes(
        String(s.category)
      )
        ? s.category
        : 'prompt_structure') as
        | 'prompt_structure'
        | 'variable_usage'
        | 'style_guidance'
        | 'technical',
      description: String(s.description || ''),
      rationale: String(s.rationale || ''),
      expectedImpact: String(s.expectedImpact || ''),
      confidence: typeof s.confidence === 'number' ? s.confidence : 0.5,
      codeChanges: Array.isArray(s.codeChanges) ? s.codeChanges : undefined,
    }));
};

