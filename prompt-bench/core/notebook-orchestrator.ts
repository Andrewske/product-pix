import { Result, ok, err, createError, isOk } from '@bench/core/errors';
import { analyzeProductImages } from '@bench/core/product-analyzer';
import { compileTemplate } from '@bench/core/compiler';
import { createGeminiProvider } from '@/lib/ai/providers/gemini';
import { generateFromImage } from '@/lib/ai/generate-image';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@bench/core/logger';

// =============================================================================
// Types
// =============================================================================

export interface AnalysisRequest {
  sessionId: string;
  fixtureImageIds: string[];
  variables?: Record<string, unknown>;
  model?: string;
  cacheEnabled?: boolean;
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
}

export interface GenerationResult {
  runId: string;
  phaseRunNumber: number;
  imageUrl: string;
  finalPrompt: string;
  thinking: string | null;
  tokens: { input: number; output: number };
}

// =============================================================================
// Analysis Phase
// =============================================================================

const fetchFixtureImages = async (
  supabase: ReturnType<typeof createAdminClient>,
  fixtureImageIds: string[]
): Promise<Result<any[]>> => {
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

const downloadImagesFromR2 = async (fixtures: any[]): Promise<Result<any[]>> => {
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

const getNextPhaseRunNumber = async (
  supabase: ReturnType<typeof createAdminClient>,
  sessionId: string
): Promise<Result<number>> => {
  const { data: existingRuns } = await supabase
    .from('prompt_tests')
    .select('phase_run_number')
    .eq('session_id', sessionId)
    .eq('phase', 'analysis')
    .order('phase_run_number', { ascending: false })
    .limit(1);

  const phaseRunNumber = (existingRuns?.[0]?.phase_run_number || 0) + 1;
  return ok(phaseRunNumber);
};

const storeAnalysisResult = async (
  supabase: ReturnType<typeof createAdminClient>,
  sessionId: string,
  phaseRunNumber: number,
  merged: Record<string, unknown>,
  variables: Record<string, unknown> | undefined,
  analysisResult: any
): Promise<Result<any>> => {
  const { data: testRecord, error: insertError } = await supabase
    .from('prompt_tests')
    .insert({
      session_id: sessionId,
      phase: 'analysis',
      phase_run_number: phaseRunNumber,
      parent_run_id: null, // Analysis has no parent
      status: 'completed',
      inputs: { ...merged, ...variables },
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
    cacheEnabled: request.cacheEnabled ?? true
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
  const phaseRunNumberResult = await getNextPhaseRunNumber(supabase, request.sessionId);
  if (!isOk(phaseRunNumberResult)) return phaseRunNumberResult;

  // 5. Store in database
  const storeResult = await storeAnalysisResult(
    supabase,
    request.sessionId,
    phaseRunNumberResult.data,
    merged,
    request.variables,
    analysisResult
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

  const genResult = await generateFromImage(
    gemini,
    prompt,
    sourceImageBuffer
  );

  if (!isOk(genResult)) {
    logger.error('Image generation failed', {
      sessionId: request.sessionId,
      error: genResult.error.message
    });
    return genResult;
  }

  const { imageUrl, imageKey, thinking, usage, raw } = genResult.data;

  // 6. Get next phase run number
  const { data: existingRuns } = await supabase
    .from('prompt_tests')
    .select('phase_run_number')
    .eq('session_id', request.sessionId)
    .eq('phase', 'generation')
    .eq('parent_run_id', request.parentRunId)
    .order('phase_run_number', { ascending: false })
    .limit(1);

  const phaseRunNumber = (existingRuns?.[0]?.phase_run_number || 0) + 1;

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
        thinking,
        tokens: usage || { input: 0, output: 0 },
        raw_prompt: prompt,
        raw_response: raw
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
    thinking: thinking || null,
    tokens: usage || { input: 0, output: 0 }
  });
};