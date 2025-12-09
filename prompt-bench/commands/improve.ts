/**
 * CLI command for AI-powered template improvement
 */

import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import type { Result } from '@bench/core/errors';
import { ok, err, createError, isOk } from '@bench/core/errors';
import { loadConfig } from './shared';
import {
  createSession,
  loadSession,
  loadActiveSession,
  updateSession,
  listSessions,
  saveIteration,
} from './improvement-session';
import { analyzeTemplate } from './template-analyzer';
import { implementSuggestions } from './template-implementer';
import { generateDiff } from '@bench/core/template-diff';
import { readTemplateFile, writeTemplateFile, generateVersionedFilename, parseTemplateCode } from '@bench/core/template-io';
import { runPipeline, generateBatchLabel } from '@bench/core/orchestrator';
import { fetchTemplate, insertTemplate } from '@bench/db/templates';
import { fetchBatchEvaluations } from './shared';
import { createAdminClient } from '@/lib/supabase/admin';
import { summarize } from '@bench/core/statistics';
import { autoReportForLabel } from './report';
import type {
  ImprovementConfig,
  ImprovementSession,
  TemplateIteration,
  TestResults,
  ScoreDelta,
  IterationCosts,
  EvaluationBreakdown,
  ProductScore,
} from '@bench/core/improvement-types';

// =============================================================================
// Types
// =============================================================================

interface ImproveOptions {
  template?: string;
  batch?: string;
  continue?: boolean;
  history?: boolean;
  'max-iterations'?: number;
  'target-score'?: number;
  'auto-approve'?: boolean;
  quiet?: boolean;
  json?: boolean;
}

// =============================================================================
// Main Command
// =============================================================================

/**
 * Main improve command entry point
 */
