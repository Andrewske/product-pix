/**
 * CLI command for evolutionary prompt iteration
 */

import { parseArgs } from 'node:util';
import { createInterface } from 'node:readline';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Result, ok, err, createError } from '@bench/core/errors';
import { createSession, saveSession, loadSession, listSessions } from '@bench/core/state';
import { checkConvergence, type ConvergenceResult } from '@bench/core/convergence';
import { evolvePopulation } from '@bench/core/evolution';
import { generateStructuredInsights } from './insights';
import { BatchFileSchema, type BatchFile, type TestCase, type TemplateData } from '@bench/core/types';
import { summarize, getScoreDistribution } from '@bench/core/statistics';
import type { IterationState, PromptVariation, GenerationRecord } from '@bench/core/iteration-types';
import type { BatchSummary } from './insights';

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

// =============================================================================
// Session Management
// =============================================================================

const createNewSession = async (options: IterateOptions): Promise<IterationState | null> => {
  if (!options.template) {
    console.error('Error: --template is required for new sessions');
    return null;
  }

  if (!options.batch) {
    console.error('Error: --batch is required for new sessions');
    return null;
  }

  console.log(`Creating new iteration session for template: ${options.template}`);

  const config = {
    populationSize: options.population,
    maxGenerations: options.generations,
  };

  const state = createSession(options.template, 1, config);

  // Load initial batch and create first generation
  const batchResult = loadBatchFile(options.batch!);
  if (!batchResult.ok) {
    console.error(`Failed to load batch file: ${batchResult.error.message}`);
    return null;
  }

  const batch = batchResult.data;
  const initialVariations: PromptVariation[] = batch.tests.map((test: TestCase, index: number) => ({
    id: `init-${Date.now()}-${index}`,
    parentIds: [],
    source: 'user' as const,
    templateData: test.variables as PromptVariation['templateData'],
    rationale: `Initial variation from batch test ${index + 1}`,
    confidence: 0.5,
  }));

  // Create first generation record
  const firstGeneration: GenerationRecord = {
    generation: 1,
    batchLabel: `iteration-${state.sessionId}-gen-1`,
    variations: initialVariations,
  };

  // Update state with initial population
  state.generations.push(firstGeneration);
  state.currentPopulation = initialVariations.map((variation, index) => ({
    variationId: variation.id,
    fitness: 0, // Will be updated after evaluation
    generation: 1,
  }));

  const saveResult = await saveSession(state);
  if (!saveResult.ok) {
    console.error(`Failed to save session: ${saveResult.error.message}`);
    return null;
  }

  console.log(`Session created: ${state.sessionId}`);
  console.log(`Loaded ${initialVariations.length} initial variations from batch`);
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
  while (true) {
    // 1. Check convergence
    const convergence = checkConvergence(state, options.target);
    if (convergence.converged) {
      displayConvergenceMessage(convergence, options);
      break;
    }

    // 2. Run current population tests if not evaluated
    if (needsEvaluation(state)) {
      const evaluated = await runAndEvaluatePopulation(state, options);
      if (!evaluated) break; // Error occurred
    }

    // 3. Generate structured insights
    const insights = await generateStructuredInsights(buildSummary(state));
    if (!insights.ok) {
      console.error('Failed to generate insights:', insights.error.message);
      break;
    }

    // 4. Evolve population (generate new variations)
    const variations = await evolvePopulation(state, insights.data, state.config);
    if (!variations.ok) {
      console.error('Failed to evolve population:', variations.error.message);
      break;
    }

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

const runAndEvaluatePopulation = async (
  _state: IterationState,
  _options: IterateOptions
): Promise<boolean> => {
  // TODO: Implement full population evaluation with batch running and evaluation
  // For now, throw an error indicating this functionality needs to be implemented
  throw new Error('Population evaluation not yet implemented. This requires integrating with the run and evaluate commands.');
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
};