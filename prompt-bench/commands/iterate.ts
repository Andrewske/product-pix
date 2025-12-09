/**
 * CLI command for evolutionary prompt iteration
 */

import { parseArgs } from 'node:util';
import { createInterface } from 'node:readline';
import { readFileSync, existsSync, writeFileSync, unlinkSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { resolve, join } from 'node:path';
import { Result, ok, err, createError } from '@bench/core/errors';
import { createSession, saveSession, loadSession, listSessions } from '@bench/core/state';
import { checkConvergence, type ConvergenceResult } from '@bench/core/convergence';
import { evolvePopulation } from '@bench/core/evolution';
import { generateStructuredInsights } from './insights';
import { BatchFileSchema, type BatchFile, type TestCase, type TemplateData, type VariablesSchema } from '@bench/core/types';
import { summarize, getScoreDistribution } from '@bench/core/statistics';
import type { IterationState, PromptVariation, GenerationRecord, ScoreHistoryEntry } from '@bench/core/iteration-types';
import type { BatchSummary } from './insights';
import { createAdminClient } from '@/lib/supabase/admin';
import { loadConfig } from './shared';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CostRecord, GenerationCostEntry } from '@bench/core/iteration-types';

// =============================================================================
// Types
// =============================================================================

interface IterateOptions {
  // Session identification
  template?: string;        // Template slug (for new session)
  batch?: string;          // Initial batch file (for new session)
  session?: string;        // Session ID (for resume)

  // Mode flags
  list?: boolean;          // List all sessions
  status?: boolean;        // Show session status
  approve?: boolean;       // Enter approval mode

  // Configuration overrides
  generations?: number;    // Override max generations
  population?: number;     // Override population size
  target?: number;         // Target score to stop at

  // Output control
  quiet?: boolean;
  json?: boolean;
}

// =============================================================================
// Main Command
// =============================================================================

/**
 * Main iterate command entry point
 */
