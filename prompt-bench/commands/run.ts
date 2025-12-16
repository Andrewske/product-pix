/**
 * Run Command - Execute prompt tests against templates
 */

import { parseArgs } from 'node:util';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { BatchFileSchema, type BatchFile, type TestCase } from '@bench/core/types';
import { logger } from '@bench/core/logger';
import { Result, ok, err, createError, formatError, isOk } from '@bench/core/errors';
import { compileTemplate, generateIdempotencyKey } from '@bench/core/compiler';
import { fetchTemplate } from '@bench/db/templates';
import { resolveSourceImage, type ResolvedSourceImage } from '@bench/core/source-image';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/types/database';
import { createGeminiProvider } from '@/lib/ai/providers/gemini';
import { uploadBuffer, getPublicUrl } from '@/lib/r2';
import { sleep, loadConfig } from './shared';
import { calculateCost } from '@bench/core/cost';

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
    logger.error('Template is required (or set template in prompt-bench.toml)');
    process.exit(1);
  }

  const batch = values.batch || config?.defaults.batch_file;
  if (!batch) {
    logger.error('Batch file is required (or set batch_file in prompt-bench.toml)');
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

  logger.info('Run command started', {
    template: options.template,
    version: options.version,
    batchFile: options.batchFile,
    label: options.label,
    dryRun: options.dryRun
  });

  // 1. Load batch file
  const batchResult = loadBatchFile(options.batchFile);
  if (!isOk(batchResult)) {
    logger.error('Failed to load batch file', {
      batchFile: options.batchFile,
      error: formatError(batchResult.error)
    });
    process.exit(1);
  }
  const batch = batchResult.data;
  const config = loadConfig();
  const defaultLabelPrefix = config?.defaults.label_prefix || 'batch';
  const batchLabel = options.label || batch.label || `${defaultLabelPrefix}-${Date.now()}`;

  logger.info('Batch file loaded', {
    batchLabel,
    testCount: batch.tests.length,
    batchFile: options.batchFile
  });

  // 2. Fetch template
  const templateResult = await fetchTemplate(options.template, options.version);
  if (!isOk(templateResult)) {
    logger.error('Failed to fetch template', {
      batchLabel,
      template: options.template,
      version: options.version,
      error: formatError(templateResult.error)
    });
    process.exit(1);
  }
  const template = templateResult.data;

  logger.info('Template loaded', {
    batchLabel,
    template: template.slug,
    version: template.version
  });

  // 3. Dry run - validate only
  if (options.dryRun) {
    logger.info('Starting dry run validation', { batchLabel });

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
        logger.info(`Test ${i + 1}: Valid`, {
          batchLabel,
          testIndex: i + 1,
          promptPreview: result.data.prompt.slice(0, 80),
          sourceImage: sourceImageRef
        });
        valid++;
      } else {
        logger.error(`Test ${i + 1}: Invalid`, {
          batchLabel,
          testIndex: i + 1,
          error: result.error.message
        });
        invalid++;
      }
    }

    logger.info('Dry run validation completed', {
      batchLabel,
      valid,
      invalid
    });
    return;
  }

  // 4. Initialize providers
  const supabase = createAdminClient();
  const gemini = createGeminiProvider();

  // Cache for uploaded source images (prevents duplicate uploads)
  const sourceImageCache = new Map<string, ResolvedSourceImage>();

  // 5. Run tests
  logger.info('Starting test execution', {
    batchLabel,
    testCount: batch.tests.length
  });

  let completed = 0;
  let failed = 0;

  for (let i = 0; i < batch.tests.length; i++) {
    const test = batch.tests[i];
    const testNum = i + 1;

    logger.info(`Processing test ${testNum}/${batch.tests.length}`, {
      batchLabel,
      testIndex: testNum
    });

    // Resolve source image if present
    const sourceImageRef = getEffectiveSourceImage(test, batch.sourceImage);
    let resolvedSource: ResolvedSourceImage | undefined;

    if (sourceImageRef) {
      // Check cache first
      if (sourceImageCache.has(sourceImageRef)) {
        const cachedSource = sourceImageCache.get(sourceImageRef);
        if (cachedSource) {
          resolvedSource = cachedSource;
          logger.info('Using cached source image', {
            batchLabel,
            testIndex: testNum,
            sourceImage: sourceImageRef
          });
        }
      }

      if (!resolvedSource) {
        logger.info('Loading source image', {
          batchLabel,
          testIndex: testNum,
          sourceImage: sourceImageRef
        });
        const sourceResult = await resolveSourceImage(sourceImageRef, {
          batchFilePath: options.batchFile,
          skipUpload: false,
        });

        if (!isOk(sourceResult)) {
          logger.error('Source image loading failed', {
            batchLabel,
            testIndex: testNum,
            sourceImage: sourceImageRef,
            error: sourceResult.error.message
          });
          failed++;
          continue;
        }

        resolvedSource = sourceResult.data;
        sourceImageCache.set(sourceImageRef, resolvedSource);
        logger.info('Source image loaded', {
          batchLabel,
          testIndex: testNum,
          sourceImage: sourceImageRef,
          hash: resolvedSource.hash.slice(0, 16)
        });
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
      logger.error('Template compilation failed', {
        batchLabel,
        testIndex: testNum,
        error: compileResult.error.message
      });
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
        logger.info('Retrying failed test', {
          batchLabel,
          testIndex: testNum,
          existingId: existing.id
        });
        const { error: deleteError } = await supabase
          .from('prompt_tests')
          .delete()
          .eq('id', existing.id);

        if (deleteError) {
          logger.error('Failed to delete old test record', {
            batchLabel,
            testIndex: testNum,
            existingId: existing.id,
            error: deleteError.message
          });
          failed++;
          continue;
        }
        // Fall through to create new test record below
      } else {
        // Completed, evaluating, generating - skip these
        logger.info('Skipping existing test', {
          batchLabel,
          testIndex: testNum,
          status: existing.status
        });
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
      logger.error('Database insert failed', {
        batchLabel,
        testIndex: testNum,
        error: insertError?.message
      });
      failed++;
      continue;
    }

    // Generate image
    let generationResult;

    if (resolvedSource) {
      // Image-to-image transformation
      logger.info('Starting image-to-image generation', {
        batchLabel,
        testIndex: testNum
      });
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
      logger.info('Starting text-to-image generation', {
        batchLabel,
        testIndex: testNum
      });
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
        logger.warn('Failed to update test status', {
          batchLabel,
          testIndex: testNum,
          testId: testRecord.id,
          error: rpcError.message
        });
      }
      logger.error('Generation failed', {
        batchLabel,
        testIndex: testNum,
        testId: testRecord.id,
        error: generationResult.error,
        code: generationResult.code
      });
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
        logger.warn('Failed to update test status after upload failure', {
          batchLabel,
          testIndex: testNum,
          testId: testRecord.id,
          error: rpcError.message
        });
      }
      logger.error('Image upload failed', {
        batchLabel,
        testIndex: testNum,
        testId: testRecord.id,
        error: message
      });
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
      logger.warn('Failed to update test record', {
        batchLabel,
        testIndex: testNum,
        testId: testRecord.id,
        error: updateError.message
      });
    }

    logger.info('Test completed successfully', {
      batchLabel,
      testIndex: testNum,
      testId: testRecord.id,
      durationMs,
      costUsd
    });
    completed++;

    // Rate limiting: wait between requests
    if (i < batch.tests.length - 1) {
      await sleep(1000);
    }
  }

  // Summary
  logger.success('Run command completed', {
    batchLabel,
    completed,
    failed,
    total: batch.tests.length
  });

  logger.info('Next steps', {
    batchLabel,
    nextCommand: `bun bench evaluate --label "${batchLabel}"`
  });
};
