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
import { createGeminiProvider, createConversationSession } from '@/lib/ai/providers/gemini';
import { uploadBuffer, getPublicUrl } from '@/lib/r2';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveSourceImage, type ResolvedSourceImage } from '@bench/core/source-image';
import { calculateCost } from '@bench/core/cost';
import { classifyProduct } from '@bench/core/category-classifier';
import { getAnglesForCategory } from '@bench/core/category-angles';
import { detectSourceAngles } from '@bench/core/angle-detector';
import { planCollection } from '@bench/core/angle-planner';
import type { CollectionTemplate, ProductCategory } from '@bench/core/types';
import { logger } from '@bench/core/logger';
import { analyzeProductImages } from '@bench/core/product-analyzer';

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
analysisModel?: string;
  analysisEnabled?: boolean;
  analysisCacheEnabled?: boolean;
}

export type ProgressCallback = (
  phase: 'sync' | 'run' | 'evaluate' | 'report' | 'batch_label',
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

interface PromptTestRecord {
  id: string;
  cost_usd?: number;
  [key: string]: unknown;
}

interface RunPhaseResult {
  completed: number;
  failed: number;
  skipped: number;
  tests: PromptTestRecord[];
}

interface EvalPhaseResult {
  completed: number;
  failed: number;
  totalCost: number;
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
      logger.info('Phase started', {
        batchLabel,
        phase: 'sync',
        totalPhases: 4
      });
      const phaseStart = Date.now();

      const syncResult = await syncPhase(options.templateSlug, onProgress);
      if (!isOk(syncResult)) {
        logger.error('Phase failed', {
          batchLabel,
          phase: 'sync',
          duration: `${Date.now() - phaseStart}ms`,
          error: syncResult.error.message
        });
        return syncResult;
      }

      logger.info('Phase completed', {
        batchLabel,
        phase: 'sync',
        duration: `${Date.now() - phaseStart}ms`,
        success: true
      });

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
    logger.info('Phase started', {
      batchLabel,
      phase: 'run',
      totalPhases: 4
    });
    const runPhaseStart = Date.now();

    const runResult = await runPhase(
      template,
      batch,
      batchLabel,
      options.dryRun,
      options.batchFile,
      options.analysisEnabled,
      options.analysisModel,
      options.analysisCacheEnabled,
      onProgress
    );
    if (!isOk(runResult)) {
      logger.error('Phase failed', {
        batchLabel,
        phase: 'run',
        duration: `${Date.now() - runPhaseStart}ms`,
        error: runResult.error.message
      });
      return runResult;
    }

    const runPhaseResult = runResult.data;
    const runDuration = Date.now() - runPhaseStart;
    logger.info('Phase completed', {
      batchLabel,
      phase: 'run',
      duration: `${runDuration}ms`,
      success: true,
      generated: `${runPhaseResult.completed}/${runPhaseResult.completed + runPhaseResult.failed + runPhaseResult.skipped}`
    });

    result.phases.run = {
      completed: runPhaseResult.completed,
      failed: runPhaseResult.failed,
      skipped: runPhaseResult.skipped,
    };

    // Track generation costs
    generationCost = runPhaseResult.tests.reduce((sum: number, test: PromptTestRecord) => sum + (test.cost_usd || 0), 0);

    // Phase 3: Evaluate (optional)
    if (!options.skipEval) {
      logger.info('Phase started', {
        batchLabel,
        phase: 'evaluate',
        totalPhases: 4
      });
      const evalPhaseStart = Date.now();

      const evalResult = await evaluatePhase(batchLabel, options.evalModel, onProgress);
      if (!isOk(evalResult)) {
        logger.error('Phase failed', {
          batchLabel,
          phase: 'evaluate',
          duration: `${Date.now() - evalPhaseStart}ms`,
          error: evalResult.error.message
        });
        return evalResult;
      }

      const evalDuration = Date.now() - evalPhaseStart;
      logger.info('Phase completed', {
        batchLabel,
        phase: 'evaluate',
        duration: `${evalDuration}ms`,
        success: true,
        evaluated: `${evalResult.data.completed}/${evalResult.data.completed + evalResult.data.failed}`
      });

      result.phases.evaluate = evalResult.data;
      evaluationCost = evalResult.data.totalCost;
    }

    // Phase 4: Report (optional)
    if (!options.skipReport) {
      logger.info('Phase started', {
        batchLabel,
        phase: 'report',
        totalPhases: 4
      });
      const reportPhaseStart = Date.now();

      const reportResult = await reportPhase(batchLabel, onProgress);
      if (!isOk(reportResult)) {
        logger.error('Phase failed', {
          batchLabel,
          phase: 'report',
          duration: `${Date.now() - reportPhaseStart}ms`,
          error: reportResult.error.message
        });
        return reportResult;
      }

      logger.info('Phase completed', {
        batchLabel,
        phase: 'report',
        duration: `${Date.now() - reportPhaseStart}ms`,
        success: true
      });

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
  analysisEnabled: boolean | undefined,
  analysisModel: string | undefined,
  analysisCacheEnabled: boolean | undefined,
  onProgress?: ProgressCallback
): Promise<Result<RunPhaseResult>> => {
  // Handle collection templates differently
  if ('type' in template && template.type === 'collection') {
    return runCollectionPhase(
      template as CollectionTemplate,
      batch,
      batchLabel,
      dryRun,
      batchFilePath,
      analysisEnabled,
      analysisModel,
      analysisCacheEnabled,
      onProgress
    );
  }

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
      // Step: Resolve source images if specified
      let resolvedSourceImage: ResolvedSourceImage | undefined;
      const resolvedSourceImages: ResolvedSourceImage[] = [];

      // Get source images - prefer sourceImages array, fallback to single sourceImage
      const sourceImagePaths = testCase.sourceImages ||
        (testCase.sourceImage ? [testCase.sourceImage] :
        (batch.sourceImage ? [batch.sourceImage] : []));

      if (sourceImagePaths.length > 0) {
        logger.debug('Step started', {
          batchLabel,
          phase: 'run',
          step: 'resolve_source_images',
          testIndex: i,
          imageCount: sourceImagePaths.length
        });
        const resolveStart = Date.now();

        for (const sourceImagePath of sourceImagePaths) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const resolveResult = await resolveSourceImage(sourceImagePath as any, {
            batchFilePath: batchFilePath,
            skipUpload: false,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any);
          if (!isOk(resolveResult)) {
            return err(createError(
              'SOURCE_IMAGE_ERROR',
              `Test ${i + 1}/${total} failed to resolve source image: ${resolveResult.error.message}`,
              { testId: `test-${i}` }
            ));
          }
          resolvedSourceImages.push(resolveResult.data as ResolvedSourceImage);
        }

        // Use first image for generation (single template)
        resolvedSourceImage = resolvedSourceImages[0];

        logger.debug('Step completed', {
          batchLabel,
          phase: 'run',
          step: 'resolve_source_images',
          testIndex: i,
          duration: `${Date.now() - resolveStart}ms`,
          imageCount: resolvedSourceImages.length
        });
      }

      // Step: Analyze product if enabled (use ALL images for better consensus)
      if (analysisEnabled && resolvedSourceImages.length > 0) {
        logger.debug('Step started', {
          batchLabel,
          phase: 'run',
          step: 'analyze_product',
          testIndex: i,
          imageCount: resolvedSourceImages.length
        });
        const analysisStart = Date.now();

        const analysisResult = await analyzeProductImages(
          resolvedSourceImages.map(img => ({ buffer: img.buffer, mimeType: img.mimeType })),
          {
            model: analysisModel,
            cacheEnabled: analysisCacheEnabled
          }
        );

        if (!isOk(analysisResult)) {
          return err(createError(
            'ANALYSIS_ERROR',
            `Test ${i + 1}/${total} failed analysis (${resolvedSourceImages.length} images): ${analysisResult.error.message}`,
            { testId: `test-${i}` }
          ));
        }

        // Merge analysis results into variables (manual values take precedence)
        testCase.variables = {
          ...analysisResult.data.merged,  // Analysis results as defaults
          ...testCase.variables     // Manual overrides
        };

        logger.debug('Step completed', {
          batchLabel,
          phase: 'run',
          step: 'analyze_product',
          testIndex: i,
          duration: `${Date.now() - analysisStart}ms`,
          analysis: analysisResult.data.merged
        });
      }

      // Step: Compile template
      logger.debug('Step started', {
        batchLabel,
        phase: 'run',
        step: 'compile_template',
        testIndex: i
      });
      const compileStart = Date.now();

      const compileResult = compileTemplate(
        template.templateData,
        template.variablesSchema,
        testCase.variables
      );
      if (!isOk(compileResult)) {
        logger.debug('Step failed', {
          batchLabel,
          phase: 'run',
          step: 'compile_template',
          testIndex: i,
          duration: `${Date.now() - compileStart}ms`,
          error: compileResult.error.message
        });
        return err(createError(
          'COMPILATION_ERROR',
          `Test ${i + 1}/${total} failed to compile: ${compileResult.error.message}`,
          { testId: `test-${i}` }
        ));
      }
      const compiled = compileResult.data;

      logger.debug('Step completed', {
        batchLabel,
        phase: 'run',
        step: 'compile_template',
        testIndex: i,
        duration: `${Date.now() - compileStart}ms`
      });

      // Generate idempotency key
      const idempotencyKey = generateIdempotencyKey(
        template.slug,
        template.version,
        {
          ...testCase.variables,
          angle,
          outputIndex: j,
          detectedCategory: category,
        },
        batchLabel,
        sourceImage?.hash
      );

      // Check for existing test
      const { data: existingTest } = await supabase
        .from('prompt_tests')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .single();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (existingTest && (existingTest as any).status !== 'failed') {
        // Skip existing successful test
        skipped++;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tests.push(existingTest as any);
        continue;
      }

      if (dryRun) {
        completed++;
        continue;
      }

      if (!template.id) {
        return err(createError(
          'VALIDATION_ERROR',
          `Template ${template.slug} has no ID. Ensure template is synced to database first.`
        ));
      }

      // Create test record
      const { data: testRecord, error: insertError } = await (supabase
        .from('prompt_tests')
        .insert({
          template_id: template.id,
          idempotency_key: idempotencyKey,
          status: 'generating',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          inputs: testCase.variables as any,
          final_prompt: compiled.prompt,
          batch_label: batchLabel,
          source_image_url: resolvedSourceImage?.r2Url,
          source_image_key: resolvedSourceImage?.r2Key,
        })
        .select()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      await uploadBuffer(buffer, imageKey, 'image/png');

      // Calculate generation cost
      let generationCost = 0;
      if (generationResult.usage) {
        const costResult = calculateCost('gemini-3-pro-image-preview', {
          input: generationResult.usage.promptTokens,
          output: generationResult.usage.completionTokens,
        });

        if (costResult.ok) {
          generationCost = costResult.data.total;
        } else {
          console.warn(`⚠️  Failed to calculate cost for test generation: ${costResult.error.message}`);
        }
      } else {
        // Fallback cost for image generation when usage data is not available
        // Estimate based on typical image generation complexity
        const estimatedInputTokens = 1000;  // Prompt tokens
        const estimatedOutputTokens = 50000; // Estimated "complexity" tokens for image
        const costResult = calculateCost('gemini-3-pro-image-preview', {
          input: estimatedInputTokens,
          output: estimatedOutputTokens,
        });

        if (costResult.ok) {
          generationCost = costResult.data.total;
          console.log(`📊 Using estimated cost for test generation: ${testRecord.id} (${generationCost.toFixed(6)})`);
        } else {
          console.warn(`⚠️  Failed to calculate estimated cost for test generation: ${costResult.error.message}`);
        }
      }

      // Update test record with success
      const imageUrl = getPublicUrl(imageKey);

      // Store token usage for cost recalculation if available
      const updateData: {
        status: 'completed';
        image_url: string;
        image_key: string;
        completed_at: string;
        duration_ms: number;
        cost_usd: number;
        input_tokens?: number;
        output_tokens?: number;
      } = {
        status: 'completed',
        image_url: imageUrl,
        image_key: imageKey,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - generationStart,
        cost_usd: generationCost,
      };

      if (generationResult.usage) {
        updateData.input_tokens = generationResult.usage.promptTokens;
        updateData.output_tokens = generationResult.usage.completionTokens;
      }

      const { data: updatedTest } = await supabase
        .from('prompt_tests')
        .update(updateData)
        .eq('id', testRecord.id)
        .select()
        .single();

      completed++;
      // Use updated test record with fresh cost_usd from database
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tests.push((updatedTest || testRecord) as any);

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

// =============================================================================
// Collection Generation Coordination
// =============================================================================

interface GenerationDependencies {
  supabase: ReturnType<typeof createAdminClient>;
  gemini: ReturnType<typeof createGeminiProvider>;
}

export const coordinateCollectionGeneration = async (
  template: CollectionTemplate,
  batch: BatchFile,
  batchLabel: string,
  dryRun: boolean,
  batchFilePath: string,
  dependencies: GenerationDependencies,
  onProgress?: ProgressCallback,
  analysisEnabled?: boolean,
  analysisModel?: string,
  analysisCacheEnabled?: boolean
): Promise<Result<{ completed: number; failed: number; skipped: number; tests: PromptTest[] }>> => {
  const { supabase, gemini } = dependencies;

  let completed = 0;
  let failed = 0;
  let skipped = 0;
  const tests: PromptTest[] = [];

  // Process each test case
  for (let i = 0; i < batch.tests.length; i++) {
    const testCase = batch.tests[i];
    onProgress?.('run', i, batch.tests.length, `Processing collection test ${i + 1}/${batch.tests.length}...`);

    // Get source images for analysis and angle detection
    const sourceImages = testCase.sourceImages || (testCase.sourceImage ? [testCase.sourceImage] : []);
    const needsAnalysis = analysisEnabled && sourceImages.length > 0;

    // Initialize scale instruction (will be populated from analysis if available)
    let scaleInstruction = 'SCALE REQUIREMENT: Maintain consistent realistic product dimensions across all generated images.';

    // Initialize brand instruction (will be populated from analysis if available)
    let brandInstruction = '';

    // Resolve ALL source images if needed for analysis or angle detection
    const resolvedSourceImagesForAnalysis: ResolvedSourceImage[] = [];
    if ((needsAnalysis || sourceImages.length > 0) && sourceImages.length > 0) {
      for (const sourceImagePath of sourceImages) {
        const resolveResult = await resolveSourceImage(sourceImagePath, {
          batchFilePath: batchFilePath,
          skipUpload: false,
        });
        if (!isOk(resolveResult)) {
          return err(createError(
            'SOURCE_IMAGE_ERROR',
            `Test ${i + 1}/${batch.tests.length} failed to resolve source image: ${resolveResult.error.message}`,
            { testId: `test-${i}` }
          ));
        }
        resolvedSourceImagesForAnalysis.push(resolveResult.data);
      }
    }

    // Run product analysis if enabled (use ALL images for better consensus)
    if (needsAnalysis && resolvedSourceImagesForAnalysis.length > 0) {
      logger.debug('Step started', {
        batchLabel,
        phase: 'run',
        step: 'analyze_product',
        testIndex: i,
        imageCount: resolvedSourceImagesForAnalysis.length
      });
      const analysisStart = Date.now();

      const analysisResult = await analyzeProductImages(
        resolvedSourceImagesForAnalysis.map(img => ({ buffer: img.buffer, mimeType: img.mimeType })),
        {
          model: analysisModel,
          cacheEnabled: analysisCacheEnabled
        }
      );

      if (!isOk(analysisResult)) {
        return err(createError(
          'ANALYSIS_ERROR',
          `Test ${i + 1}/${batch.tests.length} failed analysis: ${analysisResult.error.message}`,
          { testId: `test-${i}` }
        ));
      }

      // Merge analysis results into variables (manual values take precedence)
      testCase.variables = {
        ...analysisResult.data.merged,
        ...testCase.variables
      };

      // Build scale instruction from individual image analyses
      const imagesWithScale = analysisResult.data.individual
        .map((analysis, idx) => ({
          index: idx,
          hasScale: analysis.hasScaleReference,
          description: analysis.scaleDescription
        }))
        .filter(x => x.hasScale);

      if (imagesWithScale.length > 0) {
        const scaleImage = imagesWithScale[0]; // Prioritize first one found
        scaleInstruction = `SCALE REQUIREMENT: Image ${scaleImage.index + 1} shows scale reference${scaleImage.description ? ` (${scaleImage.description})` : ''}. Maintain exact same physical product dimensions in all generated images.`;
      }

      // Build brand instruction from merged analysis
      if (analysisResult.data.merged.brand) {
        const details = analysisResult.data.merged.brandingDetails ? ` ${analysisResult.data.merged.brandingDetails}` : '';
        brandInstruction = `CRITICAL: The product MUST display "${analysisResult.data.merged.brand}" branding exactly as shown in the reference images.${details} This text must be clearly legible and accurately reproduced.`;
      }

      logger.debug('Step completed', {
        batchLabel,
        phase: 'run',
        step: 'analyze_product',
        testIndex: i,
        duration: `${Date.now() - analysisStart}ms`,
        analysis: analysisResult.data.merged,
        scaleInstruction
      });
    }

    // Detect product category (use first image for fallback planning)
    let category: ProductCategory = 'generic';
    if (resolvedSourceImagesForAnalysis.length > 0) {
      const categoryResult = await classifyProduct(resolvedSourceImagesForAnalysis[0].r2Url);
      if (isOk(categoryResult)) {
        category = categoryResult.data;
      }
    }

    // Step 1: Detect angles from source images (only if we have images)
    let detectedAngles;
    if (resolvedSourceImagesForAnalysis.length > 0) {
      const detected = await detectSourceAngles(resolvedSourceImagesForAnalysis, {
        cacheEnabled: analysisCacheEnabled
      });

      if (!isOk(detected)) {
        logger.warn('Angle detection failed completely, will use category fallbacks in planner', {
          error: detected.error.message,
          category,
          sourceImageCount: resolvedSourceImagesForAnalysis.length
        });
        // Create minimal fallback - planner will handle category fallbacks
        detectedAngles = {
          sourceAngles: resolvedSourceImagesForAnalysis.map((_, index) => ({
            imageIndex: index,
            detectedAngle: 'unknown',
            isPrimaryReference: index === 0
          }))
        };
      } else {
        detectedAngles = detected.data;
      }
    } else {
      // No source images - planner will use only category defaults
      detectedAngles = { sourceAngles: [] };
    }

    // Step 2: Plan the collection or use category fallback for text-to-image
    let plan;
    if (resolvedSourceImagesForAnalysis.length > 0) {
      plan = planCollection(detectedAngles, category, template.outputCount);
    } else {
      // No source images - use category defaults directly
      const categoryAngles = getAnglesForCategory(category);
      plan = {
        assignments: categoryAngles.slice(0, template.outputCount).map((angle, index) => ({
          targetAngle: angle,
          sourceImageIndex: 0, // Won't be used
          matchType: 'primary-fallback' as const
        }))
      };
    }

    // Step 3: Generate each image using plan assignments
    // Create conversation session for this collection (separate factory, not on provider)
    const session = createConversationSession();

    // Use angle detection to label source images (soft hints, not hard coupling)
    // This helps AI understand what each reference shows without prescribing usage
    const labeledImages = resolvedSourceImagesForAnalysis.map((img, i) => ({
      buffer: img.buffer,
      mimeType: img.mimeType,
      label: detectedAngles.sourceAngles[i]?.detectedAngle || `reference ${i + 1}`
    }));

    // Initialize with labeled reference images
    await session.initialize(
      labeledImages,
      `Product: ${testCase.variables?.product || 'product'}
Category: ${category}
You have ${labeledImages.length} reference images of this product from different angles.
You will be asked to generate ${template.outputCount} professional e-commerce photos, one at a time.
Each photo must be visually unique from previous outputs.`
    );

    // Generate each angle - AI chooses best reference naturally
    const targetAngles = getAnglesForCategory(category).slice(0, template.outputCount);

    for (let j = 0; j < targetAngles.length; j++) {
      const angle = targetAngles[j];

      // Compile prompt as before
      const compileResult = compileTemplate(
        template.templateData,
        template.variablesSchema,
        {
          ...testCase.variables,
          angle,
          category,
          outputIndex: j,
          totalOutputs: template.outputCount
        }
      );
      if (!isOk(compileResult)) {
        return err(createError(
          'COMPILATION_ERROR',
          `Test ${i + 1}/${batch.tests.length}, image ${j + 1} failed to compile: ${compileResult.error.message}`,
          { testId: `test-${i}-${j}` }
        ));
      }

      // Build angle-specific prompt with diversity, scale, and brand instructions
      const prompt = `Generate image ${j + 1}/${targetAngles.length}: ${angle} view.
${scaleInstruction}
${brandInstruction}
This must be distinctly different from any previous images.
${compileResult.data.prompt}`;

      const idempotencyKey = generateIdempotencyKey(
        template.slug,
        template.version,
        {
          ...testCase.variables,
          angle,
          outputIndex: j,
          detectedCategory: category,
        },
        batchLabel,
        null // No specific source image hash for session-based generation
      );

      // Check for existing test
      const { data: existingTest } = await supabase
        .from('prompt_tests')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .single();

      if (existingTest && (existingTest as any).status !== 'failed') {
        skipped++;
        tests.push(existingTest as any);
        continue;
      }

      if (dryRun) {
        completed++;
        continue;
      }

      if (!template.id) {
        return err(createError(
          'VALIDATION_ERROR',
          `Template ${template.slug} has no ID. Ensure template is synced to database first.`
        ));
      }

      // Create test record
      const { data: testRecord, error: insertError } = await (supabase
        .from('prompt_tests')
        .insert({
          template_id: template.id,
          idempotency_key: idempotencyKey,
          status: 'generating',
          inputs: {
            ...testCase.variables,
            angle,
            outputIndex: j,
            detectedCategory: category,
          } as any,
          final_prompt: prompt,
          batch_label: batchLabel,
          source_image_url: null, // Session-based, no specific source
          source_image_key: null,
        })
        .select()
        .single() as any);

      if (insertError || !testRecord) {
        return err(createError(
          'DATABASE_ERROR',
          `Test ${i + 1}/${batch.tests.length}, image ${j + 1} failed to create: ${insertError?.message || 'Unknown error'}`,
          { testId: `test-${i}-${j}` }
        ));
      }

      // Generate image using session
      const generationStart = Date.now();
      const generationResult = await session.generateNext(prompt, {
        rawPrompt: true,
        aspectRatio: '1:1' as const,
        resolution: '1k' as const
      });

      if (!generationResult.success) {
        await supabase
          .from('prompt_tests')
          .update({
            status: 'failed',
            error_message: generationResult.error,
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - generationStart,
          })
          .eq('id', testRecord.id);
        failed++;
        return err(createError(
          'GENERATION_ERROR',
          `Test ${i + 1}/${batch.tests.length}, image ${j + 1} failed: ${generationResult.error}`,
          { testId: testRecord.id }
        ));
      }

      // Upload and complete test
      const imageKey = `prompt-tests/${testRecord.id}.png`;
      const buffer = Buffer.from(generationResult.imageData, 'base64');
      await uploadBuffer(buffer, imageKey, 'image/png');

      let generationCost = 0;
      if (generationResult.usage) {
        const costResult = calculateCost('gemini-3-pro-image-preview', {
          input: generationResult.usage.promptTokens,
          output: generationResult.usage.completionTokens,
        });
        if (costResult.ok) {
          generationCost = costResult.data.total;
        }
      } else {
        const costResult = calculateCost('gemini-3-pro-image-preview', {
          input: 1000,
          output: 50000,
        });
        if (costResult.ok) {
          generationCost = costResult.data.total;
        }
      }

      const imageUrl = getPublicUrl(imageKey);
      const updateData = {
        status: 'completed' as const,
        image_url: imageUrl,
        image_key: imageKey,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - generationStart,
        cost_usd: generationCost,
        input_tokens: generationResult.usage?.promptTokens,
        output_tokens: generationResult.usage?.completionTokens,
      };

      const { data: updatedTest } = await supabase
        .from('prompt_tests')
        .update(updateData)
        .eq('id', testRecord.id)
        .select()
        .single();

      completed++;
      // Use updated test record with fresh cost_usd from database
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tests.push((updatedTest || testRecord) as any);
    }
  }

  return ok({ completed, failed, skipped, tests });
};

const runCollectionPhase = async (
  template: CollectionTemplate,
  batch: BatchFile,
  batchLabel: string,
  dryRun: boolean,
  batchFilePath: string,
  analysisEnabled: boolean | undefined,
  analysisModel: string | undefined,
  analysisCacheEnabled: boolean | undefined,
  onProgress?: ProgressCallback
): Promise<Result<RunPhaseResult>> => {
  const supabase = createAdminClient();
  const gemini = createGeminiProvider();

  const result = await coordinateCollectionGeneration(
    template,
    batch,
    batchLabel,
    dryRun,
    batchFilePath,
    { supabase, gemini },
    onProgress,
    analysisEnabled,
    analysisModel,
    analysisCacheEnabled
  );

  if (!isOk(result)) return result;

  const { completed, failed, skipped, tests } = result.data;

  return ok({ completed, failed, skipped, tests });
};

const evaluatePhase = async (
  batchLabel: string,
  evalModel: string,
  onProgress?: ProgressCallback
): Promise<Result<EvalPhaseResult>> => {
  const supabase = createAdminClient();

  onProgress?.('evaluate', 0, 1, 'Fetching tests for evaluation...');

  // Fetch tests that need evaluation (no existing evaluation record)
  // First get all completed tests, then filter out those with evaluations
  const { data: allTests, error: testsError } = await supabase
    .from('prompt_tests')
    .select('*, prompt_evaluations(id)')
    .eq('batch_label', batchLabel)
    .eq('status', 'completed');

  if (testsError) {
    return err(createError('DATABASE_ERROR', `Failed to fetch tests: ${testsError.message}`));
  }

  // Filter to only tests without evaluations
  const tests = allTests?.filter(t =>
    !t.prompt_evaluations || t.prompt_evaluations.length === 0
  ) ?? [];

  if (tests.length === 0) {
    onProgress?.('evaluate', 1, 1, 'No tests to evaluate');
    return ok({ completed: 0, failed: 0, totalCost: 0 });
  }

  // Update test statuses to evaluating
  const testIds = tests.map(t => t.id);
  await (supabase
    .from('prompt_tests')
    .update({ status: 'evaluating' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .in('id', testIds) as any);

  // Prepare evaluation inputs
  const evaluationInputs = tests
    .filter(test => test.image_key !== null && test.image_key !== undefined)
    .map(test => ({
      id: test.id,
      imageKey: test.image_key as string,
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .eq('id', id) as any);
        completed++;
      }
    } else {
      // Update test with evaluation error
      console.error(`Evaluation failed for test ${id}: ${result.error.message}`);
      await (supabase
        .from('prompt_tests')
        .update({
          status: 'failed',
          error_message: `Evaluation failed: ${result.error.message}`,
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .eq('id', id) as any);
      failed++;
    }
  }

  onProgress?.('evaluate', tests.length, tests.length, `Evaluation completed: ${completed} evaluated, ${failed} failed`);

  // Aggregate actual evaluation costs from database
  const { data: evalCosts, error: costError } = await supabase
    .from('prompt_tests')
    .select('prompt_evaluations!inner(cost_usd)')
    .eq('batch_label', batchLabel)
    .eq('status', 'completed');

  const totalCost = costError
    ? 0
    : (evalCosts ?? []).flatMap(test => test.prompt_evaluations ?? []).reduce((sum, e) => sum + (e.cost_usd ?? 0), 0);


  return ok({ completed, failed, totalCost });
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