export const iterateCommand = async (args: string[]): Promise<void> => {
  const options = parseIterateOptions(args);

  try {
    // Handle list mode
    if (options.list) {
      await listSessionsCommand(options);
      return;
    }

    // Handle status mode
    if (options.status && options.session) {
      await showStatusCommand(options);
      return;
    }

    // Load or create session
    const state = options.session
      ? await loadExistingSession(options.session)
      : await createNewSession(options);

    if (!state) return; // Error already logged

    // Main iteration loop
    await runIterationLoop(state, options);

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error: ${message}`);
    process.exit(1);
  }
};

// =============================================================================
// Option Parsing
// =============================================================================

const parseIterateOptions = (args: string[]): IterateOptions => {
  const { values } = parseArgs({
    args,
    options: {
      template: { type: 'string', short: 't' },
      batch: { type: 'string', short: 'b' },
      session: { type: 'string', short: 's' },
      list: { type: 'boolean' },
      status: { type: 'boolean' },
      approve: { type: 'boolean' },
      generations: { type: 'string' },
      population: { type: 'string' },
      target: { type: 'string' },
      quiet: { type: 'boolean', short: 'q' },
      json: { type: 'boolean' },
    },
  });

  return {
    template: values.template as string,
    batch: values.batch as string,
    session: values.session as string,
    list: values.list as boolean,
    status: values.status as boolean,
    approve: values.approve as boolean,
    generations: values.generations ? parseInt(values.generations as string) : undefined,
    population: values.population ? parseInt(values.population as string) : undefined,
    target: values.target ? parseFloat(values.target as string) : undefined,
    quiet: values.quiet as boolean,
    json: values.json as boolean,
  };
};

// =============================================================================
// Helper Functions
// =============================================================================

const loadBatchFile = (filePath: string): Result<BatchFile> => {
  const absolutePath = resolve(process.cwd(), filePath);

  if (!existsSync(absolutePath)) {
    return err(createError('VALIDATION_ERROR', `Batch file not found: ${absolutePath}`));
  }

  try {
    const content = readFileSync(absolutePath, 'utf-8');
    const parsed = JSON.parse(content);
    const validated = BatchFileSchema.parse(parsed);
    return ok(validated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(createError('VALIDATION_ERROR', `Failed to parse batch file: ${message}`));
  }
};

/**
 * Fetch template definition from database
 */
const fetchTemplateSchema = async (
  templateSlug: string,
  version: number
): Promise<Result<VariablesSchema>> => {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('prompt_templates')
      .select('variables_schema')
      .eq('slug', templateSlug)
      .eq('version', version)
      .eq('status', 'active')
      .single();

    if (error) {
      return err(createError('DATABASE_ERROR', `Failed to fetch template: ${error.message}`));
    }

    if (!data || !data.variables_schema) {
      return err(createError('NO_DATA_ERROR', `Template schema not found for ${templateSlug} v${version}`));
    }

    return ok(data.variables_schema as VariablesSchema);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(createError('DATABASE_ERROR', `Database query failed: ${message}`));
  }
};

// =============================================================================
// Session Management
// =============================================================================

const createNewSession = async (options: IterateOptions): Promise<IterationState | null> => {
  // Load config for defaults
  const config = loadConfig();

  const template = options.template || config?.defaults?.template;
  const batch = options.batch || config?.defaults?.batch_file;

  if (!template) {
    console.error('Error: --template is required for new sessions (or set defaults.template in prompt-bench.toml)');
    return null;
  }

  if (!batch) {
    console.error('Error: --batch is required for new sessions (or set defaults.batch_file in prompt-bench.toml)');
    return null;
  }

  console.log(`Creating new iteration session for template: ${template}`);

  const iterationConfig = {
    populationSize: options.population,
    maxGenerations: options.generations,
  };

  const state = createSession(template, 1, iterationConfig);

  // Load batch file as product test set
  const batchResult = loadBatchFile(batch);
  if (!batchResult.ok) {
    console.error(`Failed to load batch file: ${batchResult.error.message}`);
    return null;
  }

  const batchData = batchResult.data;

  // Store product tests (fixed across all generations)
  state.productTests = batchData.tests.map((test: TestCase) => ({
    sourceImage: test.sourceImage,
    variables: test.variables,
    notes: test.notes,
  }));

  console.log(`Loaded ${state.productTests.length} product test cases`);

  // Create single base variation from first product's variables
  const baseVariables = batchData.tests[0].variables;
  const baseVariation: PromptVariation = {
    id: randomUUID(),
    parentIds: [],
    source: 'user' as const,
    templateData: baseVariables as PromptVariation['templateData'],
    rationale: 'Initial base variation from first product',
    confidence: 1.0,
  };

  // Create first generation record with just the base variation
  const firstGeneration: GenerationRecord = {
    generation: 1,
    batchLabel: `iteration-${state.sessionId}-gen-1`,
    variations: [baseVariation],
  };

  // Update state with initial population (just the base variation)
  state.generations.push(firstGeneration);
  state.currentPopulation = [{
    variationId: baseVariation.id,
    fitness: 0, // Will be updated after evaluation
    generation: 1,
  }];

  const saveResult = await saveSession(state);
  if (!saveResult.ok) {
    console.error(`Failed to save session: ${saveResult.error.message}`);
    return null;
  }

  console.log(`Session created: ${state.sessionId}`);
  console.log(`Created 1 base variation to be tested against ${state.productTests.length} products`);
  return state;
};

const loadExistingSession = async (sessionId: string): Promise<IterationState | null> => {
  const result = await loadSession(sessionId);
  if (!result.ok) {
    console.error(`Failed to load session ${sessionId}: ${result.error.message}`);
    return null;
  }

  console.log(`Loaded session: ${result.data.sessionId} (${result.data.templateSlug})`);
  return result.data;
};

// =============================================================================
// Command Handlers
// =============================================================================

const listSessionsCommand = async (options: IterateOptions): Promise<void> => {
  const result = await listSessions();
  if (!result.ok) {
    console.error(`Failed to list sessions: ${result.error.message}`);
    return;
  }

  if (result.data.length === 0) {
    console.log('No sessions found.');
    return;
  }

  if (options.json) {
    console.log(JSON.stringify(result.data, null, 2));
  } else {
    console.log('Iteration Sessions:');
    console.log('==================');
    result.data.forEach(session => {
      console.log(`${session.sessionId} | ${session.templateSlug} | ${session.createdAt} | Gen ${session.generationCount} | Best: ${session.lastBestScore?.toFixed(2) ?? 'N/A'}`);
    });
  }
};

const showStatusCommand = async (options: IterateOptions): Promise<void> => {
  const state = await loadExistingSession(options.session!);
  if (!state) return;

  const convergence = checkConvergence(state, options.target);

  if (options.json) {
    console.log(JSON.stringify({
      session: state,
      convergence,
    }, null, 2));
  } else {
    console.log(`Session: ${state.sessionId}`);
    console.log(`Template: ${state.templateSlug} v${state.templateVersion}`);
    console.log(`Created: ${state.createdAt}`);
    console.log(`Updated: ${state.updatedAt}`);
    console.log(`Generations: ${state.generations.length}/${state.config.maxGenerations}`);
    console.log(`Population: ${state.currentPopulation.length}/${state.config.populationSize}`);

    if (state.scoreHistory.length > 0) {
      const latest = state.scoreHistory[state.scoreHistory.length - 1];
      console.log(`Best Score: ${latest.best.toFixed(2)}/10`);
      console.log(`Mean Score: ${latest.mean.toFixed(2)}/10`);
      console.log(`StdDev: ${latest.stdDev.toFixed(3)}`);
    }

    console.log(`Status: ${convergence.details}`);
  }
};

// =============================================================================
// Iteration Loop
// =============================================================================

const runIterationLoop = async (
  state: IterationState,
  options: IterateOptions
): Promise<void> => {
  // Fetch template schema once at the start
  const schemaResult = await fetchTemplateSchema(state.templateSlug, state.templateVersion);
  if (!schemaResult.ok) {
    console.error(`Failed to fetch template schema: ${schemaResult.error.message}`);
    return;
  }
  const variablesSchema = schemaResult.data;

  while (true) {
    // === NEW: Initialize per-generation costs ===
    const genCosts: CostRecord = { generation: 0, evaluation: 0, insights: 0 };

    // 1. Run current population tests if not evaluated
    if (needsEvaluation(state)) {
      const evalResult = await runAndEvaluatePopulation(state, options);
      if (!evalResult.evaluated) {
        // === NEW: Persist partial costs before breaking ===
        await persistCosts(state);
        break;
      }
      // === NEW: Capture generation/evaluation costs ===
      genCosts.generation = evalResult.costs.generation;
      genCosts.evaluation = evalResult.costs.evaluation;
    }

    // 2. Check convergence (after evaluation)
    const convergence = checkConvergence(state, options.target);
    if (convergence.converged) {
      displayConvergenceMessage(convergence, options);
      break;
    }

    // 3. Generate structured insights
    console.log('🤖 Generating AI insights...');
    const insights = await generateStructuredInsights(buildSummary(state));
    if (!insights.ok) {
      console.error('Failed to generate insights:', insights.error.message);
      // === NEW: Persist partial costs before breaking ===
      updateStateCosts(state, genCosts);
      await persistCosts(state);
      break;
    }
    console.log('✓ Insights generated');

    // === NEW: Capture insights cost ===
    genCosts.insights = insights.data.costUsd;

    // === NEW: Update state and display costs ===
    updateStateCosts(state, genCosts);
    displayGenerationCosts(state.generations.length, genCosts, options);

    // === NEW: Persist costs incrementally (crash resilience) ===
    await persistCosts(state);

    // 4. Evolve population (generate new variations)
    console.log('🧬 Evolving population...');
    const variations = await evolvePopulation(state, insights.data, state.config, variablesSchema);
    if (!variations.ok) {
      console.error('Failed to evolve population:', variations.error.message);
      break;
    }
    console.log(`✓ Generated ${variations.data.length} variations`);

    // 5. Human approval
    const approved = await promptForApproval(variations.data, state, options);
    if (approved.length === 0) {
      console.log('No variations approved. Stopping iteration.');
      break;
    }

    // 6. Update state with approved variations
    updateStateWithApproved(state, approved);

    // 7. Save state
    const saveResult = await saveSession(state);
    if (!saveResult.ok) {
      console.error('Failed to save session:', saveResult.error.message);
      break;
    }

    // 8. Display progress
    displayGenerationSummary(state, options);
  }

  // Final summary
  displayFinalSummary(state, options);
};

// =============================================================================
// Evaluation Functions
// =============================================================================

const needsEvaluation = (state: IterationState): boolean => {
  // Check if current population has been evaluated
  return state.currentPopulation.length === 0 ||
         state.currentPopulation.some(p => p.fitness === 0);
};

// Add interface near top of file (after IterateOptions, around line 45)
interface EvaluationResult {
  evaluated: boolean;
  costs: { generation: number; evaluation: number };
}

// Default costs for error cases
const DEFAULT_COSTS = { generation: 0, evaluation: 0 };

const runAndEvaluatePopulation = async (
  state: IterationState,
  _options: IterateOptions
): Promise<EvaluationResult> => {
  let tempFilePath: string | null = null;

  try {
    // 1. Create batch file from current population variations
    const batchFile = await createBatchFromPopulation(state);
    if (!batchFile.ok) {
      console.error(`Failed to create batch file for session ${state.sessionId}, gen ${state.generations.length}: ${batchFile.error.message}`);
      console.error(`Population size: ${state.currentPopulation.length}, Template: ${state.templateSlug}`);
      return { evaluated: false, costs: DEFAULT_COSTS };
    }

    tempFilePath = batchFile.data.filePath;

    // 2. Generate unique batch label for this evaluation
    const batchLabel = `iteration-${state.sessionId}-gen-${state.generations.length}`;

    // 3. Run the pipeline (run → evaluate → report)
    const { runPipeline } = await import('@bench/core/orchestrator');
    const pipelineResult = await runPipeline({
      templateSlug: state.templateSlug,
      templateVersion: state.templateVersion,
      batchFile: tempFilePath,
      label: batchLabel,
      skipSync: true, // Template should already be synced
      skipEval: false,
      skipReport: false, // Generate HTML report after each generation
      dryRun: false,
      evalModel: 'claude-sonnet-4-20250514', // Use default model
    });

    if (!pipelineResult.ok) {
      console.error(`Pipeline failed for session ${state.sessionId}: ${pipelineResult.error.message}`);
      return { evaluated: false, costs: DEFAULT_COSTS };
    }

    // 4. Update state with evaluation results
    const updateResult = await updateStateWithEvaluationResults(state, batchLabel);
    if (!updateResult.ok) {
      console.error(`Failed to update state with results: ${updateResult.error.message}`);
      return { evaluated: false, costs: DEFAULT_COSTS };
    }

    // 5. Update score history
    updateScoreHistory(state);

    console.log(`✅ Evaluated ${state.currentPopulation.length} variations`);
    return { evaluated: true, costs: pipelineResult.data.costs ?? DEFAULT_COSTS };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Population evaluation failed for session ${state.sessionId}: ${message}`);
    return { evaluated: false, costs: DEFAULT_COSTS };
  } finally {
    // Clean up temporary batch file
    if (tempFilePath && existsSync(tempFilePath)) {
      try {
        unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.warn(`Failed to cleanup temp file ${tempFilePath}: ${cleanupError instanceof Error ? cleanupError.message : 'Unknown error'}`);
      }
    }
  }
};

