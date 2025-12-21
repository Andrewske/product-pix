import { Result, ok, err, createError, isOk } from '@bench/core/errors';
import { analyzeProductImages } from '@bench/core/product-analyzer';
import { compileTemplate } from '@bench/core/compiler';
import { createGeminiProvider, createConversationSession } from '@/lib/ai/providers/gemini';
import type { ImageConfig } from '@/lib/ai/types';
import { uploadBase64Image } from '@/lib/r2';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@bench/core/logger';
import { evaluateImage } from '@bench/core/evaluator';
import type { EvaluationDetails, TemplateData, ProductCategory, DetectedAngles, AnglePlan, ConversationGenerationRequest, ConversationGenerationResult } from '@bench/core/types';
import { calculateCost } from '@bench/core/cost';
import { classifyProduct } from '@bench/core/category-classifier';
import { detectSourceAngles } from '@bench/core/angle-detector';
import { planCollection } from '@bench/core/angle-planner';

// =============================================================================
// Types
// =============================================================================

interface FixtureImage {
  id: string;
  product: string;
  filename: string;
  filepath: string;
  r2_url: string;
  r2_key: string;
  created_at: string;
}

export interface AnalysisRequest {
  sessionId: string;
  fixtureImageIds: string[];
  variables?: Record<string, unknown>;
  model?: string;
  cacheEnabled?: boolean;
  customPrompt?: string;
  customSchema?: Record<string, any>;
}

export interface AnalysisResult {
  runId: string;
  phaseRunNumber: number;
  analysis: Record<string, unknown>;
  detectedAngles?: DetectedAngles;
  category?: ProductCategory;
  tokens: { input: number; output: number };
  rawPrompt: string;
  rawResponse: unknown;
  databaseRecord: unknown;
}

export interface GenerationRequest {
  sessionId: string;
  parentRunId: string;
  templateSlug: string;
  templateData: Record<string, unknown>;
  variables?: Record<string, unknown>;
  model?: string;
  config?: ImageConfig;
}

export interface GenerationResult {
  runId: string;
  parentRunId: string;
  phaseRunNumber: number;
  imageUrls: string[];
  finalPrompt: string;
  thinking: string | null;
  tokens: { input: number; output: number };
}

export interface EvaluationRequest {
  sessionId: string;
  parentRunId: string;        // Generation run to evaluate
  evaluationPrompt?: string;  // Optional custom prompt override
  model?: string;             // Default: claude-sonnet-4-20250514
}

interface AnalysisResultData {
  data: {
    usage: { input: number; output: number };
    raw: unknown;
  };
}

export interface EvaluationPhaseResult {
  runId: string;              // prompt_tests.id
  phaseRunNumber: number;
  evaluationId: string;       // prompt_evaluations.id
  scoreOverall: number;
  details: EvaluationDetails;
  tokens: { input: number; output: number };
}

// =============================================================================
// Analysis Phase
// =============================================================================

const fetchFixtureImages = async (
  supabase: ReturnType<typeof createAdminClient>,
  fixtureImageIds: string[]
): Promise<Result<FixtureImage[]>> => {
  const { data: fixtures, error: fetchError } = await supabase
    .from('fixture_images')
    .select('*')
    .in('id', fixtureImageIds);

  if (fetchError) {
    return err(createError('DATABASE_ERROR', `Failed to fetch fixtures: ${fetchError.message}`));
  }

  if (!fixtures || fixtures.length === 0) {
    return err(createError('VALIDATION_ERROR', 'No valid fixture images found'));
  }

  return ok(fixtures);
};

