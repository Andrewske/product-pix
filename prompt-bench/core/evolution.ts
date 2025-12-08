/**
 * Evolution engine for prompt iteration system
 */

import Anthropic from '@anthropic-ai/sdk';
import { Result, ok, err, createError } from '@bench/core/errors';
import {
  IterationState,
  PromptVariation,
  MutationType,
  PopulationEntry,
  StructuredInsight,
  IterationConfig,
  SuccessPattern,
  FailurePattern,
} from '@bench/core/iteration-types';
import type { TemplateData, VariablesSchema, VariableDef } from '@bench/core/types';
import { randomUUID } from 'node:crypto';

// =============================================================================
// Types
// =============================================================================

/**
 * Context for evolution operations
 */
interface EvolutionContext {
  successPatterns: string[];
  failurePatterns: string[];
  variablesSchema: VariablesSchema;
}

// =============================================================================
// Selection Functions
// =============================================================================

/**
 * Tournament selection for parent selection
 */
export const selectParents = (
  population: PopulationEntry[],
  count: number,
  tournamentSize: number = 3
): string[] => {
  const selected: string[] = [];

  for (let i = 0; i < count; i++) {
    // Select random candidates for tournament
    const candidates: PopulationEntry[] = [];
    for (let j = 0; j < tournamentSize; j++) {
      const randomIndex = Math.floor(Math.random() * population.length);
      candidates.push(population[randomIndex]);
    }

    // Select the best from tournament
    const winner = candidates.reduce((best, current) =>
      current.fitness > best.fitness ? current : best
    );

    selected.push(winner.variationId);
  }

  return selected;
};

// =============================================================================
// Mutation Functions
// =============================================================================

/**
 * Generate a mutation variation from a parent
 */
export const generateMutation = async (
  parent: TemplateData,
  mutationType: MutationType,
  context: EvolutionContext
): Promise<Result<PromptVariation>> => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return err(createError('VALIDATION_ERROR', 'ANTHROPIC_API_KEY environment variable is required'));
  }

  const client = new Anthropic({ apiKey });

  const prompt = buildMutationPrompt(parent, mutationType, context);

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return err(createError('EVALUATION_ERROR', 'No text response from Claude'));
    }

    const parseResult = parseVariationResponse(textContent.text, context.variablesSchema);
    if (!parseResult.ok) {
      return parseResult;
    }

    const variation: PromptVariation = {
      id: randomUUID(),
      parentIds: [], // Will be set by caller
      source: 'mutation',
      mutationType,
      templateData: parseResult.data.templateData,
      rationale: parseResult.data.rationale,
      confidence: parseResult.data.confidence,
    };

    return ok(variation);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(createError('EVALUATION_ERROR', `Mutation generation failed: ${message}`));
  }
};

/**
 * Generate a crossover variation from two parents
 */
export const generateCrossover = async (
  parent1: TemplateData,
  parent2: TemplateData,
  weights: { p1: number; p2: number },
  context: EvolutionContext
): Promise<Result<PromptVariation>> => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return err(createError('VALIDATION_ERROR', 'ANTHROPIC_API_KEY environment variable is required'));
  }

  const client = new Anthropic({ apiKey });

  const prompt = buildCrossoverPrompt(parent1, parent2, weights, context);

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return err(createError('EVALUATION_ERROR', 'No text response from Claude'));
    }

    const parseResult = parseVariationResponse(textContent.text, context.variablesSchema);
    if (!parseResult.ok) {
      return parseResult;
    }

    const variation: PromptVariation = {
      id: randomUUID(),
      parentIds: [], // Will be set by caller
      source: 'crossover',
      templateData: parseResult.data.templateData,
      rationale: parseResult.data.rationale,
      confidence: parseResult.data.confidence,
    };

    return ok(variation);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(createError('EVALUATION_ERROR', `Crossover generation failed: ${message}`));
  }
};

/**
 * Generate a wild variation (experimental)
 */