const buildSummary = (state: IterationState): BatchSummary => {
  // Collect all scored variations from current population
  const scoredVariations = state.currentPopulation
    .map(entry => {
      const variation = state.generations
        .flatMap(gen => gen.variations)
        .find(v => v.id === entry.variationId);
      return variation && variation.score ? { variation, score: variation.score } : null;
    })
    .filter((item): item is { variation: PromptVariation; score: number } => item !== null)
    .sort((a, b) => b.score - a.score);

  if (scoredVariations.length === 0) {
    return {
      label: `iteration-${state.sessionId}`,
      testCount: 0,
      stats: { mean: 0, stdDev: 0, min: 0, max: 0, median: 0 },
      scoreDistribution: {},
      topTests: [],
      bottomTests: [],
    };
  }

  const scores = scoredVariations.map(item => item.score);
  const stats = summarize(scores);
  const scoreDistribution = getScoreDistribution(scores);

  const topTests = scoredVariations.slice(0, 3).map(item => ({
    score: item.score,
    prompt: JSON.stringify(item.variation.templateData), // Simplified prompt representation
    templateData: item.variation.templateData as TemplateData,
  }));

  const bottomTests = scoredVariations.slice(-3).reverse().map(item => ({
    score: item.score,
    prompt: JSON.stringify(item.variation.templateData), // Simplified prompt representation
    templateData: item.variation.templateData as TemplateData,
  }));

  return {
    label: `iteration-${state.sessionId}`,
    testCount: scoredVariations.length,
    stats,
    scoreDistribution,
    topTests,
    bottomTests,
  };
};