export const improveCommand = async (args: string[]): Promise<void> => {
  const options = parseImproveOptions(args);

  try {
    // Handle history mode
    if (options.history) {
      await showHistoryCommand(options);
      return;
    }

    // Load or create session
    const session = options.continue
      ? await loadActiveSessionForCommand(options)
      : await createNewSessionForCommand(options);

    if (!session) return; // Error already logged

    // Run iteration loop
    await runIterationLoop(session, options);

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error: ${message}`);
    process.exit(1);
  }
};

// =============================================================================
// Option Parsing
// =============================================================================

const parseImproveOptions = (args: string[]): ImproveOptions => {
  const config = loadConfig();
  const improveConfig = config?.defaults?.improve;

  const { values } = parseArgs({
    args,
    options: {
      template: { type: 'string', short: 't' },
      batch: { type: 'string', short: 'b' },
      continue: { type: 'boolean', short: 'c' },
      history: { type: 'boolean' },
      'max-iterations': { type: 'string' },
      'target-score': { type: 'string' },
      'auto-approve': { type: 'boolean' },
      quiet: { type: 'boolean', short: 'q' },
      json: { type: 'boolean' },
    },
  });

  return {
    template: (values.template as string) || improveConfig?.template || config?.defaults?.template,
    batch: (values.batch as string) || improveConfig?.batch_file || config?.defaults?.batch_file,
    continue: values.continue as boolean,
    history: values.history as boolean,
    'max-iterations': values['max-iterations']
      ? parseInt(values['max-iterations'] as string)
      : improveConfig?.max_iterations || 5,
    'target-score': values['target-score']
      ? parseFloat(values['target-score'] as string)
      : improveConfig?.target_score || 9.0,
    'auto-approve': (values['auto-approve'] as boolean) || improveConfig?.auto_approve || false,
    quiet: values.quiet as boolean,
    json: values.json as boolean,
  };
};

// =============================================================================
// Session Management
// =============================================================================

const createNewSessionForCommand = async (
  options: ImproveOptions
): Promise<ImprovementSession | null> => {
  if (!options.template) {
    console.error('Error: --template is required (or set defaults.improve.template in prompt-bench.toml)');
    return null;
  }

  if (!options.batch) {
    console.error('Error: --batch is required (or set defaults.improve.batch_file in prompt-bench.toml)');
    return null;
  }

  const config: ImprovementConfig = {
    template: options.template,
    batchFile: options.batch,
    maxIterations: options['max-iterations'] || 5,
    targetScore: options['target-score'] || 9.0,
    autoApprove: options['auto-approve'] || false,
    versionTemplates: true, // TODO: load from config
    aiModel: 'claude-sonnet-4-20250514', // TODO: load from config
  };

  const result = await createSession(options.template, config);
  if (!result.ok) {
    console.error(`Failed to create session: ${result.error.message}`);
    return null;
  }

  if (!options.quiet && !options.json) {
    console.log(`\n✨ Created improvement session: ${result.data.sessionId}`);
    console.log(`Template: ${options.template}`);
    console.log(`Max iterations: ${config.maxIterations}`);
    console.log(`Target score: ${config.targetScore}\n`);
  }

  return result.data;
};

const loadActiveSessionForCommand = async (
  options: ImproveOptions
): Promise<ImprovementSession | null> => {
  if (!options.template) {
    console.error('Error: --template is required with --continue');
    return null;
  }

  const result = await loadActiveSession(options.template);
  if (!result.ok) {
    console.error(`Failed to load session: ${result.error.message}`);
    return null;
  }

  if (!result.data) {
    console.error(`No active session found for template: ${options.template}`);
    return null;
  }

  if (!options.quiet && !options.json) {
    console.log(`\n📂 Resuming session: ${result.data.sessionId}`);
    console.log(`Current iteration: ${result.data.currentIteration}/${result.data.maxIterations}\n`);
  }

  return result.data;
};

const showHistoryCommand = async (options: ImproveOptions): Promise<void> => {
  if (!options.template) {
    console.error('Error: --template is required with --history');
    return;
  }

  const result = await listSessions(options.template);
  if (!result.ok) {
    console.error(`Failed to list sessions: ${result.error.message}`);
    return;
  }

  if (options.json) {
    console.log(JSON.stringify(result.data, null, 2));
  } else {
    console.log(`\n📊 Improvement Sessions for ${options.template}:`);
    console.log('─'.repeat(80));
    for (const session of result.data) {
      console.log(`Session: ${session.sessionId}`);
      console.log(`  Status: ${session.status}`);
      console.log(`  Iterations: ${session.currentIteration}/${session.maxIterations}`);
      console.log(`  Score: ${session.initialMeanScore?.toFixed(2) || 'N/A'} → ${session.currentMeanScore?.toFixed(2) || 'N/A'}`);
      console.log(`  Cost: $${session.totalCostUsd.toFixed(4)}`);
      console.log(`  Started: ${new Date(session.startedAt).toLocaleString()}\n`);
    }
  }
};

// =============================================================================
// Iteration Loop
// =============================================================================

const runIterationLoop = async (
  session: ImprovementSession,
  options: ImproveOptions
): Promise<void> => {
  const nextIteration = session.currentIteration + 1;

  if (nextIteration > session.maxIterations) {
    console.log('✅ Reached maximum iterations');
    await updateSession(session.sessionId, { status: 'completed' });
    return;
  }

  if (!options.quiet && !options.json) {
    console.log(`\n🔄 Starting iteration ${nextIteration}/${session.maxIterations}`);
    console.log('─'.repeat(80));
  }

  // Step 1: Test baseline
  const baselineResult = await testBaseline(session, options);
  if (!baselineResult.ok) {
    console.error(`Baseline test failed: ${baselineResult.error.message}`);
    return;
  }

  // Step 2: Analyze with AI
  const analysisResult = await analyzeWithAI(session, baselineResult.data, options);
  if (!analysisResult.ok) {
    console.error(`Analysis failed: ${analysisResult.error.message}`);
    return;
  }

  // Step 3: Generate improvements with AI
  const implementationResult = await generateImprovements(
    session,
    baselineResult.data.template,
    analysisResult.data.analysis,
    options
  );
  if (!implementationResult.ok) {
    console.error(`Implementation failed: ${implementationResult.error.message}`);
    return;
  }

  // Step 3.5: Generate report for baseline analysis and suggestions
  if (!options.quiet && !options.json) {
    console.log('\n📊 Generating report for analysis and suggestions...');
  }
  const reportPath = await autoReportForLabel(
    baselineResult.data.label,
    analysisResult.data.analysis
  );
  if (reportPath && !options.quiet && !options.json) {
    console.log(`✅ Report generated: ${reportPath}`);
    console.log('   Review the report to see baseline results, analysis, and suggestions.\n');
  }

  // Step 4: Approval (if not auto-approve)
  if (!session.config.autoApprove && !options['auto-approve']) {
    const approved = await requestApproval(implementationResult.data.changes);
    if (!approved) {
      console.log('❌ Changes rejected by user');
      return;
    }
  }

  // Step 5: Test improved version
  const improvedResult = await testImproved(
    session,
    implementationResult.data.code,
    nextIteration,
    options
  );
  if (!improvedResult.ok) {
    console.error(`Improved test failed: ${improvedResult.error.message}`);
    return;
  }

  // Step 6: Calculate delta and save iteration
  const delta = calculateScoreDelta(baselineResult.data.results, improvedResult.data.results);
  const costs: IterationCosts = {
    baselineGeneration: baselineResult.data.costs.generation,
    baselineEvaluation: baselineResult.data.costs.evaluation,
    improvedGeneration: improvedResult.data.costs.generation,
    improvedEvaluation: improvedResult.data.costs.evaluation,
    aiAnalysis: analysisResult.data.costUsd,
    aiImplementation: implementationResult.data.costUsd,
    total:
      baselineResult.data.costs.generation +
      baselineResult.data.costs.evaluation +
      improvedResult.data.costs.generation +
      improvedResult.data.costs.evaluation +
      analysisResult.data.costUsd +
      implementationResult.data.costUsd,
  };

  const iteration: Omit<TemplateIteration, 'id' | 'timestamp'> = {
    sessionId: session.sessionId,
    iterationNumber: nextIteration,
    baselineTemplate: baselineResult.data.template as Record<string, unknown>,
    improvedTemplate: improvedResult.data.template as Record<string, unknown>,
    changes: implementationResult.data.changes,
    userModifications: null,
    baselineBatchLabel: baselineResult.data.label,
    improvedBatchLabel: improvedResult.data.label,
    baselineResults: baselineResult.data.results,
    improvedResults: improvedResult.data.results,
    delta,
    analysis: analysisResult.data.analysis,
    suggestions: analysisResult.data.analysis.prioritizedSuggestions,
    costs,
  };

  const saveResult = await saveIteration(iteration);
  if (!saveResult.ok) {
    console.error(`Failed to save iteration: ${saveResult.error.message}`);
    return;
  }

  // Update session
  const newMeanScore = improvedResult.data.results.meanScore;
  const totalImprovement = session.initialMeanScore
    ? newMeanScore - session.initialMeanScore
    : 0;

  await updateSession(session.sessionId, {
    currentIteration: nextIteration,
    currentMeanScore: newMeanScore,
    totalImprovement,
    totalCostUsd: session.totalCostUsd + costs.total,
    status:
      session.targetScore && newMeanScore >= session.targetScore
        ? 'completed'
        : nextIteration >= session.maxIterations
          ? 'completed'
          : 'active',
  });

  if (!options.quiet && !options.json) {
    console.log(`\n✅ Iteration ${nextIteration} completed`);
    console.log(`Score: ${baselineResult.data.results.meanScore.toFixed(2)} → ${newMeanScore.toFixed(2)} (Δ${delta.meanDelta >= 0 ? '+' : ''}${delta.meanDelta.toFixed(2)})`);
    console.log(`Cost: $${costs.total.toFixed(4)}\n`);
  }

  // Continue if not completed
  const updatedSession = await loadSession(session.sessionId);
  if (updatedSession.ok && updatedSession.data.status === 'active') {
    await runIterationLoop(updatedSession.data, options);
  }
};

// =============================================================================
// Test Execution
// =============================================================================

interface BaselineTestResult {
  template: unknown;
  label: string;
  results: TestResults;
  costs: { generation: number; evaluation: number };
}

const testBaseline = async (
  session: ImprovementSession,
  options: ImproveOptions
): Promise<Result<BaselineTestResult>> => {
  // Fetch template
  const templateResult = await fetchTemplate(session.templateSlug, 'latest');
  if (!templateResult.ok) return templateResult;

  const template = templateResult.data;
  const label = generateBatchLabel(session.templateSlug);

  // Run pipeline
  const pipelineResult = await runPipeline({
    templateSlug: session.templateSlug,
    templateVersion: 'latest',
    batchFile: session.config.batchFile,
    label,
    skipSync: true,
    skipEval: false,
    skipReport: true,
    dryRun: false,
    evalModel: 'claude-sonnet-4-20250514',
  });

  if (!pipelineResult.ok) {
    return err(
      createError('PIPELINE_ERROR', `Baseline test failed: ${pipelineResult.error.message}`)
    );
  }

  // Fetch evaluations
  const supabase = createAdminClient();
  const evaluations = await fetchBatchEvaluations(supabase, label);
  const scores = evaluations.map(e => e.score);
  const stats = summarize(scores);

  const productScores: ProductScore[] = evaluations.map((evaluation, idx) => {
    const details = evaluation.details;
    return {
      productId: `product-${idx}`,
      score: evaluation.score,
      breakdown: details ? {
        composition: details.composition || 0,
        lighting: details.lighting || 0,
        productVisibility: details.productVisibility || 0,
        backgroundQuality: details.backgroundQuality || 0,
        professionalQuality: details.professionalQuality || 0,
        promptAdherence: details.promptAdherence || 0,
      } : undefined,
      reasoning: details?.reasoning,
      suggestions: details?.suggestions,
    };
  });

  const dimensionAverages = calculateDimensionAverages(productScores);

  const results: TestResults = {
    scores,
    meanScore: stats.mean,
    medianScore: stats.median,
    minScore: stats.min,
    maxScore: stats.max,
    productScores,
    dimensionAverages,
  };

  // Set initial score if first iteration
  if (session.currentIteration === 0 && !session.initialMeanScore) {
    await updateSession(session.sessionId, {
      initialMeanScore: results.meanScore,
      currentMeanScore: results.meanScore,
    });
  }

  return ok({
    template: {
      slug: template.slug,
      version: template.version,
      status: template.status,
      templateData: template.templateData,
      variablesSchema: template.variablesSchema,
    },
    label,
    results,
    costs: pipelineResult.data.costs,
  });
};

interface ImprovedTestResult {
  template: unknown;
  label: string;
  results: TestResults;
  costs: { generation: number; evaluation: number };
}

const testImproved = async (
  session: ImprovementSession,
  code: string,
  iteration: number,
  options: ImproveOptions
): Promise<Result<ImprovedTestResult>> => {
  // Phase 1: Parse TypeScript code
  const parseResult = await parseTemplateCode(code);
  if (!parseResult.ok) {
    return err(
      createError('VALIDATION_ERROR', `Failed to parse template code: ${parseResult.error.message}`)
    );
  }
  const template = parseResult.data;

  // Phase 2: Write to file (versioned if config.versionTemplates is true)
  const baseFileName = `${template.slug}.ts`;
  const baseFilePath = `prompt-bench/templates/${baseFileName}`;

  let filePath: string;
  if (session.config.versionTemplates) {
    // Use versioned filename
    filePath = generateVersionedFilename(baseFilePath, template.version);
  } else {
    // Overwrite existing file
    filePath = baseFilePath;
  }

  const writeResult = writeTemplateFile(template, filePath);
  if (!writeResult.ok) {
    return err(
      createError('STORAGE_ERROR', `Failed to write template file: ${writeResult.error.message}`)
    );
  }

  // Phase 3: Sync template to database
  const insertResult = await insertTemplate(template);
  if (!insertResult.ok) {
    return err(
      createError('DATABASE_ERROR', `Failed to sync template: ${insertResult.error.message}`)
    );
  }
  const syncedTemplate = insertResult.data;

  // Phase 4: Run pipeline with new template version
  const improvedLabel = `${template.slug}-improved-iter${iteration}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 8)}`;

  const pipelineResult = await runPipeline({
    templateSlug: template.slug,
    templateVersion: syncedTemplate.version,
    batchFile: session.config.batchFile,
    label: improvedLabel,
    skipSync: true, // Already synced in Phase 3
    skipEval: false,
    skipReport: true, // Skip report for now (can be enabled later)
    dryRun: false,
    evalModel: 'claude-sonnet-4-20250514', // TODO: add to config
  });

  if (!pipelineResult.ok) {
    return err(
      createError('PIPELINE_ERROR', `Pipeline failed: ${pipelineResult.error.message}`)
    );
  }

  // Phase 5: Fetch and return results
  const supabase = createAdminClient();
  const evaluations = await fetchBatchEvaluations(supabase, improvedLabel);

  if (evaluations.length === 0) {
    return err(
      createError('NO_DATA_ERROR', 'No evaluation scores found for improved template')
    );
  }

  const scores = evaluations.map(e => e.score);
  const stats = summarize(scores);

  const productScores: ProductScore[] = evaluations.map((evaluation, idx) => {
    const details = evaluation.details;
    return {
      productId: `product-${idx}`,
      score: evaluation.score,
      breakdown: details ? {
        composition: details.composition || 0,
        lighting: details.lighting || 0,
        productVisibility: details.productVisibility || 0,
        backgroundQuality: details.backgroundQuality || 0,
        professionalQuality: details.professionalQuality || 0,
        promptAdherence: details.promptAdherence || 0,
      } : undefined,
      reasoning: details?.reasoning,
      suggestions: details?.suggestions,
    };
  });

  const dimensionAverages = calculateDimensionAverages(productScores);

  const results: TestResults = {
    scores,
    meanScore: stats.mean,
    medianScore: stats.median,
    minScore: stats.min,
    maxScore: stats.max,
    productScores,
    dimensionAverages,
  };

  return ok({
    template: {
      slug: syncedTemplate.slug,
      version: syncedTemplate.version,
      status: syncedTemplate.status,
      templateData: syncedTemplate.templateData,
      variablesSchema: syncedTemplate.variablesSchema,
    },
    label: improvedLabel,
    results,
    costs: pipelineResult.data.costs,
  });
};

// =============================================================================
// AI Integration
// =============================================================================

interface AnalysisData {
  analysis: import('@bench/core/improvement-types').StructuredAnalysis;
  costUsd: number;
}

const analyzeWithAI = async (
  session: ImprovementSession,
  baseline: BaselineTestResult,
  options: ImproveOptions
): Promise<Result<AnalysisData>> => {
  const templateResult = await fetchTemplate(session.templateSlug, 'latest');
  if (!templateResult.ok) return templateResult;

  const result = await analyzeTemplate(
    {
      template: templateResult.data,
      testResults: baseline.results,
    },
    session.config.aiModel
  );

  if (!result.ok) return result;

  return ok({
    analysis: result.data.analysis,
    costUsd: result.data.costUsd,
  });
};

interface ImplementationData {
  code: string;
  changes: import('@bench/core/improvement-types').TemplateChange[];
  costUsd: number;
}

const generateImprovements = async (
  session: ImprovementSession,
  template: unknown,
  analysis: import('@bench/core/improvement-types').StructuredAnalysis,
  options: ImproveOptions
): Promise<Result<ImplementationData>> => {
  const templateResult = await fetchTemplate(session.templateSlug, 'latest');
  if (!templateResult.ok) return templateResult;

  const result = await implementSuggestions(
    {
      template: templateResult.data,
      suggestions: analysis.prioritizedSuggestions,
      analysisSummary: analysis.summary,
    },
    session.config.aiModel
  );

  if (!result.ok) return result;

  return ok({
    code: result.data.code,
    changes: result.data.changes,
    costUsd: result.data.costUsd,
  });
};

// =============================================================================
// Utilities
// =============================================================================

const calculateScoreDelta = (baseline: TestResults, improved: TestResults): ScoreDelta => {
  const productDeltas = baseline.productScores.map((baselineProduct, idx) => {
    const improvedProduct = improved.productScores[idx] || { productId: baselineProduct.productId, score: baselineProduct.score };
    return {
      productId: baselineProduct.productId,
      baselineScore: baselineProduct.score,
      improvedScore: improvedProduct.score,
      delta: improvedProduct.score - baselineProduct.score,
    };
  });

  const improvedCount = productDeltas.filter((p) => p.delta > 0).length;
  const regressed = productDeltas.filter((p) => p.delta < 0).length;
  const unchanged = productDeltas.filter((p) => p.delta === 0).length;

  return {
    meanDelta: improved.meanScore - baseline.meanScore,
    medianDelta: improved.medianScore - baseline.medianScore,
    improved: improvedCount,
    regressed,
    unchanged,
    productDeltas,
  };
};

const calculateDimensionAverages = (evaluations: ProductScore[]): EvaluationBreakdown | undefined => {
  if (!evaluations || evaluations.length === 0) {
    return undefined;
  }

  // Collect all valid breakdowns
  const breakdowns: EvaluationBreakdown[] = [];
  for (const evaluation of evaluations) {
    if (evaluation.breakdown) {
      breakdowns.push(evaluation.breakdown);
    }
  }

  // Return undefined if no valid breakdowns found
  if (breakdowns.length === 0) {
    return undefined;
  }

  // Calculate averages for each dimension
  const sum = breakdowns.reduce(
    (acc, breakdown) => ({
      composition: acc.composition + breakdown.composition,
      lighting: acc.lighting + breakdown.lighting,
      productVisibility: acc.productVisibility + breakdown.productVisibility,
      backgroundQuality: acc.backgroundQuality + breakdown.backgroundQuality,
      professionalQuality: acc.professionalQuality + breakdown.professionalQuality,
      promptAdherence: acc.promptAdherence + breakdown.promptAdherence,
    }),
    {
      composition: 0,
      lighting: 0,
      productVisibility: 0,
      backgroundQuality: 0,
      professionalQuality: 0,
      promptAdherence: 0,
    }
  );

  const count = breakdowns.length;
  return {
    composition: sum.composition / count,
    lighting: sum.lighting / count,
    productVisibility: sum.productVisibility / count,
    backgroundQuality: sum.backgroundQuality / count,
    professionalQuality: sum.professionalQuality / count,
    promptAdherence: sum.promptAdherence / count,
  };
};

const requestApproval = async (changes: import('@bench/core/improvement-types').TemplateChange[]): Promise<boolean> => {
  console.log('\n📝 Proposed Changes:');
  console.log('─'.repeat(80));
  for (const change of changes) {
    console.log(`[${change.type.toUpperCase()}] ${change.path}`);
    console.log(`  ${change.description}`);
  }
  console.log('─'.repeat(80));
  console.log('\nApprove changes? [y/N]: ');

  // TODO: Implement actual user input
  // For now, return true (auto-approve)
  return true;
};

