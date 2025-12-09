/**
 * Run Command - Execute prompt tests against templates
 */

import { parseArgs } from 'node:util';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { BatchFileSchema, type BatchFile, type TestCase } from '@bench/core/types';
import { Result, ok, err, createError, formatError, isOk } from '@bench/core/errors';
import { compileTemplate, generateIdempotencyKey } from '@bench/core/compiler';
import { fetchTemplate } from '@bench/db/templates';
import { resolveSourceImage, type ResolvedSourceImage } from '@bench/core/source-image';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/types/database';
import { createGeminiProvider } from '@/lib/ai/providers/gemini';
import { uploadBuffer, getPublicUrl } from '@/lib/r2';
import { sleep, loadConfig } from './shared';
import { calculateCost } from '@/lib/pricing';

interface RunOptions {
  template: string;
  version: number | 'latest';
  batchFile: string;
  label?: string;
  dryRun: boolean;
}

const parseRunOptions = (args: string[]): RunOptions => {
  const config = loadConfig();

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

  const template = values.template || config?.defaults.template;
  if (!template) {
    console.error('--template is required (or set template in prompt-bench.toml)');
    process.exit(1);
  }

  const batch = values.batch || config?.defaults.batch_file;
  if (!batch) {
    console.error('--batch is required (or set batch_file in prompt-bench.toml)');
    process.exit(1);
  }

  return {
    template,
    version: values.version === 'latest' ? 'latest' : parseInt(values.version, 10),
    batchFile: batch,
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

/**
 * Get the effective source image for a test
 * Per-test sourceImage overrides batch-level default
 */
const getEffectiveSourceImage = (test: TestCase, batchDefault?: string): string | undefined => {
  return test.sourceImage ?? batchDefault;
};

export const runCommand = async (args: string[]): Promise<void> => {
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
  const config = loadConfig();
  const defaultLabelPrefix = config?.defaults.label_prefix || 'batch';
  const batchLabel = options.label || batch.label || `${defaultLabelPrefix}-${Date.now()}`;

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
      const sourceImageRef = getEffectiveSourceImage(test, batch.sourceImage);

      const result = compileTemplate(
        template.templateData,
        template.variablesSchema,
        test.variables
      );

      if (isOk(result)) {
        console.log(`✅ Test ${i + 1}: Valid`);
        console.log(`   Prompt: ${result.data.prompt.slice(0, 80)}...`);
        if (sourceImageRef) {
          console.log(`   Source: ${sourceImageRef}`);
        }
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

  // Cache for uploaded source images (prevents duplicate uploads)
  const sourceImageCache = new Map<string, ResolvedSourceImage>();

  // 5. Run tests
  console.log(`\n🚀 Running ${batch.tests.length} tests...\n`);

  let completed = 0;
  let failed = 0;

  for (let i = 0; i < batch.tests.length; i++) {
    const test = batch.tests[i];
    const testNum = i + 1;

    console.log(`[${testNum}/${batch.tests.length}] Processing...`);

    // Resolve source image if present
    const sourceImageRef = getEffectiveSourceImage(test, batch.sourceImage);
    let resolvedSource: ResolvedSourceImage | undefined;

    if (sourceImageRef) {
      // Check cache first
      if (sourceImageCache.has(sourceImageRef)) {
        resolvedSource = sourceImageCache.get(sourceImageRef)!;
        console.log(`  📷 Using cached source image`);
      } else {
        console.log(`  📷 Loading source image: ${sourceImageRef}`);
        const sourceResult = await resolveSourceImage(sourceImageRef, {
          batchFilePath: options.batchFile,
          skipUpload: false,
        });

        if (!isOk(sourceResult)) {
          console.log(`  ❌ Source image error: ${sourceResult.error.message}`);
          failed++;
          continue;
        }

        resolvedSource = sourceResult.data;
        sourceImageCache.set(sourceImageRef, resolvedSource);
        console.log(`  ✅ Source image loaded (hash: ${resolvedSource.hash.slice(0, 16)}...)`);
      }
    }

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
      batchLabel,
      resolvedSource?.hash
    );

    // Check for existing test with same idempotency key
    const { data: existing } = await supabase
      .from('prompt_tests')
      .select('id, status')
      .eq('idempotency_key', idempotencyKey)
      .single();

    if (existing) {
      if (existing.status === 'failed') {
        // Failed tests should be retried - delete old record and proceed
        console.log(`  🔄 Retrying failed test`);
        const { error: deleteError } = await supabase
          .from('prompt_tests')
          .delete()
          .eq('id', existing.id);

        if (deleteError) {
          console.log(`  ❌ Failed to delete old test: ${deleteError.message}`);
          failed++;
          continue;
        }
        // Fall through to create new test record below
      } else {
        // Completed, evaluating, generating - skip these
        console.log(`  ⏭️  Skipping (already exists: ${existing.status})`);
        if (existing.status === 'completed') completed++;
        continue;
      }
    }

    // Create test record
    const startTime = Date.now();
    const { data: testRecord, error: insertError } = await supabase
      .from('prompt_tests')
      .insert({
        template_id: template.id,
        idempotency_key: idempotencyKey,
        status: 'generating',
        inputs: test.variables as Json,
        final_prompt: compiled.prompt,
        batch_label: batchLabel,
        source_image_url: resolvedSource?.r2Url ?? null,
        source_image_key: resolvedSource?.r2Key ?? null,
      })
      .select()
      .single();

    if (insertError || !testRecord) {
      console.log(`  ❌ Database error: ${insertError?.message}`);
      failed++;
      continue;
    }

    // Generate image
    let generationResult;

    if (resolvedSource) {
      // Image-to-image transformation
      console.log(`  🖼️  Generating (image-to-image)...`);
      generationResult = await gemini.generateFromImage(
        resolvedSource.buffer,
        resolvedSource.mimeType,
        compiled.prompt,
        {
          aspectRatio: '1:1',
          resolution: '2k',
          rawPrompt: true,
        }
      );
    } else {
      // Text-to-image generation
      console.log(`  🖼️  Generating (text-to-image)...`);
      generationResult = await gemini.generateFromText(compiled.prompt, {
        aspectRatio: '1:1',
        resolution: '2k',
        rawPrompt: true,
      });
    }

    if (!generationResult.success) {
      const { error: rpcError } = await supabase.rpc('update_prompt_test_status', {
        p_test_id: testRecord.id,
        p_new_status: 'failed',
        p_error_message: generationResult.error,
        p_error_code: generationResult.code,
      });
      if (rpcError) {
        console.error(`  ⚠️  Failed to update status: ${rpcError.message}`);
      }
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
      const { error: rpcError } = await supabase.rpc('update_prompt_test_status', {
        p_test_id: testRecord.id,
        p_new_status: 'failed',
        p_error_message: message,
        p_error_code: 'STORAGE_ERROR',
      });
      if (rpcError) {
        console.error(`  ⚠️  Failed to update status: ${rpcError.message}`);
      }
      console.log(`  ❌ Upload failed: ${message}`);
      failed++;
      continue;
    }

    // Update test record as completed
    const durationMs = Date.now() - startTime;
    const imageUrl = getPublicUrl(imageKey);

    // Calculate cost from token usage
    let costUsd: number | null = null;
    let inputTokens: number | null = null;
    let outputTokens: number | null = null;

    if (generationResult.usage) {
      inputTokens = generationResult.usage.promptTokens;
      outputTokens = generationResult.usage.completionTokens;

      const costResult = calculateCost('gemini-3-pro-image-preview', {
        input: inputTokens,
        output: outputTokens,
      });

      if (costResult.ok) {
        costUsd = costResult.data.total;
      }
    }

    const { error: updateError } = await supabase
      .from('prompt_tests')
      .update({
        status: 'evaluating', // Ready for evaluation
        image_url: imageUrl,
        image_key: imageKey,
        duration_ms: durationMs,
        completed_at: new Date().toISOString(),
        cost_usd: costUsd,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
      })
      .eq('id', testRecord.id);

    if (updateError) {
      console.error(`  ⚠️  Failed to update test record: ${updateError.message}`);
    }

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