// =============================================================================
// Human Approval Interface
// =============================================================================

const promptForApproval = async (
  variations: PromptVariation[],
  state: IterationState,
  options: IterateOptions
): Promise<PromptVariation[]> => {
  if (options.quiet || options.json) {
    // Auto-approve all in quiet/json mode
    return variations;
  }

  console.log(`\n## Proposed Variations for Generation ${state.generations.length + 1}`);
  console.log(`Based on analysis of ${state.currentPopulation.length} tests`);

  variations.forEach((v, i) => {
    console.log(`\n### [${i + 1}] ${v.source} (${v.mutationType || 'n/a'})`);
    console.log(`Confidence: ${(v.confidence * 100).toFixed(0)}%`);
    console.log(`Rationale: ${v.rationale}`);
    console.log('Template:', JSON.stringify(v.templateData, null, 2));
  });

  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const answer = await new Promise<string>((resolve) => {
      readline.question(
        '\nWhich variations to run? (1,2,3 or "all"/"none"): ',
        resolve
      );
    });

    if (answer === 'none') return [];

    if (answer === 'all') return variations;

    // Parse comma-separated indices
    const indices = answer.split(',').map(s => parseInt(s.trim()) - 1);
    return indices.filter(i => i >= 0 && i < variations.length).map(i => variations[i]);
  } finally {
    readline.close();
  }
};

