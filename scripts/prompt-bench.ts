#!/usr/bin/env tsx
// @ts-nocheck - Temporary disable type checking due to Supabase type generation issues
/**
 * Prompt Testing CLI
 *
 * Usage:
 *   npm run bench run --template <slug> --batch <file> [options]
 *   npm run bench evaluate --label <batch-label>
 *   npm run bench compare --baseline <label> --candidate <label>
 *   npm run bench report --label <batch-label>
 */

import { parseArgs } from 'node:util';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  BatchFileSchema,
  RunCommandOptionsSchema,
  type BatchFile,
  type PromptTemplate,
} from '@/lib/prompts/types';
import {
  Result,
  ok,
  err,
  createError,
  formatError,
  isOk,
} from '@/lib/prompts/errors';
import { compileTemplate, generateIdempotencyKey } from '@/lib/prompts/compiler';
import { fetchTemplate, syncTemplate } from '@/lib/prompts/registry';
import { createAdminClient } from '@/lib/supabase/admin';
import { createGeminiProvider } from '@/lib/ai/providers/gemini';
import { uploadBuffer, getPublicUrl } from '@/lib/r2';

// =============================================================================
// CLI Parsing
// =============================================================================

const COMMANDS = ['run', 'evaluate', 'compare', 'report', 'sync'] as const;
type Command = (typeof COMMANDS)[number];

const parseCommand = (): { command: Command; args: string[] } => {
  const args = process.argv.slice(2);
  const command = args[0] as Command;

  if (!COMMANDS.includes(command)) {
    console.error(`Unknown command: ${command}`);
    console.error(`Available commands: ${COMMANDS.join(', ')}`);
    process.exit(1);
  }

  return { command, args: args.slice(1) };
};

// =============================================================================
// Run Command
// =============================================================================

interface RunOptions {
  template: string;
  version: number | 'latest';
  batchFile: string;
  label?: string;
  dryRun: boolean;
}