export const generateWild = async (
  baseTemplate: TemplateData,
  avoidPatterns: string[],
  context: EvolutionContext
): Promise<Result<PromptVariation>> => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return err(createError('VALIDATION_ERROR', 'ANTHROPIC_API_KEY environment variable is required'));
  }

  const client = new Anthropic({ apiKey });

  const prompt = buildWildPrompt(baseTemplate, avoidPatterns, context);

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return err(createError('EVALUATION_ERROR', 'No text response from Claude'));
    }

    const parseResult = parseVariationResponse(textContent.text, context.variablesSchema);
    if (!parseResult.ok) {
      return parseResult;
    }

    const variation: PromptVariation = {
      id: randomUUID(),
      parentIds: [],
      source: 'wild',
      mutationType: 'wild',
      templateData: parseResult.data.templateData,
      rationale: parseResult.data.rationale,
      confidence: parseResult.data.confidence,
    };

    return ok(variation);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(createError('EVALUATION_ERROR', `Wild variation generation failed: ${message}`));
  }
};

// =============================================================================
// Main Evolution Function
// =============================================================================

/**
 * Evolve the population to create new generation
 */
export const evolvePopulation = async (
  state: IterationState,
  insights: StructuredInsight,
  config: IterationConfig,
  variablesSchema: VariablesSchema
): Promise<Result<PromptVariation[]>> => {
  const variations: PromptVariation[] = [];

  // Extract patterns from insights
  const successPatterns = insights.successPatterns?.map((p: SuccessPattern) => p.pattern) || [];
  const failurePatterns = insights.failurePatterns?.map((p: FailurePattern) => p.pattern) || [];
  const context: EvolutionContext = { successPatterns, failurePatterns, variablesSchema };

  // Elite selection - keep top performers unchanged
  const elites = getEliteVariations(state, config.eliteCount);
  variations.push(...elites);

  // Calculate remaining slots
  const remaining = config.populationSize - config.eliteCount;
  const mutations = Math.floor(remaining * config.mutationRate);
  const crossovers = Math.floor(remaining * config.crossoverRate);
  const wilds = remaining - mutations - crossovers;

  // Generate mutations
  for (let i = 0; i < mutations; i++) {
    const parentIds = selectParents(state.currentPopulation, 1);
    const parentTemplate = getVariationTemplateData(parentIds[0], state);

    if (!parentTemplate) continue;

    const mutationTypes: MutationType[] = ['wording', 'addition', 'removal', 'substitution', 'emphasis'];
    const mutationType = mutationTypes[Math.floor(Math.random() * mutationTypes.length)];

    const result = await generateMutation(parentTemplate, mutationType, context);
    if (result.ok) {
      result.data.parentIds = parentIds;
      variations.push(result.data);
    }

    // Rate limit API calls
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Generate crossovers
  for (let i = 0; i < crossovers; i++) {
    const parentIds = selectParents(state.currentPopulation, 2);
    const parent1Template = getVariationTemplateData(parentIds[0], state);
    const parent2Template = getVariationTemplateData(parentIds[1], state);

    if (!parent1Template || !parent2Template) continue;

    // Get fitness scores for weighting
    const p1Fitness = state.currentPopulation.find(p => p.variationId === parentIds[0])?.fitness || 0;
    const p2Fitness = state.currentPopulation.find(p => p.variationId === parentIds[1])?.fitness || 0;

    const weights = { p1: p1Fitness, p2: p2Fitness };

    const result = await generateCrossover(parent1Template, parent2Template, weights, context);
    if (result.ok) {
      result.data.parentIds = parentIds;
      variations.push(result.data);
    }

    // Rate limit API calls
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Generate wild variations
  for (let i = 0; i < wilds; i++) {
    const baseTemplate = getBaseTemplate(state);

    const result = await generateWild(baseTemplate, failurePatterns, context);
    if (result.ok) {
      variations.push(result.data);
    }

    // Rate limit API calls
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return ok(variations);
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get template data for a variation ID from state
 */
export const getVariationTemplateData = (
  variationId: string,
  state: IterationState
): TemplateData | null => {
  // Look through all generations for the variation
  for (const generation of state.generations) {
    const variation = generation.variations.find(v => v.id === variationId);
    if (variation) {
      return variation.templateData as TemplateData;
    }
  }
  return null;
};

/**
 * Get elite variations to carry over unchanged
 */
const getEliteVariations = (state: IterationState, eliteCount: number): PromptVariation[] => {
  const elites: PromptVariation[] = [];

  // Sort population by fitness (descending)
  const sorted = [...state.currentPopulation].sort((a, b) => b.fitness - a.fitness);

  for (let i = 0; i < Math.min(eliteCount, sorted.length); i++) {
    const variationId = sorted[i].variationId;
    const template = getVariationTemplateData(variationId, state);

    if (template) {
      elites.push({
        id: variationId,
        parentIds: [], // Elites don't have new parents
        source: 'elite', // Elite performer carried over from previous generation
        templateData: template,
        rationale: 'Elite performer carried over from previous generation',
        confidence: 1.0,
      });
    }
  }

  return elites;
};

/**
 * Get base template for wild variations
 */
const getBaseTemplate = (state: IterationState): TemplateData => {
  // Use the best performing variation as base, or first generation if none
  if (state.currentPopulation.length > 0) {
    const best = state.currentPopulation.reduce((best, current) =>
      current.fitness > best.fitness ? current : best
    );
    const template = getVariationTemplateData(best.variationId, state);
    if (template) return template;
  }

  // Fallback to first variation of first generation
  const firstGen = state.generations[0];
  if (firstGen && firstGen.variations.length > 0) {
    return firstGen.variations[0].templateData as TemplateData;
  }

  // Ultimate fallback
  return {
    subject: 'Professional e-commerce product photo',
    background: 'clean white background',
    lighting: 'soft studio lighting',
    camera: 'high-end DSLR camera',
    style: 'commercial product photography',
    quality: '8K resolution, sharp focus',
    negative: 'blurry, distorted, low quality',
  };
};

// =============================================================================
// Prompt Builders
// =============================================================================

/**
 * Build schema description for AI prompts
 */
const buildSchemaDescription = (schema: VariablesSchema): string => {
  const fields = Object.entries(schema).map(([key, spec]) => {
    const required = spec.required ? '(required)' : '(optional)';
    const type = spec.type === 'enum' ? `enum [${spec.options?.join(', ')}]` : spec.type;
    return `  - ${key}: ${type} ${required} - ${spec.description}`;
  }).join('\n');

  return `Template Variables Schema:\n${fields}`;
};

/**
 * Build example JSON structure from schema
 */
const buildSchemaExample = (schema: VariablesSchema): string => {
  const fields = Object.keys(schema).map(key => `"${key}": "..."`).join(', ');
  return `{ ${fields} }`;
};

const buildMutationPrompt = (
  parent: TemplateData,
  mutationType: MutationType,
  context: EvolutionContext
): string => {
  const mutationDescriptions: Record<MutationType, string> = {
    wording: 'Change phrasing while keeping intent',
    addition: 'Add new descriptive elements',
    removal: 'Simplify by removing elements',
    substitution: 'Replace one concept with another',
    emphasis: 'Strengthen or weaken an aspect',
    wild: 'Experimental/creative variation',
  };

  const schemaDesc = buildSchemaDescription(context.variablesSchema);
  const schemaExample = buildSchemaExample(context.variablesSchema);

  return `You are an expert AI prompt engineer. Mutate this e-commerce product photo prompt.

Mutation Type: ${mutationType}
- ${mutationDescriptions[mutationType]}

${schemaDesc}

Current Template Variables:
${JSON.stringify(parent, null, 2)}

Success Patterns to Reinforce: ${context.successPatterns.join(', ') || 'None'}
Failure Patterns to Avoid: ${context.failurePatterns.join(', ') || 'None'}

IMPORTANT: Your response MUST use the exact variable names from the schema above.

Return JSON only:
{
  "templateData": ${schemaExample},
  "rationale": "Why this mutation should improve scores",
  "confidence": 0.0-1.0
}`;
};

const buildCrossoverPrompt = (
  parent1: TemplateData,
  parent2: TemplateData,
  weights: { p1: number; p2: number },
  context: EvolutionContext
): string => {
  const higherScoring = weights.p1 >= weights.p2 ? 'Parent 1' : 'Parent 2';
  const schemaDesc = buildSchemaDescription(context.variablesSchema);
  const schemaExample = buildSchemaExample(context.variablesSchema);

  return `You are an expert AI prompt engineer. Combine these two successful prompts.

${schemaDesc}

Parent 1 (Score: ${weights.p1.toFixed(2)}):
${JSON.stringify(parent1, null, 2)}

Parent 2 (Score: ${weights.p2.toFixed(2)}):
${JSON.stringify(parent2, null, 2)}

Create a child that combines the best elements. Weight toward ${higherScoring}.

IMPORTANT: Your response MUST use the exact variable names from the schema above.

Return JSON only:
{
  "templateData": ${schemaExample},
  "rationale": "Why this combination should improve scores",
  "confidence": 0.0-1.0
}`;
};

const buildWildPrompt = (
  baseTemplate: TemplateData,
  avoidPatterns: string[],
  context: EvolutionContext
): string => {
  const schemaDesc = buildSchemaDescription(context.variablesSchema);
  const schemaExample = buildSchemaExample(context.variablesSchema);

  return `You are an expert AI prompt engineer. Create an experimental variation.

${schemaDesc}

Base Template (for reference):
${JSON.stringify(baseTemplate, null, 2)}

Patterns to AVOID (known failures): ${avoidPatterns.join(', ') || 'None'}

Create something novel and creative that hasn't been tried. Be bold but professional.

IMPORTANT: Your response MUST use the exact variable names from the schema above.

Return JSON only:
{
  "templateData": ${schemaExample},
  "rationale": "Why this experimental approach might work",
  "confidence": 0.0-1.0
}`;
};

// =============================================================================
// Response Parsers
// =============================================================================

/**
 * Validate that templateData matches the expected schema
 */
const validateTemplateData = (
  templateData: any,
  schema: VariablesSchema
): Result<void> => {
  const requiredFields = Object.entries(schema)
    .filter(([_, spec]) => spec.required)
    .map(([key, _]) => key);

  const dataKeys = Object.keys(templateData);
  const schemaKeys = Object.keys(schema);

  // Check for missing required fields
  const missingRequired = requiredFields.filter(key => !dataKeys.includes(key));
  if (missingRequired.length > 0) {
    return err(createError('VALIDATION_ERROR',
      `Missing required variables: ${missingRequired.join(', ')}`
    ));
  }

  // Check for unexpected fields
  const unexpectedFields = dataKeys.filter(key => !schemaKeys.includes(key));
  if (unexpectedFields.length > 0) {
    return err(createError('VALIDATION_ERROR',
      `Unexpected variables: ${unexpectedFields.join(', ')}. Expected: ${schemaKeys.join(', ')}`
    ));
  }

  return ok(undefined);
};

const parseVariationResponse = (
  text: string,
  schema: VariablesSchema
): Result<{ templateData: TemplateData; rationale: string; confidence: number }> => {
  try {
    // Extract JSON from response
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr.trim());

    // Validate required fields
    if (!parsed.templateData || typeof parsed.templateData !== 'object') {
      return err(createError('EVALUATION_ERROR', 'Missing or invalid templateData'));
    }
    if (!parsed.rationale || typeof parsed.rationale !== 'string') {
      return err(createError('EVALUATION_ERROR', 'Missing or invalid rationale'));
    }
    if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
      return err(createError('EVALUATION_ERROR', 'Missing or invalid confidence (must be 0-1)'));
    }

    // Validate templateData matches schema
    const validationResult = validateTemplateData(parsed.templateData, schema);
    if (!validationResult.ok) {
      return validationResult;
    }

    return ok({
      templateData: parsed.templateData,
      rationale: parsed.rationale,
      confidence: parsed.confidence,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(createError('EVALUATION_ERROR', `Failed to parse variation response: ${message}`));
  }
};