// =============================================================================
// State Updates
// =============================================================================

const updateStateWithApproved = (
  state: IterationState,
  approved: PromptVariation[]
): void => {
  const nextGenerationNumber = state.generations.length + 1;

  // Create new generation record
  const newGeneration: GenerationRecord = {
    generation: nextGenerationNumber,
    batchLabel: `iteration-${state.sessionId}-gen-${nextGenerationNumber}`,
    variations: approved,
  };

  // Add to generations
  state.generations.push(newGeneration);

  // Update current population with approved variations
  state.currentPopulation = approved.map((variation) => ({
    variationId: variation.id,
    fitness: 0, // Will be evaluated in next iteration
    generation: nextGenerationNumber,
  }));

  // Note: Score history is updated during evaluation, not here
};

// =============================================================================
// Population Evaluation Functions
// =============================================================================

/**
 * Extract variations from current population
 */
const extractVariationsFromPopulation = (
  state: IterationState
): Result<PromptVariation[]> => {
  const variations = state.currentPopulation
    .map(entry => {
      const variation = state.generations
        .flatMap(gen => gen.variations)
        .find(v => v.id === entry.variationId);
      return variation || null;
    })
    .filter((v): v is PromptVariation => v !== null);

  if (variations.length === 0) {
    return err(createError('VALIDATION_ERROR', 'No variations found in current population'));
  }

  return ok(variations);
};

/**
 * Create test cases from variations
 */
const createTestCasesFromVariations = (variations: PromptVariation[]): TestCase[] => {
  return variations.map(variation => ({
    variables: variation.templateData,
    notes: `Variation ${variation.id} (${variation.source})`,
  }));
};

/**
 * Write and validate temporary batch file
 */