const parseRunOptions = (args: string[]): RunOptions => {
  const { values } = parseArgs({
    args,
    options: {
      template: { type: 'string', short: 't' },
      version: { type: 'string', short: 'v', default: 'latest' },
      batch: { type: 'string', short: 'b' },
      label: { type: 'string', short: 'l' },
      'dry-run': { type: 'boolean', default: false },
    },
  });

  if (!values.template) {
    console.error('--template is required');
    process.exit(1);
  }

  if (!values.batch) {
    console.error('--batch is required');
    process.exit(1);
  }

  return {
    template: values.template,
    version: values.version === 'latest' ? 'latest' : parseInt(values.version, 10),
    batchFile: values.batch,
    label: values.label,
    dryRun: values['dry-run'] ?? false,
  };
};

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// @ts-ignore - Supabase types not updated for prompt testing tables
const runCommand = async (args: string[]): Promise<void> => {
  const options = parseRunOptions(args);

  console.log(`\n📋 Prompt Bench: Run`);
  console.log(`─────────────────────────────────`);
  console.log(`Template: ${options.template}`);
  console.log(`Version: ${options.version}`);
  console.log(`Batch: ${options.batchFile}`);
  console.log(`Label: ${options.label || '(none)'}`);
  console.log(`Dry Run: ${options.dryRun}`);
  console.log(`─────────────────────────────────\n`);

  // 1. Load batch file
  const batchResult = loadBatchFile(options.batchFile);
  if (!isOk(batchResult)) {
    console.error(formatError(batchResult.error));
    process.exit(1);
  }
  const batch = batchResult.data;
  const batchLabel = options.label || batch.label || `batch-${Date.now()}`;

  console.log(`📦 Loaded ${batch.tests.length} tests from batch file`);

  // 2. Fetch template
  const templateResult = await fetchTemplate(options.template, options.version);
  if (!isOk(templateResult)) {
    console.error(formatError(templateResult.error));
    process.exit(1);
  }
  const template = templateResult.data;

  console.log(`📝 Using template: ${template.slug} v${template.version}`);

  // 3. Dry run - validate only
  if (options.dryRun) {
    console.log(`\n🔍 Dry Run - Validating inputs...\n`);

    let valid = 0;
    let invalid = 0;

    for (let i = 0; i < batch.tests.length; i++) {
      const test = batch.tests[i];
      const result = compileTemplate(
        template.templateData,
        template.variablesSchema,
        test.variables
      );

      if (isOk(result)) {
        console.log(`✅ Test ${i + 1}: Valid`);
        console.log(`   Prompt: ${result.data.prompt.slice(0, 80)}...`);
        valid++;
      } else {
        console.log(`❌ Test ${i + 1}: Invalid`);
        console.log(`   Error: ${result.error.message}`);
        invalid++;
      }
    }

    console.log(`\n📊 Validation Summary: ${valid} valid, ${invalid} invalid`);
    return;
  }

  // 4. Initialize providers
  const supabase = createAdminClient();
  const gemini = createGeminiProvider();

  // 5. Run tests
  console.log(`\n🚀 Running ${batch.tests.length} tests...\n`);

  let completed = 0;
  let failed = 0;

  for (let i = 0; i < batch.tests.length; i++) {
    const test = batch.tests[i];
    const testNum = i + 1;

    console.log(`[${testNum}/${batch.tests.length}] Processing...`);

    // Compile template
    const compileResult = compileTemplate(
      template.templateData,
      template.variablesSchema,
      test.variables,
      { includeNegative: true }
    );

    if (!isOk(compileResult)) {
      console.log(`  ❌ Compilation failed: ${compileResult.error.message}`);
      failed++;
      continue;
    }

    const compiled = compileResult.data;
    const idempotencyKey = generateIdempotencyKey(
      template.slug,
      template.version,
      test.variables,
      batchLabel
    );

    // Check for existing test with same idempotency key
    // @ts-ignore - TypeScript types not updated yet
    const { data: existing } = await supabase
      .from('prompt_tests')
      .select('id, status')
      .eq('idempotency_key', idempotencyKey)
      .single();

    if (existing) {
      console.log(`  ⏭️  Skipping (already exists: ${existing.status})`);
      if (existing.status === 'completed') completed++;
      else if (existing.status === 'failed') failed++;
      continue;
    }

    // Create test record
    const startTime = Date.now();
    // @ts-ignore - TypeScript types not updated yet
    const { data: testRecord, error: insertError } = await supabase
      .from('prompt_tests')
      .insert({
        template_id: template.id,
        idempotency_key: idempotencyKey,
        status: 'generating',
        inputs: test.variables as any,
        final_prompt: compiled.prompt,
        batch_label: batchLabel,
      })
      .select()
      .single();

    if (insertError || !testRecord) {
      console.log(`  ❌ Database error: ${insertError?.message}`);
      failed++;
      continue;
    }

    // Generate image
    const generationResult = await gemini.generateFromText(compiled.prompt, {
      aspectRatio: '1:1',
      resolution: '2k',
      rawPrompt: true,
    });

    if (!generationResult.success) {
      await supabase.rpc('update_prompt_test_status', {
        p_test_id: testRecord.id,
        p_new_status: 'failed',
        p_error_message: generationResult.error,
        p_error_code: generationResult.code,
      });
      console.log(`  ❌ Generation failed: ${generationResult.error}`);
      failed++;
      continue;
    }

    // Upload to R2
    const imageKey = `prompt-tests/${testRecord.id}.png`;
    const imageBuffer = Buffer.from(generationResult.imageData, 'base64');

    try {
      await uploadBuffer(imageBuffer, imageKey, 'image/png');
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Unknown error';
      await supabase.rpc('update_prompt_test_status', {
        p_test_id: testRecord.id,
        p_new_status: 'failed',
        p_error_message: message,
        p_error_code: 'STORAGE_ERROR',
      });
      console.log(`  ❌ Upload failed: ${message}`);
      failed++;
      continue;
    }

    // Update test record as completed
    const durationMs = Date.now() - startTime;
    const imageUrl = getPublicUrl(imageKey);

    await supabase
      .from('prompt_tests')
      .update({
        status: 'evaluating', // Ready for evaluation
        image_url: imageUrl,
        image_key: imageKey,
        duration_ms: durationMs,
        completed_at: new Date().toISOString(),
      })
      .eq('id', testRecord.id);

    console.log(`  ✅ Generated in ${durationMs}ms`);
    completed++;

    // Rate limiting: wait between requests
    if (i < batch.tests.length - 1) {
      await sleep(1000);
    }
  }

  // Summary
  console.log(`\n─────────────────────────────────`);
  console.log(`📊 Results:`);
  console.log(`   Completed: ${completed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Batch Label: ${batchLabel}`);
  console.log(`─────────────────────────────────\n`);

  console.log(`Next steps:`);
  console.log(`  npm run bench evaluate --label "${batchLabel}"`);
};

