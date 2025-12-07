/**
 * Pipeline Orchestrator
 *
 * Coordinates the complete prompt testing pipeline:
 * sync → run → evaluate → report
 *
 * Provides progress callbacks and fail-fast error handling.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import type { PromptTemplate, BatchFile, PromptTest } from '@bench/core/types';
import { BatchFileSchema } from '@bench/core/types';
import type { Result } from '@bench/core/errors';
import { ok, err, createError, isOk } from '@bench/core/errors';
import { compileTemplate, generateIdempotencyKey } from '@bench/core/compiler';
import { fetchTemplate, syncTemplate } from '@bench/db/templates';
import { evaluateBatch, type EvaluateOptions } from '@bench/core/evaluator';
import { summarize, type BatchReport } from '@bench/core/statistics';
import { createGeminiProvider } from '@/lib/ai/providers/gemini';
import { uploadBuffer, getPublicUrl } from '@/lib/r2';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveSourceImage, type ResolvedSourceImage } from '@bench/core/source-image';
import type { SourceImageOptions } from '@bench/core/source-image';

// =============================================================================
// Types
// =============================================================================

export interface PipelineOptions {
  templateSlug: string;
  templateVersion: number | 'latest';
  batchFile: string;
  label?: string;
  skipSync: boolean;
  skipEval: boolean;
  skipReport: boolean;
  dryRun: boolean;
  evalModel: string;
}

export type ProgressCallback = (
  phase: 'sync' | 'run' | 'evaluate' | 'report',
  current: number,
  total: number,
  message: string
) => void;

export interface PipelineResult {
  label: string;
  phases: {
    sync?: { synced: boolean };
    run: { completed: number; failed: number; skipped: number };
    evaluate?: { completed: number; failed: number };
    report?: BatchReport;
  };
  totalDuration: number;
  costs: { generation: number; evaluation: number };
}

// =============================================================================
// Phase Result Types
// =============================================================================

interface RunPhaseResult {
  completed: number;
  failed: number;
  skipped: number;
  tests: any[]; // Database records
}

interface EvalPhaseResult {
  completed: number;
  failed: number;
}

// =============================================================================
// Main Pipeline Function
// =============================================================================

export const runPipeline = async (
  options: PipelineOptions,
  onProgress?: ProgressCallback
): Promise<Result<PipelineResult>> => {
  const startTime = Date.now();
  let generationCost = 0;
  let evaluationCost = 0;

  // Generate batch label if not provided
  const batchLabel = options.label || generateBatchLabel(options.templateSlug);

  const result: PipelineResult = {
    label: batchLabel,
    phases: {
      run: { completed: 0, failed: 0, skipped: 0 },
    },
    totalDuration: 0,
    costs: { generation: 0, evaluation: 0 },
  };

  try {
    // Phase 1: Sync (optional)
    if (!options.skipSync) {
      const syncResult = await syncPhase(options.templateSlug, onProgress);
      if (!isOk(syncResult)) return syncResult;

      result.phases.sync = syncResult.data;
    }

    // Load batch file
    const batchResult = loadBatchFile(options.batchFile);
    if (!isOk(batchResult)) return batchResult;
    const batch = batchResult.data;

    // Fetch template
    const templateResult = await fetchTemplate(options.templateSlug, options.templateVersion);
    if (!isOk(templateResult)) return templateResult;
    const template = templateResult.data;

    // Phase 2: Run (fail fast)
    const runResult = await runPhase(template, batch, batchLabel, options.dryRun, options.batchFile, onProgress);
    if (!isOk(runResult)) return runResult;

    const runPhaseResult = runResult.data;
    result.phases.run = {
      completed: runPhaseResult.completed,
      failed: runPhaseResult.failed,
      skipped: runPhaseResult.skipped,
    };

    // Track generation costs
    generationCost = runPhaseResult.tests.reduce((sum: number, test: any) => sum + (test.cost_usd || 0), 0);

    // Phase 3: Evaluate (optional)
    if (!options.skipEval) {
      const evalResult = await evaluatePhase(batchLabel, options.evalModel, onProgress);
      if (!isOk(evalResult)) return evalResult;

      result.phases.evaluate = evalResult.data;
      evaluationCost = evalResult.data.completed * 0.001; // Rough estimate: $0.001 per evaluation
    }

    // Phase 4: Report (optional)
    if (!options.skipReport) {
      const reportResult = await reportPhase(batchLabel, onProgress);
      if (!isOk(reportResult)) return reportResult;

      result.phases.report = reportResult.data;
    }

    // Calculate total duration
    result.totalDuration = Date.now() - startTime;
    result.costs = { generation: generationCost, evaluation: evaluationCost };

    return ok(result);

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(createError('PIPELINE_ERROR', `Pipeline failed: ${message}`));
  }
};

// =============================================================================
// Phase Implementations
// =============================================================================

const syncPhase = async (
  templateSlug: string,
  onProgress?: ProgressCallback
): Promise<Result<{ synced: boolean }>> => {
  onProgress?.('sync', 0, 1, 'Checking template...');

  const result = await syncTemplate(templateSlug);
  if (!isOk(result)) return result;

  onProgress?.('sync', 1, 1, 'Template synced');
  return ok({ synced: true });
};

const runPhase = async (
  template: PromptTemplate,
  batch: BatchFile,
  batchLabel: string,
  dryRun: boolean,
  batchFilePath: string,
  onProgress?: ProgressCallback
): Promise<Result<RunPhaseResult>> => {
  const supabase = createAdminClient();
  const gemini = createGeminiProvider();

  let completed = 0;
  let failed = 0;
  let skipped = 0;
  const tests: PromptTest[] = [];

  const total = batch.tests.length;

  for (let i = 0; i < total; i++) {
    const testCase = batch.tests[i];
    onProgress?.('run', i, total, `Processing test ${i + 1}/${total}...`);

    try {
      // Compile template
      const compileResult = compileTemplate(
        template.templateData,
        template.variablesSchema,
        testCase.variables
      );
      if (!isOk(compileResult)) {
        return err(createError(
          'COMPILATION_ERROR',
          `Test ${i + 1}/${total} failed to compile: ${compileResult.error.message}`,
          { testId: `test-${i}` }
        ));
      }
      const compiled = compileResult.data;

      // Resolve source image if specified
      let resolvedSourceImage: ResolvedSourceImage | undefined;
      const sourceImagePath = testCase.sourceImage || batch.sourceImage;
      if (sourceImagePath) {
        const resolveResult = await resolveSourceImage(sourceImagePath as any, {
          batchFilePath: batchFilePath,
          skipUpload: false,
        } as any);
        if (!isOk(resolveResult)) {
          return err(createError(
            'SOURCE_IMAGE_ERROR',
            `Test ${i + 1}/${total} failed to resolve source image: ${resolveResult.error.message}`,
            { testId: `test-${i}` }
          ));
        }
        resolvedSourceImage = resolveResult.data as ResolvedSourceImage;
      }

      // Generate idempotency key
      const idempotencyKey = generateIdempotencyKey(
        template.slug,
        template.version,
        testCase.variables,
        batchLabel,
        resolvedSourceImage?.hash
      );

      // Check for existing test
      const { data: existingTest } = await supabase
        .from('prompt_tests')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .single();

      if (existingTest && (existingTest as any).status !== 'failed') {
        // Skip existing successful test
        skipped++;
        tests.push(existingTest as any);
        continue;
      }

      if (dryRun) {
        completed++;
        continue;
      }

      // Create test record
      const { data: testRecord, error: insertError } = await (supabase
        .from('prompt_tests')
        .insert({
          template_id: template.id!,
          idempotency_key: idempotencyKey,
          status: 'generating',
          inputs: testCase.variables as any,
          final_prompt: compiled.prompt,
          batch_label: batchLabel,
          source_image_url: resolvedSourceImage?.r2Url,
          source_image_key: resolvedSourceImage?.r2Key,
        })
        .select()
        .single() as any);

      if (insertError || !testRecord) {
        return err(createError(
          'DATABASE_ERROR',
          `Test ${i + 1}/${total} failed to create: ${insertError?.message || 'Unknown error'}`,
          { testId: `test-${i}` }
        ));
      }

      // Generate image
      const generationStart = Date.now();
      const config = {
        rawPrompt: true,
        aspectRatio: '1:1' as const,
        resolution: '1k' as const
      }; // Use raw prompt for testing
      const generationResult = resolvedSourceImage
        ? await gemini.generateFromImage(
            resolvedSourceImage.buffer,
            resolvedSourceImage.mimeType,
            compiled.prompt,
            config
          )
        : await gemini.generateFromText(compiled.prompt, config);

      if (!generationResult.success) {
        // Update test status to failed
        await (supabase
          .from('prompt_tests')
          .update({
            status: 'failed',
            error_message: generationResult.error,
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - generationStart,
          })
          .eq('id', testRecord.id) as any);

        failed++;

        return err(createError(
          'GENERATION_ERROR',
          `Test ${i + 1}/${total} failed: ${generationResult.error}`,
          { testId: testRecord.id }
        ));
      }

      // Upload image to R2
      const imageKey = `prompt-tests/${testRecord.id}.png`;
      const buffer = Buffer.from(generationResult.imageData, 'base64');
      const uploadResult = await uploadBuffer(buffer, imageKey, 'image/png');

      // Update test record with success
      const imageUrl = getPublicUrl(imageKey);
      const generationCost = 0.002; // Rough estimate for Gemini image generation

      await (supabase
        .from('prompt_tests')
        .update({
          status: 'completed',
          image_url: imageUrl,
          image_key: imageKey,
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - generationStart,
          cost_usd: generationCost,
        })
        .eq('id', testRecord.id) as any);

      completed++;
      tests.push(testRecord);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return err(createError(
        'RUN_PHASE_ERROR',
        `Test ${i + 1}/${total} failed: ${message}`,
        { testId: `test-${i}` }
      ));
    }
  }

  onProgress?.('run', total, total, `Run phase completed: ${completed} generated, ${skipped} skipped, ${failed} failed`);

  return ok({ completed, failed, skipped, tests });
};

const evaluatePhase = async (
  batchLabel: string,
  evalModel: string,
  onProgress?: ProgressCallback
): Promise<Result<EvalPhaseResult>> => {
  const supabase = createAdminClient();

  onProgress?.('evaluate', 0, 1, 'Fetching tests for evaluation...');

  // Fetch tests that need evaluation
  const { data: tests, error } = await supabase
    .from('prompt_tests')
    .select('*')
    .eq('batch_label', batchLabel)
    .eq('status', 'completed')
    .is('evaluation_id', null);

  if (error) {
    return err(createError('DATABASE_ERROR', `Failed to fetch tests: ${error.message}`));
  }

  if (!tests || tests.length === 0) {
    onProgress?.('evaluate', 1, 1, 'No tests to evaluate');
    return ok({ completed: 0, failed: 0 });
  }

  // Update test statuses to evaluating
  const testIds = tests.map(t => t.id);
  await (supabase
    .from('prompt_tests')
    .update({ status: 'evaluating' })
    .in('id', testIds) as any);

  // Prepare evaluation inputs
  const evaluationInputs = tests.map(test => ({
    id: test.id,
    imageUrl: test.image_url!,
    prompt: test.final_prompt,
  }));

  // Run evaluations
  const evalOptions: EvaluateOptions = { model: evalModel };
  const evalResults = await evaluateBatch(
    evaluationInputs,
    evalOptions,
    (completed, total) => {
      onProgress?.('evaluate', completed, total, `Evaluating ${completed}/${total}...`);
    }
  );

  let completed = 0;
  let failed = 0;

  // Process results
  for (const { id, result } of evalResults) {
    if (isOk(result)) {
      // Insert evaluation record
      const { error: evalError } = await supabase
        .from('prompt_evaluations')
        .insert({
          test_id: id,
          evaluator_type: 'llm',
          score_overall: result.data.overall,
          details: result.data.details as any,
          evaluator_model: evalModel,
          cost_usd: result.data.costUsd,
        });

      if (evalError) {
        console.warn(`Failed to save evaluation for test ${id}: ${evalError.message}`);
        failed++;
      } else {
        // Update test status
        await (supabase
          .from('prompt_tests')
          .update({ status: 'completed' })
          .eq('id', id) as any);
        completed++;
      }
    } else {
      // Update test with evaluation error
      await (supabase
        .from('prompt_tests')
        .update({
          status: 'failed',
          error_message: `Evaluation failed: ${result.error.message}`,
        })
        .eq('id', id) as any);
      failed++;
    }
  }

  onProgress?.('evaluate', tests.length, tests.length, `Evaluation completed: ${completed} evaluated, ${failed} failed`);

  return ok({ completed, failed });
};

const reportPhase = async (
  batchLabel: string,
  onProgress?: ProgressCallback
): Promise<Result<BatchReport>> => {
  onProgress?.('report', 0, 1, 'Generating report...');

  const supabase = createAdminClient();

  // Fetch completed tests with evaluations
  const { data: tests, error } = await supabase
    .from('prompt_tests')
    .select(`
      *,
      prompt_evaluations(*)
    `)
    .eq('batch_label', batchLabel)
    .eq('status', 'completed')
    .not('prompt_evaluations', 'is', null);

  if (error) {
    return err(createError('DATABASE_ERROR', `Failed to fetch tests for report: ${error.message}`));
  }

  if (!tests || tests.length === 0) {
    return err(createError('NO_DATA_ERROR', 'No completed tests with evaluations found for report'));
  }

  // Extract scores and prepare data for statistics
  const scores: number[] = [];
  const scoreDetails: Array<{ id: string; score: number; prompt: string }> = [];

  for (const test of tests) {
    const evaluation = test.prompt_evaluations?.[0];
    if (evaluation && evaluation.score_overall) {
      scores.push(evaluation.score_overall);
      scoreDetails.push({
        id: test.id,
        score: evaluation.score_overall,
        prompt: test.final_prompt,
      });
    }
  }

  if (scores.length === 0) {
    return err(createError('NO_DATA_ERROR', 'No evaluation scores found for report'));
  }

  // Generate statistics
  const stats = summarize(scores);
  const { getScoreDistribution } = await import('./statistics');
  const scoreDistribution = getScoreDistribution(scores);

  // Sort by score for top/bottom
  const sorted = scoreDetails.sort((a, b) => b.score - a.score);
  const topScores = sorted.slice(0, 5);
  const bottomScores = sorted.slice(-5).reverse();

  const report: BatchReport = {
    label: batchLabel,
    stats,
    scoreDistribution,
    topScores,
    bottomScores,
  };

  onProgress?.('report', 1, 1, 'Report generated');

  return ok(report);
};

// =============================================================================
// Utility Functions
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
// Utility Functions
// =============================================================================

export const generateBatchLabel = (templateSlug: string): string => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const hash = Math.random().toString(36).slice(2, 8);
  return `${templateSlug}-${date}-${hash}`;
};