const writeTempBatchFile = (
  batch: BatchFile,
  sessionId: string
): Result<string> => {
  try {
    // Validate batch
    const validation = BatchFileSchema.safeParse(batch);
    if (!validation.success) {
      return err(createError('VALIDATION_ERROR', `Invalid batch: ${validation.error.message}`));
    }

    // Write to temporary file
    const fileName = `temp-batch-${randomUUID()}.json`;
    const filePath = join(process.cwd(), fileName);
    writeFileSync(filePath, JSON.stringify(validation.data, null, 2), 'utf-8');

    return ok(filePath);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(createError('STORAGE_ERROR', `Failed to write batch file: ${message}`));
  }
};

/**
 * Creates a temporary batch file from current population for evaluation
 * Generates cartesian product of variations × product tests
 */
const createBatchFromPopulation = async (
  state: IterationState
): Promise<Result<{ filePath: string; batch: BatchFile }>> => {
  const variationsResult = extractVariationsFromPopulation(state);
  if (!variationsResult.ok) return variationsResult;

  const variations = variationsResult.data;

  // Create cartesian product: each variation tested against all products
  const tests: TestCase[] = [];

  for (const variation of variations) {
    for (let productIndex = 0; productIndex < state.productTests.length; productIndex++) {
      const product = state.productTests[productIndex];

      // Merge variation templateData with product source image
      // Variation provides the evolved prompt, product provides the source image
      tests.push({
        sourceImage: product.sourceImage,
        variables: variation.templateData,
        notes: `Variation ${variation.id.slice(0, 8)} on product ${productIndex + 1}`,
      });
    }
  }

  console.log(`Created ${tests.length} tests (${variations.length} variations × ${state.productTests.length} products)`);

  const batch: BatchFile = {
    label: `iteration-${state.sessionId}-population`,
    tests,
  };

  const filePathResult = writeTempBatchFile(batch, state.sessionId);
  if (!filePathResult.ok) return filePathResult;

  return ok({ filePath: filePathResult.data, batch });
};

/**
 * Fetch evaluation results from database using optimized query
 */
const fetchEvaluationResults = async (
  batchLabel: string
): Promise<Result<Array<{ id: string; inputs: any; score: number }>>> => {
  try {
    const supabase = createAdminClient();

    // Use inner join to only get tests with evaluations
    const { data: evaluations, error } = await supabase
      .from('prompt_tests')
      .select(`id, inputs, prompt_evaluations!inner(score_overall)`)
      .eq('batch_label', batchLabel)
      .eq('status', 'completed');

    if (error) {
      return err(createError('DATABASE_ERROR', `Failed to fetch evaluations for batch "${batchLabel}": ${error.message}`));
    }

    if (!evaluations || evaluations.length === 0) {
      return err(createError('NO_DATA_ERROR', `No evaluation results found for batch "${batchLabel}". Verify tests completed successfully.`));
    }

    const results = evaluations
      .map(test => {
        const score = test.prompt_evaluations?.[0]?.score_overall;
        return score ? { id: test.id, inputs: test.inputs, score } : null;
      })
      .filter((item): item is { id: string; inputs: any; score: number } => item !== null);

    return ok(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(createError('DATABASE_ERROR', `Database query failed: ${message}`));
  }
};

/**
 * Deep equality check for objects (order-independent)
 */
const deepEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  return keys1.every(key => {
    if (!keys2.includes(key)) return false;
    return deepEqual(obj1[key], obj2[key]);
  });
};

/**
 * Find matching variation in current generation using deep equality
 */
const findMatchingVariation = (
  currentGeneration: GenerationRecord,
  inputs: any
): PromptVariation | null => {
  return currentGeneration.variations.find(v =>
    deepEqual(v.templateData, inputs)
  ) || null;
};

/**
 * Update variation and population entry with score
 */
const updateVariationWithScore = (
  state: IterationState,
  variationId: string,
  score: number
): boolean => {
  // Find and update variation
  for (const gen of state.generations) {
    const variation = gen.variations.find(v => v.id === variationId);
    if (variation) {
      variation.score = score;

      // Update population entry fitness
      const populationEntry = state.currentPopulation.find(p => p.variationId === variationId);
      if (populationEntry) {
        populationEntry.fitness = score;
      }

      return true;
    }
  }
  return false;
};

/**
 * Update state with evaluation results from database
 * Aggregates scores across multiple product tests per variation
 */