// =============================================================================
// Sync Command
// =============================================================================

const syncCommand = async (): Promise<void> => {
  console.log(`\n🔄 Syncing templates to database...\n`);

  const { syncAllTemplates } = await import('@/lib/prompts/registry');
  const result = await syncAllTemplates();

  if (result.synced.length > 0) {
    console.log(`✅ Synced: ${result.synced.join(', ')}`);
  }

  if (result.errors.length > 0) {
    console.log(`❌ Errors:`);
    for (const e of result.errors) {
      console.log(`   ${e.slug}: ${e.error}`);
    }
  }

  console.log(`\nDone.`);
};

// =============================================================================
// Evaluate Command
// =============================================================================

interface EvaluateOptions {
  label: string;
  model: string;
}

const parseEvaluateOptions = (args: string[]): EvaluateOptions => {
  const { values } = parseArgs({
    args,
    options: {
      label: { type: 'string', short: 'l' },
      model: { type: 'string', short: 'm', default: 'claude-sonnet-4-20250514' },
    },
  });

  if (!values.label) {
    console.error('--label is required');
    process.exit(1);
  }

  return {
    label: values.label,
    model: values.model ?? 'claude-sonnet-4-20250514',
  };
};

const evaluateCommand = async (args: string[]): Promise<void> => {
  const options = parseEvaluateOptions(args);

  console.log(`\n🔍 Prompt Bench: Evaluate`);
  console.log(`─────────────────────────────────`);
  console.log(`Label: ${options.label}`);
  console.log(`Model: ${options.model}`);
  console.log(`─────────────────────────────────\n`);

  const supabase = createAdminClient();

  // Fetch tests that need evaluation
  const { data: tests, error } = await supabase
    .from('prompt_tests')
    .select('id, image_url, final_prompt')
    .eq('batch_label', options.label)
    .eq('status', 'evaluating')
    .order('created_at', { ascending: true });

  if (error) {
    console.error(`Database error: ${error.message}`);
    process.exit(1);
  }

  if (!tests || tests.length === 0) {
    console.log(`No tests found for label "${options.label}" with status "evaluating"`);
    return;
  }

  console.log(`📋 Found ${tests.length} tests to evaluate\n`);

  const { evaluateImage } = await import('@/lib/prompts/evaluator');

  let completed = 0;
  let failed = 0;

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`[${i + 1}/${tests.length}] Evaluating...`);

    if (!test.image_url) {
      console.log(`  ⏭️  Skipping (no image URL)`);
      continue;
    }

    const result = await evaluateImage(test.image_url, test.final_prompt, {
      model: options.model,
    });

    if (!result.ok) {
      console.log(`  ❌ Failed: ${result.error.message}`);
      failed++;
      continue;
    }

    // Save evaluation
    const { error: insertError } = await supabase.from('prompt_evaluations').insert({
      test_id: test.id,
      score_overall: result.data.overall,
      details: result.data.details,
      evaluator_model: result.data.model,
      evaluator_type: 'llm',
      cost_usd: result.data.costUsd,
      tokens_used: result.data.tokensUsed,
    });

    if (insertError) {
      console.log(`  ❌ Database error: ${insertError.message}`);
      failed++;
      continue;
    }

    // Update test status
    await supabase.rpc('update_prompt_test_status', {
      p_test_id: test.id,
      p_new_status: 'completed',
    });

    console.log(`  ✅ Score: ${result.data.overall.toFixed(1)}/10`);
    completed++;
  }

  // Summary
  console.log(`\n─────────────────────────────────`);
  console.log(`📊 Results:`);
  console.log(`   Evaluated: ${completed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`─────────────────────────────────\n`);

  console.log(`Next steps:`);
  console.log(`  npm run bench report --label "${options.label}"`);
};

// =============================================================================
// Compare Command
// =============================================================================

interface CompareOptions {
  baseline: string;
  candidate: string;
}

const parseCompareOptions = (args: string[]): CompareOptions => {
  const { values } = parseArgs({
    args,
    options: {
      baseline: { type: 'string', short: 'b' },
      candidate: { type: 'string', short: 'c' },
    },
  });

  if (!values.baseline) {
    console.error('--baseline is required');
    process.exit(1);
  }

  if (!values.candidate) {
    console.error('--candidate is required');
    process.exit(1);
  }

  return {
    baseline: values.baseline,
    candidate: values.candidate,
  };
};

const fetchBatchScores = async (
  supabase: ReturnType<typeof createAdminClient>,
  label: string
): Promise<number[]> => {
  const { data, error } = await supabase
    .from('prompt_tests')
    .select(`
      id,
      prompt_evaluations (
        score_overall
      )
    `)
    .eq('batch_label', label)
    .eq('status', 'completed');

  if (error) {
    throw new Error(`Failed to fetch scores for ${label}: ${error.message}`);
  }

  return (data || [])
    .map((t) => {
      const evals = t.prompt_evaluations as Array<{ score_overall: number }> | null;
      return evals?.[0]?.score_overall;
    })
    .filter((score): score is number => score !== undefined && score !== null);
};

const compareCommand = async (args: string[]): Promise<void> => {
  const options = parseCompareOptions(args);

  console.log(`\n📊 Prompt Bench: Compare`);
  console.log(`─────────────────────────────────`);
  console.log(`Baseline: ${options.baseline}`);
  console.log(`Candidate: ${options.candidate}`);
  console.log(`─────────────────────────────────\n`);

  const supabase = createAdminClient();

  // Fetch scores for both batches
  let baselineScores: number[];
  let candidateScores: number[];

  try {
    baselineScores = await fetchBatchScores(supabase, options.baseline);
    candidateScores = await fetchBatchScores(supabase, options.candidate);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error: ${message}`);
    process.exit(1);
  }

  if (baselineScores.length === 0) {
    console.error(`No completed evaluations found for baseline "${options.baseline}"`);
    process.exit(1);
  }

  if (candidateScores.length === 0) {
    console.error(`No completed evaluations found for candidate "${options.candidate}"`);
    process.exit(1);
  }

  // Import statistics module
  const {
    welchTTest,
    summarize,
    checkSampleSize,
    formatComparison,
  } = await import('@/lib/prompts/statistics');

  // Check sample sizes
  const baselineCheck = checkSampleSize(baselineScores.length);
  const candidateCheck = checkSampleSize(candidateScores.length);

  let sampleWarning: string | undefined;
  if (!baselineCheck.adequate || !candidateCheck.adequate) {
    sampleWarning = baselineCheck.warning || candidateCheck.warning;
  } else if (baselineCheck.warning || candidateCheck.warning) {
    sampleWarning = baselineCheck.warning || candidateCheck.warning;
  }

  // Run t-test
  const testResult = welchTTest(baselineScores, candidateScores);

  // Format and display
  const summary = {
    baseline: {
      label: options.baseline,
      stats: summarize(baselineScores),
    },
    candidate: {
      label: options.candidate,
      stats: summarize(candidateScores),
    },
    test: testResult,
    sampleWarning,
  };

  console.log(formatComparison(summary));
};