const downloadImagesFromR2 = async (fixtures: FixtureImage[]): Promise<Result<{ buffer: Buffer; mimeType: string }[]>> => {
  try {
    const images = await Promise.all(
      fixtures.map(async (fixture) => {
        const response = await fetch(fixture.r2_url);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${fixture.r2_url}: ${response.statusText}`);
        }
        const buffer = await response.arrayBuffer();
        return {
          buffer: Buffer.from(buffer),
          mimeType: 'image/jpeg' as const
        };
      })
    );
    return ok(images);
  } catch (error) {
    return err(createError('NETWORK_ERROR', `Failed to download images: ${error.message}`));
  }
};

/**
 * Get the next phase run number for a session
 * Note: For notebook sessions, we want global phase numbering across all parents
 * (e.g., if you run generation from Analysis 1, then from Analysis 2, they should be Gen 1, Gen 2)
 * This ensures unique upload keys and prevents R2 cache collisions
 */
const getNextPhaseRunNumber = async (
  supabase: ReturnType<typeof createAdminClient>,
  sessionId: string,
  phase: 'analysis' | 'generation' | 'evaluation',
  parentRunId?: string
): Promise<Result<number>> => {
  // For notebook sessions: use global phase numbering (ignore parent)
  // For CLI batch runs: use per-parent numbering (include parent filter)
  const isNotebookSession = sessionId.startsWith('notebook-');

  let query = supabase
    .from('prompt_tests')
    .select('phase_run_number')
    .eq('session_id', sessionId)
    .eq('phase', phase);

  // Only filter by parent for non-notebook sessions
  if (parentRunId && !isNotebookSession) {
    query = query.eq('parent_run_id', parentRunId);
  }

  const { data: existingRuns, error } = await query
    .order('phase_run_number', { ascending: false })
    .limit(1);

  if (error) {
    return err(createError('DATABASE_ERROR', `Failed to query phase runs: ${error.message}`));
  }

  const phaseRunNumber = (existingRuns?.[0]?.phase_run_number || 0) + 1;
  return ok(phaseRunNumber);
};

/**
 * Store evaluation results in database
 */
const storeEvaluationResult = async (
  supabase: ReturnType<typeof createAdminClient>,
  sessionId: string,
  phaseRunNumber: number,
  parentRunId: string,
  evaluationPrompt: string | undefined,
  overall: number,
  details: EvaluationDetails,
  tokensUsed: number,
  costUsd: number,
  evaluatorModel: string
): Promise<Result<{ testId: string; evaluationId: string }>> => {
  // 1. Insert prompt_tests record
  const { data: testRecord, error: insertError } = await supabase
    .from('prompt_tests')
    .insert({
      session_id: sessionId,
      phase: 'evaluation',
      phase_run_number: phaseRunNumber,
      parent_run_id: parentRunId,
      status: 'completed',
      inputs: { evaluation_prompt: evaluationPrompt || 'default' },
      final_prompt: '',
      input_tokens: tokensUsed,
      output_tokens: 0,
      debug_metadata: {
        thinking: null,
        tokens: { input: tokensUsed, output: 0 },
        raw_prompt: evaluationPrompt || 'default',
        raw_response: { overall, details }
      }
    })
    .select()
    .single();

  if (insertError) {
    return err(createError('DATABASE_ERROR', `Failed to save evaluation: ${insertError.message}`));
  }

  // 2. Insert prompt_evaluations record
  const { data: evalRecord, error: evalInsertError } = await supabase
    .from('prompt_evaluations')
    .insert({
      test_id: testRecord.id,
      score_overall: overall,
      details: details,
      evaluator_model: evaluatorModel,
      evaluator_type: 'llm',
      cost_usd: costUsd,
      tokens_used: tokensUsed,
      input_tokens: tokensUsed,
      output_tokens: 0
    })
    .select()
    .single();

  if (evalInsertError) {
    return err(createError('DATABASE_ERROR', `Failed to save evaluation details: ${evalInsertError.message}`));
  }

  return ok({
    testId: testRecord.id,
    evaluationId: evalRecord.id
  });
};

const storeAnalysisResult = async (
  supabase: ReturnType<typeof createAdminClient>,
  sessionId: string,
  phaseRunNumber: number,
  merged: Record<string, unknown>,
  variables: Record<string, unknown> | undefined,
  analysisResult: AnalysisResultData,
  sourceImageUrl?: string,
  model?: string,
  durationMs?: number,
  fixtureImageIds?: string[],
  detectedAngles?: DetectedAngles,
  category?: ProductCategory
): Promise<Result<unknown>> => {
  const { data: testRecord, error: insertError } = await supabase
    .from('prompt_tests')
    .insert({
      session_id: sessionId,
      phase: 'analysis',
      phase_run_number: phaseRunNumber,
      parent_run_id: null, // Analysis has no parent
      status: 'completed',
      inputs: {
        ...merged,
        ...variables,
        fixtureImageIds,
        detectedAngles,
        category
      },
      source_image_url: sourceImageUrl,
      final_prompt: '', // Analysis doesn't generate prompts
       debug_metadata: {
         thinking: null,
         tokens: analysisResult.data.usage || { input: 0, output: 0 },
         model: model || 'unknown',
          cost: (() => {
            const tokens = analysisResult.data.usage || { input: 0, output: 0 };
            const costResult = calculateCost(model || 'gemini-2.0-flash', { input: tokens.input, output: tokens.output });
            return costResult.ok ? costResult.data.total : 0;
          })(),
         duration_ms: durationMs || 0,
         raw_prompt: '',
         raw_response: analysisResult.data.raw,
         detectedAngles,
         category
       }
    })
    .select()
    .single();

  if (insertError) {
    return err(createError('DATABASE_ERROR', `Failed to save analysis: ${insertError.message}`));
  }

  return ok(testRecord);
};

export const runAnalysisPhase = async (
  request: AnalysisRequest
): Promise<Result<AnalysisResult>> => {
  const supabase = createAdminClient();

  logger.info('Starting analysis phase', {
    sessionId: request.sessionId,
    fixtureCount: request.fixtureImageIds.length
  });

  // 1. Fetch fixture images from database
  const fixturesResult = await fetchFixtureImages(supabase, request.fixtureImageIds);
  if (!isOk(fixturesResult)) return fixturesResult;

  const fixtures = fixturesResult.data;
  logger.info('Fetched fixture images', {
    sessionId: request.sessionId,
    count: fixtures.length
  });

  // 2. Download images from R2
  const imagesResult = await downloadImagesFromR2(fixtures);
  if (!isOk(imagesResult)) return imagesResult;

  const fixtureImages = imagesResult.data;

  // 3. Run product analysis
  const model = request.model || 'gemini-3-flash-preview';
  const startTime = Date.now();

  const analysisResult = await analyzeProductImages(fixtureImages, {
    model,
    cacheEnabled: request.cacheEnabled ?? true,
    customPrompt: request.customPrompt,
    customSchema: request.customSchema
  });

  const endTime = Date.now();
  const durationMs = endTime - startTime;

  if (!isOk(analysisResult)) {
    logger.error('Analysis failed', {
      sessionId: request.sessionId,
      error: analysisResult.error.message
    });
    return analysisResult;
  }

  const { merged } = analysisResult.data;

  // 4. Detect angles from source images
  const detectedAnglesResult = await detectSourceAngles(
    fixtureImages.map((img) => ({
      buffer: img.buffer,
      mimeType: img.mimeType,
      hash: '',
      r2Key: '',
      r2Url: ''
    }))
  );

  if (!isOk(detectedAnglesResult)) {
    logger.warn('Angle detection failed, will use fallback in generation', {
      sessionId: request.sessionId,
      error: detectedAnglesResult.error.message
    });
  }

  const detectedAngles: DetectedAngles = isOk(detectedAnglesResult)
    ? detectedAnglesResult.data
    : { sourceAngles: [] };

  // 5. Classify product category
  const categoryResult = await classifyProduct(fixtures[0].r2_url);
  const category: ProductCategory = isOk(categoryResult) ? categoryResult.data : 'generic';

  // 6. Get next phase run number
  const phaseRunNumberResult = await getNextPhaseRunNumber(
    supabase,
    request.sessionId,
    'analysis'
  );
  if (!isOk(phaseRunNumberResult)) return phaseRunNumberResult;

  // 7. Store in database
  const sourceImageUrl = fixtures && fixtures.length > 0 ? fixtures[0].r2_url : undefined;
  const storeResult = await storeAnalysisResult(
    supabase,
    request.sessionId,
    phaseRunNumberResult.data,
    merged,
    request.variables,
    analysisResult,
    sourceImageUrl,
    model,
    durationMs,
    request.fixtureImageIds,
    detectedAngles,
    category
  );
  if (!isOk(storeResult)) return storeResult;

  const testRecord = storeResult.data;

   logger.info('Analysis phase complete', {
     sessionId: request.sessionId,
     runId: testRecord.id,
     phaseRunNumber: phaseRunNumberResult.data,
     category,
     detectedAngles: detectedAngles.sourceAngles.length
   });

    return ok({
      runId: testRecord.id,
      phaseRunNumber: phaseRunNumberResult.data,
      analysis: merged,
      detectedAngles,
      category,
      tokens: analysisResult.data.usage || { input: 0, output: 0 },
      rawPrompt: '',
      rawResponse: analysisResult.data.raw,
      // Include the database record for UI compatibility
      databaseRecord: testRecord
    });
};

// =============================================================================
// Generation Phase
// =============================================================================

export const runGenerationPhase = async (
  request: GenerationRequest
): Promise<Result<GenerationResult>> => {
  const supabase = createAdminClient();

  logger.info('Starting generation phase', {
    sessionId: request.sessionId,
    parentRunId: request.parentRunId,
    templateSlug: request.templateSlug
  });

  // 1. Fetch parent analysis run
  const { data: parentRun, error: parentError } = await supabase
    .from('prompt_tests')
    .select('*')
    .eq('id', request.parentRunId)
    .single();

  if (parentError || !parentRun) {
    return err(createError('VALIDATION_ERROR', 'Parent analysis run not found'));
  }

  if (parentRun.phase !== 'analysis') {
    return err(createError('VALIDATION_ERROR', 'Parent run must be an analysis phase'));
  }

  // 2. Fetch template (latest version)
  const { data: template, error: templateError } = await supabase
    .from('prompt_templates')
    .select('*')
    .eq('slug', request.templateSlug)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (templateError || !template) {
    return err(createError('VALIDATION_ERROR', `Template ${request.templateSlug} not found`));
  }

  // 3. Merge variables: analysis + manual overrides
  const mergedVariables = {
    ...parentRun.inputs,
    ...request.variables
  };

  logger.info('Variables merged', {
    sessionId: request.sessionId,
    analysisVars: Object.keys(parentRun.inputs || {}),
    manualVars: Object.keys(request.variables || {})
  });

  // 4. Compile template (use request.templateData to allow UI edits)
  const templateDataToUse = request.templateData && Object.keys(request.templateData).length > 0
    ? request.templateData
    : template.template_data;

  const compileResult = compileTemplate(
    templateDataToUse as TemplateData,
    template.variables_schema,
    mergedVariables
  );

  if (!isOk(compileResult)) {
    logger.error('Template compilation failed', {
      sessionId: request.sessionId,
      error: compileResult.error.message
    });
    return compileResult;
  }

  const { prompt } = compileResult.data;

  // 5. Generate image
  const gemini = createGeminiProvider();

  // Get source image if parent has one
  let sourceImageBuffer: Buffer | undefined;
  let sourceMimeType: string | undefined;
  if (parentRun.source_image_url) {
    const response = await fetch(parentRun.source_image_url);
    const arrayBuffer = await response.arrayBuffer();
    sourceImageBuffer = Buffer.from(arrayBuffer);
    sourceMimeType = response.headers.get('content-type') || 'image/jpeg'; // Fallback to jpeg
  }

  if (!sourceImageBuffer) {
    return err(createError('VALIDATION_ERROR', 'Source image required for generation phase'));
  }

  const config: ImageConfig = request.config || {
    aspectRatio: '1:1',
    resolution: '1k',
    rawPrompt: true,
    numberOfImages: 1,
  };

  // Get phase run number before generating (needed for unique upload keys)
  const phaseRunNumberResult = await getNextPhaseRunNumber(
    supabase,
    request.sessionId,
    'generation',
    request.parentRunId
  );
  if (!isOk(phaseRunNumberResult)) return phaseRunNumberResult;
  const phaseRunNumber = phaseRunNumberResult.data;

  const numberOfImages = config.numberOfImages || 1;
   const imageUrls: string[] = [];
   const imageKeys: string[] = [];
   const thinkingResults: (string | null)[] = [];
   let totalTokens = { input: 0, output: 0 };
   let totalDurationMs = 0;

   // Generate multiple images
   for (let i = 0; i < numberOfImages; i++) {
     const genStartTime = Date.now();
     const genResult = await gemini.generateFromImage(
       sourceImageBuffer,
       sourceMimeType,
       prompt,
       config
     );
     const genEndTime = Date.now();
     const genDurationMs = genEndTime - genStartTime;
     totalDurationMs += genDurationMs;

     if (!genResult.success) {
       logger.error('Image generation failed', {
         sessionId: request.sessionId,
         imageIndex: i,
         error: genResult.error
       });
       return err(createError('GENERATION_ERROR', genResult.error));
     }

     // Collect thinking
     thinkingResults.push(genResult.thinking || null);

     // Upload image to R2 with run number to avoid overwriting previous generations
     const format = genResult.mimeType.split('/')[1] as 'png' | 'jpeg' | 'webp';
     const uploadResult = await uploadBase64Image(
       genResult.imageData,
       'notebook-user', // Use a test user ID for notebook
       `${request.sessionId}-run${phaseRunNumber}-${i}`,
       format
     );

     imageUrls.push(uploadResult.publicUrl);
     imageKeys.push(uploadResult.fileKey);

     // Accumulate tokens
     if (genResult.usage) {
       totalTokens.input += genResult.usage.promptTokens;
       totalTokens.output += genResult.usage.completionTokens;
     }
   }

  // Phase run number already retrieved before loop

  // 7. Store in database
  const { data: testRecord, error: insertError } = await supabase
    .from('prompt_tests')
    .insert({
      session_id: request.sessionId,
      phase: 'generation',
      phase_run_number: phaseRunNumber,
      parent_run_id: request.parentRunId,
      template_id: template.id,
      status: 'completed',
      inputs: mergedVariables,
      final_prompt: prompt,
      image_url: JSON.stringify(imageUrls),
      image_key: JSON.stringify(imageKeys),
         debug_metadata: {
           thinking: thinkingResults.length > 0 ? thinkingResults : null,
           tokens: totalTokens,
           model: request.model || 'gemini-3-pro-image-preview',
           cost: (() => {
             const costResult = calculateCost(request.model || 'gemini-3-pro-image-preview', totalTokens);
             return costResult.ok ? costResult.data.total : 0;
           })(),
           duration_ms: totalDurationMs,
           image_urls: imageUrls,
           raw_prompt: prompt,
         }
    })
    .select()
    .single();

  if (insertError) {
    return err(createError('DATABASE_ERROR', `Failed to save generation: ${insertError.message}`));
  }



  logger.info('Generation phase complete', {
    sessionId: request.sessionId,
    runId: testRecord.id,
    phaseRunNumber,
    imageCount: imageUrls.length
  });

  return ok({
    runId: testRecord.id,
    parentRunId: request.parentRunId,
    phaseRunNumber,
    imageUrls,
    finalPrompt: prompt,
    thinking: thinkingResults[0] || null,
    tokens: totalTokens
  });
};

// =============================================================================
// Evaluation Phase
// =============================================================================

export const runEvaluationPhase = async (
  request: EvaluationRequest
): Promise<Result<EvaluationPhaseResult>> => {
  const supabase = createAdminClient();

  logger.info('Starting evaluation phase', {
    sessionId: request.sessionId,
    parentRunId: request.parentRunId
  });

  // 1. Fetch parent generation run
  const { data: parentRun, error: parentError } = await supabase
    .from('prompt_tests')
    .select('*')
    .eq('id', request.parentRunId)
    .single();

  if (parentError || !parentRun) {
    return err(createError('VALIDATION_ERROR', 'Parent generation run not found'));
  }

  if (parentRun.phase !== 'generation') {
    return err(createError('VALIDATION_ERROR', 'Parent run must be a generation phase'));
  }

  if (!parentRun.image_key) {
    return err(createError('VALIDATION_ERROR', 'Parent run must have an image_key'));
  }

  // 2. Parse image key (notebooks store as JSON array, regular tests as string)
  let imageKey: string;
  try {
    const parsed = JSON.parse(parentRun.image_key);
    if (Array.isArray(parsed)) {
      imageKey = parsed[0]; // Use first image for evaluation
    } else {
      imageKey = parsed;
    }
  } catch {
    // Not JSON, treat as direct key string
    imageKey = parentRun.image_key;
  }

  // 3. Call evaluator
  const model = request.model || 'claude-sonnet-4-20250514';
  const evaluationResult = await evaluateImage(
    { type: 'key', value: imageKey },
    parentRun.final_prompt,
    { model }
  );

  if (!isOk(evaluationResult)) {
    logger.error('Evaluation failed', {
      sessionId: request.sessionId,
      error: evaluationResult.error.message
    });
    return evaluationResult;
  }

  const { overall, details, tokensUsed, costUsd, model: evaluatorModel } = evaluationResult.data;

  // 3. Get next phase run number
  const phaseRunNumberResult = await getNextPhaseRunNumber(
    supabase,
    request.sessionId,
    'evaluation',
    request.parentRunId
  );
  if (!isOk(phaseRunNumberResult)) return phaseRunNumberResult;
  const phaseRunNumber = phaseRunNumberResult.data;

  // 4. Store evaluation results
  const storeResult = await storeEvaluationResult(
    supabase,
    request.sessionId,
    phaseRunNumber,
    request.parentRunId,
    request.evaluationPrompt,
    overall,
    details,
    tokensUsed,
    costUsd,
    evaluatorModel
  );

  if (!isOk(storeResult)) return storeResult;

  const { testId, evaluationId } = storeResult.data;

  // Return success
  logger.info('Evaluation phase complete', {
    sessionId: request.sessionId,
    runId: testId,
    phaseRunNumber,
    scoreOverall: overall
  });

  return ok({
    runId: testId,
    phaseRunNumber,
    evaluationId,
    scoreOverall: overall,
    details,
    tokens: { input: tokensUsed, output: 0 }
  });
};

// =============================================================================
// Conversation Generation Phase
// =============================================================================

export const runConversationGenerationPhase = async (
  request: ConversationGenerationRequest
): Promise<Result<ConversationGenerationResult>> => {
  const supabase = createAdminClient();

  logger.info('Starting conversation generation phase', {
    sessionId: request.sessionId,
    parentRunId: request.parentRunId,
    templateSlug: request.templateSlug,
    outputCount: request.outputCount
  });

  // 1. Fetch parent analysis run
  const { data: parentRun, error: parentError } = await supabase
    .from('prompt_tests')
    .select('*')
    .eq('id', request.parentRunId)
    .single();

  if (parentError || !parentRun) {
    return err(createError('VALIDATION_ERROR', 'Parent analysis run not found'));
  }

  if (parentRun.phase !== 'analysis') {
    return err(createError('VALIDATION_ERROR', 'Parent run must be an analysis phase'));
  }

  // Extract fixture image IDs from analysis run data
  // Note: This assumes fixtureImageIds are stored in parentRun.inputs.fixtureImageIds
  const fixtureImageIds = (parentRun.inputs as any)?.fixtureImageIds;
  if (!fixtureImageIds || !Array.isArray(fixtureImageIds) || fixtureImageIds.length === 0) {
    return err(createError('VALIDATION_ERROR', 'No fixture image IDs found in parent analysis run'));
  }

  // 2. Fetch template from database (latest version)
  const { data: template, error: templateError } = await supabase
    .from('prompt_templates')
    .select('*')
    .eq('slug', request.templateSlug)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (templateError || !template) {
    return err(createError('VALIDATION_ERROR', `Template ${request.templateSlug} not found`));
  }

  // Use request.templateData if provided, else template.template_data
  const templateDataToUse = request.templateData && Object.keys(request.templateData).length > 0
    ? request.templateData
    : template.template_data;

  // 3. Resolve fixture images
  const fixturesResult = await fetchFixtureImages(supabase, fixtureImageIds);
  if (!isOk(fixturesResult)) return fixturesResult;

  const fixtures = fixturesResult.data;

  // Download images from R2
  const imagesResult = await downloadImagesFromR2(fixtures);
  if (!isOk(imagesResult)) return imagesResult;

  const fixtureImages = imagesResult.data;

  // 4. Extract angles and category from parent analysis run
  const detectedAngles: DetectedAngles = (parentRun.inputs as any)?.detectedAngles || { sourceAngles: [] };
  const category: ProductCategory = (parentRun.inputs as any)?.category || 'generic';

  logger.info('Using analysis results from parent run', {
    sessionId: request.sessionId,
    category,
    detectedAnglesCount: detectedAngles.sourceAngles.length
  });

  // 5. Angle planning
  const anglePlan = planCollection(detectedAngles, category, request.outputCount);

  // 6. Create conversation session
  const session = createConversationSession();

  // 7. Initialize session with reference images
  // Filter out label/tag close-ups - they confuse the generation phase
  const productName = (parentRun.inputs as any)?.product || (parentRun.inputs as any)?.productName || 'Product';
  const allLabeledImages = fixtureImages.map((img, idx) => ({
    buffer: img.buffer,
    mimeType: img.mimeType,
    label: detectedAngles.sourceAngles[idx]?.detectedAngle || `Reference ${idx + 1}`
  }));

  // Filter out images with labels/tags in the angle description
  const labeledImages = allLabeledImages.filter((img) => {
    const angleLower = img.label.toLowerCase();
    return !angleLower.includes('label') && !angleLower.includes('tag') && !angleLower.includes('care instruction');
  });

  logger.info('Filtered reference images for generation', {
    sessionId: request.sessionId,
    totalImages: allLabeledImages.length,
    filteredImages: labeledImages.length,
    removedCount: allLabeledImages.length - labeledImages.length
  });

  await session.initialize(
    labeledImages,
    `Product: ${productName}
Category: ${category}
You have ${labeledImages.length} reference images of this product from different angles.
You will be asked to generate ${request.outputCount} professional e-commerce photos, one at a time.
Each photo must be visually unique from previous outputs.`
  );

  // 8. Build scale instruction from analysis
  const analysisInputs = parentRun.inputs as any;
  let scaleInstruction = 'SCALE REQUIREMENT: Maintain consistent realistic product dimensions across all generated images.';

  // Check for scale references in individual image analyses (if available)
  if (analysisInputs.hasScaleReference && analysisInputs.scaleDescription) {
    scaleInstruction = `SCALE REQUIREMENT: Source shows scale reference (${analysisInputs.scaleDescription}). Maintain exact same physical product dimensions in all generated images.`;
  }

  // 9. Build brand/accuracy instruction from analysis
  let brandInstruction = '';
  if (category === 'apparel') {
    // For apparel: emphasize garment accuracy without mentioning interior labels
    brandInstruction = `CRITICAL: The garment structure, cut, neckline, sleeves, and all design details must match the reference images exactly. Reproduce the exact silhouette and fit shown.`;
  } else if (analysisInputs.brand) {
    // For non-apparel: enforce branding as before
    const details = analysisInputs.brandingDetails ? ` ${analysisInputs.brandingDetails}` : '';
    brandInstruction = `CRITICAL: The product MUST display "${analysisInputs.brand}" branding exactly as shown in the reference images.${details} This text must be clearly legible and accurately reproduced.`;
  }

  // 9b. Build features instruction from analysis
  let featuresInstruction = '';
  const detailParts: string[] = [];

  // Add color if available
  if (analysisInputs.color) {
    detailParts.push(`Color: ${analysisInputs.color}`);
  }

  // Add material if available
  if (analysisInputs.material) {
    detailParts.push(`Material: ${analysisInputs.material}`);
  }

  // Add shape if available
  if (analysisInputs.shape) {
    detailParts.push(`Shape/Cut: ${analysisInputs.shape}`);
  }

  // Add top features
  if (analysisInputs.features && Array.isArray(analysisInputs.features) && analysisInputs.features.length > 0) {
    const keyFeatures = analysisInputs.features.slice(0, 5).join(', ');
    detailParts.push(`Key features: ${keyFeatures}`);
  }

  if (detailParts.length > 0) {
    featuresInstruction = `IMPORTANT DETAILS: ${detailParts.join('; ')}.`;
  }

  // 10. Get phase run number BEFORE uploading (needed for unique upload keys)
  const phaseRunNumberResult = await getNextPhaseRunNumber(
    supabase,
    request.sessionId,
    'generation',
    request.parentRunId
  );
  if (!isOk(phaseRunNumberResult)) return phaseRunNumberResult;
  const phaseRunNumber = phaseRunNumberResult.data;

  // 11. Generate each angle in loop
  const imageUrls: string[] = [];
  const imageKeys: string[] = [];
  const angleSpecificPrompts: string[] = [];
  const thinkingResults: (string | null)[] = [];
  let totalTokens = { input: 0, output: 0 };
  let totalCost = 0;
  let totalDurationMs = 0;

  for (let i = 0; i < anglePlan.assignments.length; i++) {
    const assignment = anglePlan.assignments[i];

    // Merge variables
    const mergedVariables = {
      ...parentRun.inputs,
      ...request.variables,
      angle: assignment.targetAngle,
      outputIndex: i,
      totalOutputs: request.outputCount
    };

    // Compile template
    const compileResult = compileTemplate(
      templateDataToUse as TemplateData,
      template.variables_schema,
      mergedVariables
    );

    if (!isOk(compileResult)) {
      logger.error('Template compilation failed', {
        sessionId: request.sessionId,
        error: compileResult.error.message
      });
      return compileResult;
    }

    const { prompt } = compileResult.data;

    // Build angle-specific prompt with scale, brand, and feature instructions
    // Include run number to ensure unique prompts across multiple generation runs
    const angleSpecificPrompt = `Generate image ${i + 1}/${request.outputCount} (Run ${phaseRunNumber}): ${assignment.targetAngle} view.
${scaleInstruction}
${brandInstruction}
${featuresInstruction}
This must be distinctly different from any previous images.
${prompt}`;

    // Generate image
    const config: ImageConfig = request.config || {
      aspectRatio: '1:1',
      resolution: '1k',
      rawPrompt: true,
      numberOfImages: 1,
    };

    const genStartTime = Date.now();
    const genResult = await session.generateNext(angleSpecificPrompt, {
      aspectRatio: config.aspectRatio,
      resolution: config.resolution
    });
    
    const genDurationMs = Date.now() - genStartTime;

    if (!genResult.success) {
      logger.error('Image generation failed', {
        sessionId: request.sessionId,
        imageIndex: i,
        error: genResult.error
      });
      return err(createError('GENERATION_ERROR', genResult.error));
    }

    // Upload to R2 with run number to avoid overwriting previous generations
    const format = genResult.mimeType.split('/')[1] as 'png' | 'jpeg' | 'webp';
    const uploadResult = await uploadBase64Image(
      genResult.imageData,
      'notebook-user',
      `${request.sessionId}-run${phaseRunNumber}-${i}`,
      format
    );

    // Collect raw response and thinking
    thinkingResults.push(genResult.thinking || null);

    // Calculate cost
    const costResult = calculateCost(request.model || 'gemini-3-pro-image-preview', {
      input: genResult.usage?.promptTokens || 0,
      output: genResult.usage?.completionTokens || 0
    });
    const cost = costResult.ok ? costResult.data.total : 0;

    // ACCUMULATE instead of INSERT
    imageUrls.push(uploadResult.publicUrl);
    imageKeys.push(uploadResult.fileKey);
    angleSpecificPrompts.push(angleSpecificPrompt);

    // Accumulate tokens/cost
    if (genResult.usage) {
      totalTokens.input += genResult.usage.promptTokens;
      totalTokens.output += genResult.usage.completionTokens;
    }
    if (costResult.ok) {
      totalCost += costResult.data.total;
    } else {
      logger.warn('Cost calculation failed for generation', {
        sessionId: request.sessionId,
        imageIndex: i,
        model: request.model || 'gemini-3-pro-image-preview'
      });
    }
    totalDurationMs += genDurationMs;
  }

  // 12. Store results (phaseRunNumber already retrieved before loop)

  // Prepare merged variables (common across all iterations)
  // Note: Per-iteration variables (angle, outputIndex, totalOutputs) are not stored here
  // Angle data is preserved in debug_metadata.angle_plan and debug_metadata.angle_prompts
  const mergedVariables = {
    ...parentRun.inputs,
    ...request.variables,
    outputCount: request.outputCount,
    angles: anglePlan.assignments.map(a => a.targetAngle)
  };

  // Insert ONE record with ALL images
  const { data: testRecord, error: insertError } = await supabase
    .from('prompt_tests')
    .insert({
      session_id: request.sessionId,
      phase: 'generation',
      phase_run_number: phaseRunNumber,
      parent_run_id: request.parentRunId,
      template_id: template.id,
      status: 'completed',
      inputs: mergedVariables,
      final_prompt: angleSpecificPrompts[0],
      image_url: JSON.stringify(imageUrls),    // JSON array
      image_key: JSON.stringify(imageKeys),    // JSON array
      debug_metadata: {
        thinking: thinkingResults.length > 0 ? thinkingResults : null,
        tokens: totalTokens,
        model: request.model || 'gemini-3-pro-image-preview',
        cost: totalCost,
        duration_ms: totalDurationMs,
        image_urls: imageUrls,
        angle_prompts: angleSpecificPrompts,
        angle_plan: anglePlan,
        raw_prompt: angleSpecificPrompts[0],
      }
    })
    .select()
    .single();

  if (insertError) {
    return err(createError('DATABASE_ERROR', `Failed to save generation: ${insertError.message}`));
  }

  logger.info('Conversation generation phase complete', {
    sessionId: request.sessionId,
    runId: request.parentRunId,
    imageCount: imageUrls.length,
    totalTokens,
    totalCost
  });

  return ok({
    generationRuns: [{
      runId: testRecord.id,
      phaseRunNumber,
      imageUrl: imageUrls[0],
      imageUrls: imageUrls,
      finalPrompt: angleSpecificPrompts[0],
      tokens: totalTokens
    }],
    totalTokens,
    totalCost
  });
};