const updateStateWithEvaluationResults = async (
  state: IterationState,
  batchLabel: string
): Promise<Result<void>> => {
  const evaluationsResult = await fetchEvaluationResults(batchLabel);
  if (!evaluationsResult.ok) return evaluationsResult;

  const evaluations = evaluationsResult.data;
  const currentGen = state.generations[state.generations.length - 1];

  // Group evaluations by variation (match by templateData)
  const variationScores = new Map<string, Array<{ productIndex: number; score: number }>>();

  for (const { inputs, score } of evaluations) {
    const variation = findMatchingVariation(currentGen, inputs);
    if (!variation) continue;

    if (!variationScores.has(variation.id)) {
      variationScores.set(variation.id, []);
    }

    // Determine product index based on test order
    const scores = variationScores.get(variation.id)!;
    const productIndex = scores.length; // Sequential product index for this variation

    scores.push({ productIndex, score });
  }

  // Aggregate scores and update variations
  let updatedCount = 0;
  for (const [variationId, scores] of variationScores.entries()) {
    // Calculate mean score across all products
    const meanScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;

    // Update variation with aggregated score and individual scores
    const variation = currentGen.variations.find(v => v.id === variationId);
    if (variation) {
      variation.score = meanScore;
      variation.individualScores = scores;

      // Update population entry fitness
      const populationEntry = state.currentPopulation.find(p => p.variationId === variationId);
      if (populationEntry) {
        populationEntry.fitness = meanScore;
      }

      updatedCount++;
      console.log(`Variation ${variationId.slice(0, 8)}: mean=${meanScore.toFixed(2)} across ${scores.length} products`);
    }
  }

  if (updatedCount === 0) {
    return err(createError('NO_DATA_ERROR',
      `No variations matched evaluation results for session ${state.sessionId}. Check template data consistency.`
    ));
  }

  console.log(`Updated ${updatedCount} variations with aggregated scores`);
  return ok(undefined);
};

const updateScoreHistory = (state: IterationState): void => {
  // Get all scores from current population
  const scores = state.currentPopulation
    .map(entry => entry.fitness)
    .filter(score => score > 0); // Only include evaluated scores

  if (scores.length === 0) return;

  const stats = summarize(scores);

  const historyEntry: ScoreHistoryEntry = {
    generation: state.generations.length,
    best: stats.max,
    mean: stats.mean,
    stdDev: stats.stdDev,
  };

  state.scoreHistory.push(historyEntry);
};

// =============================================================================
// Display Functions
// =============================================================================

const displayConvergenceMessage = (
  convergence: ConvergenceResult,
  options: IterateOptions
): void => {
  if (options.json) {
    console.log(JSON.stringify({ converged: true, convergence }, null, 2));
  } else {
    console.log(`\n🎯 Iteration converged: ${convergence.reason}`);
    console.log(convergence.details);
  }
};

const displayGenerationSummary = (
  state: IterationState,
  options: IterateOptions
): void => {
  if (options.quiet) return;

  const latest = state.scoreHistory[state.scoreHistory.length - 1];
  if (latest) {
    console.log(`\n📊 Generation ${state.generations.length} Results:`);
    console.log(`Best: ${latest.best.toFixed(2)} | Mean: ${latest.mean.toFixed(2)} | StdDev: ${latest.stdDev.toFixed(3)}`);
  }
};

const displayFinalSummary = (
  state: IterationState,
  options: IterateOptions
): void => {
  if (options.quiet) return;

  console.log(`\n🏁 Iteration Complete!`);
  console.log(`Session: ${state.sessionId}`);
  console.log(`Generations: ${state.generations.length}`);
  console.log(`Template: ${state.templateSlug}`);

  if (state.scoreHistory.length > 0) {
    const final = state.scoreHistory[state.scoreHistory.length - 1];
    console.log(`Final Best Score: ${final.best.toFixed(2)}/10`);
  }

  // Display total costs
  const total = state.totalCosts;
  const grandTotal = total.generation + total.evaluation + total.insights;
  console.log(`\n--- Total Costs ---`);
  console.log(`Generation: $${total.generation.toFixed(4)}`);
  console.log(`Evaluation: $${total.evaluation.toFixed(4)}`);
  console.log(`Insights:   $${total.insights.toFixed(4)}`);
  console.log(`Grand Total: $${grandTotal.toFixed(4)}`);
};

