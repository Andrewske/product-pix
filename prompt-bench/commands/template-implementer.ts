/**
 * AI Implementer Agent - Generates improved template code based on suggestions
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Result } from '@bench/core/errors';
import { ok, err, createError } from '@bench/core/errors';
import type { PromptTemplate } from '@bench/core/types';
import type { Suggestion, TemplateChange } from '@bench/core/improvement-types';
import { calculateCost } from '@/lib/pricing';
import { validateTemplateCode } from '@bench/core/template-io';

// =============================================================================
// Types
// =============================================================================

export interface ImplementationInput {
  template: PromptTemplate;
  suggestions: Suggestion[];
  analysisSummary: string;
}

export interface ImplementationResult {
  code: string;
  changes: TemplateChange[];
  costUsd: number;
  tokensUsed: number;
}

// =============================================================================
// Prompt Building
// =============================================================================

/**
 * Build the implementer prompt with template and suggestions
 */
export const buildImplementerPrompt = (input: ImplementationInput): string => {
  const { template, suggestions, analysisSummary } = input;

  const prompt = `You are an expert TypeScript developer specializing in prompt template code generation.

## Task
Generate an improved version of the template code that implements the provided suggestions.

## Current Template
\`\`\`typescript
import { type PromptTemplate } from '@bench/core/types';

export const ${template.slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('_')
    .toUpperCase()}: Omit<PromptTemplate, 'id' | 'createdBy' | 'createdAt'> = {
  slug: ${JSON.stringify(template.slug)},
  version: ${template.version},
  status: ${JSON.stringify(template.status)},
  templateData: ${JSON.stringify(template.templateData, null, 2)},
  variablesSchema: ${JSON.stringify(template.variablesSchema, null, 2)},
};
\`\`\`

## Analysis Summary
${analysisSummary}

## Improvement Suggestions
${suggestions
  .map(
    (s, idx) => `
${idx + 1}. **[${s.priority.toUpperCase()}] ${s.category}**: ${s.description}
   - Rationale: ${s.rationale}
   - Expected Impact: ${s.expectedImpact}
   - Confidence: ${(s.confidence * 100).toFixed(0)}%`
  )
  .join('\n')}

## Requirements

1. **Generate complete TypeScript code** for the improved template
2. **Preserve the template structure** - same export format, same interface
3. **Implement all high-priority suggestions** and as many medium-priority as feasible
4. **DO NOT MODIFY THE variablesSchema** - You MUST NOT add, remove, or change any variables
5. **ONLY MODIFY templateData** - Improve the prompt text to work better with EXISTING variables
6. **Make prompts more robust** - The goal is to make the same variables produce better results for diverse products
7. **Include clear comments** explaining key changes
8. **Ensure valid TypeScript syntax** - the code must compile

## CRITICAL CONSTRAINTS

**FORBIDDEN:**
- ❌ Adding new variables to variablesSchema
- ❌ Removing existing variables
- ❌ Changing variable names, types, or options
- ❌ Adding conditional logic based on product categories

**ALLOWED:**
- ✅ Rewriting templateData prompts to be more universal
- ✅ Adding anti-glare/reflection handling to existing lighting descriptions
- ✅ Making composition guidance work for both compact and flat/wide products
- ✅ Improving negative prompts to exclude more unwanted elements
- ✅ Adjusting technical specifications for better cross-product performance

**Example of GOOD changes:**
- Before: "{{lighting_style}} studio lighting"
- After: "{{lighting_style}} studio lighting, optimized to minimize reflections and glare while maintaining depth"

**Example of BAD changes:**
- Adding "product_category" variable and using it conditionally

## Response Format

Return a JSON object with two fields:

\`\`\`json
{
  "code": "// Complete TypeScript code here...",
  "changes": [
    {
      "type": "modification",
      "path": "templateData.subject",
      "oldValue": "old value",
      "newValue": "new value",
      "description": "What changed and why"
    }
  ]
}
\`\`\`

The "code" field should contain the complete, valid TypeScript template code.
The "changes" array should list all modifications made.`;

  return prompt;
};

// =============================================================================
// Main Implementation Function
// =============================================================================

/**
 * Generate improved template code based on suggestions
 */
export const implementSuggestions = async (
  input: ImplementationInput,
  model: string = 'claude-sonnet-4-20250514'
): Promise<Result<ImplementationResult>> => {
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
  const prompt = buildImplementerPrompt(input);

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 4096,
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
    const parseResult = parseImplementationResponse(textContent.text);
    if (!parseResult.ok) {
      return parseResult;
    }

    // Validate generated code
    const validationResult = validateTemplateCode(parseResult.data.code);
    if (!validationResult.ok) {
      return err(
        createError(
          'VALIDATION_ERROR',
          `Generated code validation failed: ${validationResult.error.message}`
        )
      );
    }

    // Calculate cost
    const costResult = calculateCost(model, {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    });

    if (!costResult.ok) {
      console.warn(
        `⚠️  Failed to calculate cost for implementation: ${costResult.error.message}`
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
      code: parseResult.data.code,
      changes: parseResult.data.changes,
      costUsd: costResult.data.total,
      tokensUsed,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(
      createError('EVALUATION_ERROR', `Implementation failed: ${message}`, {
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
const parseImplementationResponse = (
  text: string
): Result<{ code: string; changes: TemplateChange[] }> => {
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

    if (!parsed.code || typeof parsed.code !== 'string') {
      return err(
        createError('VALIDATION_ERROR', 'Response missing "code" field')
      );
    }

    const changes = Array.isArray(parsed.changes)
      ? parsed.changes.map(parseChange)
      : [];

    return ok({
      code: parsed.code,
      changes,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(
      createError('EVALUATION_ERROR', `Failed to parse implementation: ${message}`)
    );
  }
};

const parseChange = (change: unknown): TemplateChange => {
  if (typeof change !== 'object' || change === null) {
    return {
      type: 'modification',
      path: 'unknown',
      description: 'Invalid change object',
    };
  }

  const c = change as Record<string, unknown>;

  return {
    type: (['addition', 'removal', 'modification', 'logic_change'].includes(
      String(c.type)
    )
      ? c.type
      : 'modification') as TemplateChange['type'],
    path: String(c.path || 'unknown'),
    oldValue: c.oldValue,
    newValue: c.newValue,
    lineNumber: typeof c.lineNumber === 'number' ? c.lineNumber : undefined,
    description: String(c.description || 'Change made'),
  };
};

