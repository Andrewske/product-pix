# Notebook Orchestrator - Generation Phase

## Files to Modify
- `prompt-bench/core/notebook-orchestrator.ts` (modify)

## Implementation Details

Add generation phase implementation to the existing notebook orchestrator module.

### Steps

**1. Add runGenerationPhase function**

After `runAnalysisPhase` in `prompt-bench/core/notebook-orchestrator.ts`, add:

```typescript
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
```

**2. Export from barrel** (Optional)

Check if `prompt-bench/core/index.ts` exists. If it does, add export:

```typescript
export * from './notebook-orchestrator';
```

If it doesn't exist, skip this step (direct imports will work).

**3. Commit**

```bash
git add prompt-bench/core/notebook-orchestrator.ts
git commit -m "feat: implement notebook generation phase orchestrator

- Create runGenerationPhase wrapper function
- Fetch parent analysis run and merge variables
- Compile template with analysis + manual variables
- Generate image using Gemini
- Store results with parent_run_id linkage
- Return generation metadata for UI"
```

## Acceptance Criteria

- [ ] runGenerationPhase function added to notebook-orchestrator.ts
- [ ] Function fetches parent analysis run
- [ ] Validates parent is an analysis phase
- [ ] Fetches template from database
- [ ] Merges analysis variables with manual overrides
- [ ] Compiles template using existing compileTemplate
- [ ] Calls generateFromImage for actual generation
- [ ] Stores result with parent_run_id linking to analysis
- [ ] Returns Result<GenerationResult> with image URL and thinking
- [ ] Changes committed to git

## Dependencies

- Task 03 (analysis phase orchestrator) must be completed