const displayGenerationCosts = (
  generation: number,
  costs: CostRecord,
  options: IterateOptions
): void => {
  if (options.quiet) return;

  const total = costs.generation + costs.evaluation + costs.insights;
  console.log(`\n💰 Generation ${generation} Costs:`);
  console.log(`   Generation: $${costs.generation.toFixed(4)}`);
  console.log(`   Evaluation: $${costs.evaluation.toFixed(4)}`);
  console.log(`   Insights:   $${costs.insights.toFixed(4)}`);
  console.log(`   Total:      $${total.toFixed(4)}`);
};

const updateStateCosts = (state: IterationState, costs: CostRecord): void => {
  const entry: GenerationCostEntry = {
    generation: state.generations.length,
    timestamp: new Date().toISOString(),
    costs,
    total: costs.generation + costs.evaluation + costs.insights,
  };

  state.costHistory.push(entry);
  state.totalCosts.generation += costs.generation;
  state.totalCosts.evaluation += costs.evaluation;
  state.totalCosts.insights += costs.insights;
};

// Note: imports added in Phase 1:
// import { writeFile, mkdir } from 'node:fs/promises';
// import { dirname } from 'node:path';
// import { fileURLToPath } from 'node:url';

// Use module-relative path (not process.cwd() which is fragile)
const __dirname = dirname(fileURLToPath(import.meta.url));
const SESSIONS_DIR = join(__dirname, '..', 'sessions');

const writeCostsToCsv = async (state: IterationState): Promise<Result<void>> => {
  const csvPath = join(SESSIONS_DIR, `${state.sessionId}-costs.csv`);

  const headers = 'generation,timestamp,generation_cost,evaluation_cost,insights_cost,total\n';
  const rows = state.costHistory.map(entry =>
    `${entry.generation},${entry.timestamp},${entry.costs.generation.toFixed(4)},${entry.costs.evaluation.toFixed(4)},${entry.costs.insights.toFixed(4)},${entry.total.toFixed(4)}`
  ).join('\n');

  const total = state.totalCosts;
  const grandTotal = total.generation + total.evaluation + total.insights;
  const summary = `\nTOTAL,,${total.generation.toFixed(4)},${total.evaluation.toFixed(4)},${total.insights.toFixed(4)},${grandTotal.toFixed(4)}`;

  try {
    // Ensure sessions directory exists (handles fresh clones, gitignored dirs)
    await mkdir(SESSIONS_DIR, { recursive: true });
    await writeFile(csvPath, headers + rows + summary, 'utf-8');
    console.log(`📄 Cost report saved: ${csvPath}`);
    return ok(undefined);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(createError('STORAGE_ERROR', `Failed to write CSV: ${message}`));
  }
};

const writeCostsToDatabase = async (state: IterationState): Promise<Result<void>> => {
  const supabase = createAdminClient();

  const total = state.totalCosts;
  const grandTotal = total.generation + total.evaluation + total.insights;

  const { error } = await (supabase as any)
    .from('iteration_costs')
    .upsert({
      session_id: state.sessionId,
      template_slug: state.templateSlug,
      generation_count: state.generations.length,
      generation_cost: total.generation,
      evaluation_cost: total.evaluation,
      insights_cost: total.insights,
      total_cost: grandTotal,
      cost_details: state.costHistory,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'session_id' });

  if (error) {
    return err(createError('DATABASE_ERROR', `Failed to save costs: ${error.message}`));
  }

  return ok(undefined);
};

const persistCosts = async (state: IterationState): Promise<void> => {
  if (state.costHistory.length === 0) return;

  // Database is source of truth - persist there first
  const dbResult = await writeCostsToDatabase(state);
  if (!dbResult.ok) {
    console.warn(`⚠️ Database save failed: ${dbResult.error.message}`);
  }

  // CSV is a derived export for convenience
  const csvResult = await writeCostsToCsv(state);
  if (!csvResult.ok) {
    console.warn(`⚠️ CSV save failed: ${csvResult.error.message}`);
  }
};