// =============================================================================
// Report Command
// =============================================================================

interface ReportOptions {
  label: string;
  showUrls: boolean;
}

const parseReportOptions = (args: string[]): ReportOptions => {
  const { values } = parseArgs({
    args,
    options: {
      label: { type: 'string', short: 'l' },
      urls: { type: 'boolean', default: false },
    },
  });

  if (!values.label) {
    console.error('--label is required');
    process.exit(1);
  }

  return {
    label: values.label,
    showUrls: values.urls ?? false,
  };
};

const reportCommand = async (args: string[]): Promise<void> => {
  const options = parseReportOptions(args);

  console.log(`\n📋 Prompt Bench: Report`);
  console.log(`─────────────────────────────────`);
  console.log(`Label: ${options.label}`);
  console.log(`─────────────────────────────────\n`);

  const supabase = createAdminClient();

  // Fetch all tests with evaluations for this batch
  const { data: tests, error } = await supabase
    .from('prompt_tests')
    .select(`
      id,
      final_prompt,
      image_url,
      status,
      duration_ms,
      cost_usd,
      prompt_evaluations (
        score_overall,
        details
      )
    `)
    .eq('batch_label', options.label)
    .order('created_at', { ascending: true });

  if (error) {
    console.error(`Database error: ${error.message}`);
    process.exit(1);
  }

  if (!tests || tests.length === 0) {
    console.log(`No tests found for label "${options.label}"`);
    return;
  }

  // Extract scores and build report data
  const scoredTests = tests
    .map((t) => {
      const evals = t.prompt_evaluations as Array<{ score_overall: number; details: unknown }> | null;
      const score = evals?.[0]?.score_overall;
      return {
        id: t.id,
        prompt: t.final_prompt,
        imageUrl: t.image_url,
        status: t.status,
        score: score ?? null,
        durationMs: t.duration_ms,
        costUsd: t.cost_usd,
      };
    })
    .filter((t) => t.score !== null) as Array<{
      id: string;
      prompt: string;
      imageUrl: string | null;
      status: string;
      score: number;
      durationMs: number | null;
      costUsd: number | null;
    }>;

  if (scoredTests.length === 0) {
    console.log(`No evaluated tests found for label "${options.label}"`);
    console.log(`Run: npm run bench evaluate --label "${options.label}"`);
    return;
  }

  const scores = scoredTests.map((t) => t.score);

  // Import statistics
  const { summarize, formatReport, getScoreDistribution } = await import('@/lib/prompts/statistics');

  // Sort by score for top/bottom
  const sortedByScore = [...scoredTests].sort((a, b) => b.score - a.score);

  const report = {
    label: options.label,
    stats: summarize(scores),
    scoreDistribution: getScoreDistribution(scores),
    topScores: sortedByScore.slice(0, 3).map((t) => ({
      id: t.id,
      score: t.score,
      prompt: t.prompt,
    })),
    bottomScores: sortedByScore.slice(-3).reverse().map((t) => ({
      id: t.id,
      score: t.score,
      prompt: t.prompt,
    })),
  };

  console.log(formatReport(report));

  // Show URLs if requested
  if (options.showUrls) {
    console.log(`\n📷 Image URLs:`);
    console.log(`─────────────────────────────────`);
    for (const test of sortedByScore) {
      if (test.imageUrl) {
        console.log(`[${test.score.toFixed(1)}] ${test.imageUrl}`);
      }
    }
  }

  // Cost summary
  const totalGenerationCost = tests.reduce((sum, t) => sum + (t.cost_usd || 0), 0);
  const { data: evalCosts } = await supabase
    .from('prompt_evaluations')
    .select('cost_usd')
    .in('test_id', tests.map((t) => t.id));

  const totalEvalCost = (evalCosts || []).reduce((sum, e) => sum + (e.cost_usd || 0), 0);

  console.log(`\n💰 Cost Summary:`);
  console.log(`─────────────────────────────────`);
  console.log(`   Generation: $${totalGenerationCost.toFixed(4)}`);
  console.log(`   Evaluation: $${totalEvalCost.toFixed(4)}`);
  console.log(`   Total: $${(totalGenerationCost + totalEvalCost).toFixed(4)}`);
};

// =============================================================================
// Main
// =============================================================================

const main = async (): Promise<void> => {
  const { command, args } = parseCommand();

  switch (command) {
    case 'run':
      await runCommand(args);
      break;
    case 'evaluate':
      await evaluateCommand(args);
      break;
    case 'compare':
      await compareCommand(args);
      break;
    case 'report':
      await reportCommand(args);
      break;
    case 'sync':
      await syncCommand();
      break;
    default:
      console.error(`Command not implemented: ${command}`);
      process.exit(1);
  }
};

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});