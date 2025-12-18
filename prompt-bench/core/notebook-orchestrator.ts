import { Result, ok, err, createError, isOk } from '@bench/core/errors';
import { analyzeProductImages } from '@bench/core/product-analyzer';
import { compileTemplate } from '@bench/core/compiler';
import { createGeminiProvider } from '@/lib/ai/providers/gemini';
import type { ImageConfig } from '@/lib/ai/types';
import { uploadBase64Image } from '@/lib/r2';

import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@bench/core/logger';
import { evaluateImage } from '@bench/core/evaluator';
import type { EvaluationDetails } from '@bench/core/types';

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
}

export interface AnalysisResult {
  runId: string;
  phaseRunNumber: number;
  analysis: Record<string, unknown>;
  tokens: { input: number; output: number };
  rawPrompt: string;
  rawResponse: unknown;
}

export interface GenerationRequest {
  sessionId: string;
  parentRunId: string;
  templateSlug: string;
  templateData: Record<string, unknown>;
  variables?: Record<string, unknown>;
  config?: ImageConfig;
}

export interface GenerationResult {
  runId: string;
  phaseRunNumber: number;
  imageUrl: string;
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
 */
const getNextPhaseRunNumber = async (
  supabase: ReturnType<typeof createAdminClient>,
  sessionId: string,
  phase: 'analysis' | 'generation' | 'evaluation',
  parentRunId?: string
): Promise<Result<number>> => {
  let query = supabase
    .from('prompt_tests')
    .select('phase_run_number')
    .eq('session_id', sessionId)
    .eq('phase', phase);

  // Add parent filter for child phases
  if (parentRunId) {
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
  sourceImageUrl?: string
): Promise<Result<unknown>> => {
  const { data: testRecord, error: insertError } = await supabase
    .from('prompt_tests')
    .insert({
      session_id: sessionId,
      phase: 'analysis',
      phase_run_number: phaseRunNumber,
      parent_run_id: null, // Analysis has no parent
      status: 'completed',
      inputs: { ...merged, ...variables },
      source_image_url: sourceImageUrl,
      final_prompt: '', // Analysis doesn't generate prompts
      debug_metadata: {
        thinking: null,
        tokens: analysisResult.data.usage || { input: 0, output: 0 },
        raw_prompt: '',
        raw_response: analysisResult.data.raw
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

  // 3. Run product analysis
  const analysisResult = await analyzeProductImages(imagesResult.data, {
    model: request.model || 'gemini-2.0-flash',
    cacheEnabled: request.cacheEnabled ?? true,
    customPrompt: request.customPrompt
  });

  if (!isOk(analysisResult)) {
    logger.error('Analysis failed', {
      sessionId: request.sessionId,
      error: analysisResult.error.message
    });
    return analysisResult;
  }

  const { merged } = analysisResult.data;

  // 4. Get next phase run number
  const phaseRunNumberResult = await getNextPhaseRunNumber(
    supabase,
    request.sessionId,
    'analysis'
  );
  if (!isOk(phaseRunNumberResult)) return phaseRunNumberResult;

  // 5. Store in database
  const sourceImageUrl = fixtures && fixtures.length > 0 ? fixtures[0].r2_url : undefined;
  const storeResult = await storeAnalysisResult(
    supabase,
    request.sessionId,
    phaseRunNumberResult.data,
    merged,
    request.variables,
    analysisResult,
    sourceImageUrl
  );
  if (!isOk(storeResult)) return storeResult;

  const testRecord = storeResult.data;

  logger.info('Analysis phase complete', {
    sessionId: request.sessionId,
    runId: testRecord.id,
    phaseRunNumber: phaseRunNumberResult.data
  });

   return ok({
     runId: testRecord.id,
     phaseRunNumber: phaseRunNumberResult.data,
     analysis: merged,
     tokens: analysisResult.data.usage || { input: 0, output: 0 },
     rawPrompt: '',
     rawResponse: analysisResult.data.raw
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

  // 2. Fetch template
  const { data: template, error: templateError } = await supabase
    .from('prompt_templates')
    .select('*')
    .eq('slug', request.templateSlug)
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

  // 4. Compile template
  const compileResult = compileTemplate(
    request.templateData,
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
  if (parentRun.source_image_url) {
    const response = await fetch(parentRun.source_image_url);
    const arrayBuffer = await response.arrayBuffer();
    sourceImageBuffer = Buffer.from(arrayBuffer);
  }

  if (!sourceImageBuffer) {
    return err(createError('VALIDATION_ERROR', 'Source image required for generation phase'));
  }

  const config: ImageConfig = request.config || {
    aspectRatio: '1:1',
    resolution: '2k',
    rawPrompt: true,
  };

  const genResult = await gemini.generateFromImage(
    sourceImageBuffer,
    'image/jpeg',
    prompt,
    config
  );

  if (!genResult.success) {
    logger.error('Image generation failed', {
      sessionId: request.sessionId,
      error: genResult.error
    });
    return err(createError('GENERATION_ERROR', genResult.error));
  }

  // Upload image to R2
  const format = genResult.mimeType.split('/')[1] as 'png' | 'jpeg' | 'webp';
  const uploadResult = await uploadBase64Image(
    genResult.imageData,
    'notebook-user', // Use a test user ID for notebook
    request.sessionId,
    format
  );

  const imageUrl = uploadResult.publicUrl;
  const imageKey = uploadResult.fileKey;

  // 6. Get next phase run number
  const phaseRunNumberResult = await getNextPhaseRunNumber(
    supabase,
    request.sessionId,
    'generation',
    request.parentRunId
  );
  if (!isOk(phaseRunNumberResult)) return phaseRunNumberResult;
  const phaseRunNumber = phaseRunNumberResult.data;

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
      image_url: imageUrl,
      image_key: imageKey,
       debug_metadata: {
         thinking: null,
         tokens: genResult.usage ? {
           input: genResult.usage.promptTokens,
           output: genResult.usage.completionTokens
         } : { input: 0, output: 0 },
         raw_prompt: prompt,
         raw_response: genResult
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
    imageUrl
  });

  return ok({
    runId: testRecord.id,
    phaseRunNumber,
    imageUrl,
    finalPrompt: prompt,
    thinking: null, // Gemini doesn't provide thinking for image generation
    tokens: genResult.usage ? {
      input: genResult.usage.promptTokens,
      output: genResult.usage.completionTokens
    } : { input: 0, output: 0 }
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

  // 2. Call evaluator
  const model = request.model || 'claude-sonnet-4-20250514';
  const evaluationResult = await evaluateImage(
    { type: 'key', value: parentRun.image_key },
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