# Decompose Collection Generation Function

## Files to Modify/Create
- prompt-bench/core/orchestrator.ts (modify)
- prompt-bench/core/collection-generation.ts (new, optional)

## Implementation Details

The `coordinateCollectionGeneration` function is 371 lines long (lines 677-1047) with deeply nested logic (4-5 levels). It handles multiple concerns:
1. Source image resolution
2. Product analysis
3. Angle detection
4. Collection planning
5. Conversation session management
6. Image generation loop

Cyclomatic complexity exceeds 30, making the function difficult to test and maintain.

**Current monolithic structure:**
```typescript
export const coordinateCollectionGeneration = async (...) => {
  // 50 lines: variable initialization
  // 80 lines: source image resolution loop
  // 90 lines: product analysis with scale/brand instructions
  // 40 lines: angle detection and fallback
  // 50 lines: collection planning
  // 61 lines: generation loop with session management
  return ok({ completed, failed, skipped, tests });
};
```

**Required changes:**

### Step 1: Extract source image resolution

```typescript
interface ResolvedImages {
  images: ResolvedSourceImage[];
  needsAnalysis: boolean;
}

async function resolveCollectionSourceImages(
  testCase: TestCase,
  batchFilePath: string,
  analysisEnabled: boolean | undefined
): Promise<Result<ResolvedImages>> {
  const sourceImages = testCase.sourceImages ||
    (testCase.sourceImage ? [testCase.sourceImage] : []);
  const needsAnalysis = analysisEnabled && sourceImages.length > 0;

  if (sourceImages.length === 0) {
    return ok({ images: [], needsAnalysis: false });
  }

  const resolvedImages: ResolvedSourceImage[] = [];
  for (const sourceImagePath of sourceImages) {
    const resolveResult = await resolveSourceImage(sourceImagePath, {
      batchFilePath,
      skipUpload: false,
    });
    if (!isOk(resolveResult)) {
      return err(createError(
        'SOURCE_IMAGE_ERROR',
        `Failed to resolve source image: ${resolveResult.error.message}`
      ));
    }
    resolvedImages.push(resolveResult.data);
  }

  return ok({ images: resolvedImages, needsAnalysis });
}
```

### Step 2: Extract product analysis phase

```typescript
interface AnalysisPhaseResult {
  variables: Record<string, unknown>;
  scaleInstruction: string;
  brandInstruction: string;
}

async function runCollectionAnalysisPhase(
  images: ResolvedSourceImage[],
  testCase: TestCase,
  options: { model?: string; cacheEnabled?: boolean }
): Promise<Result<AnalysisPhaseResult>> {
  const analysisResult = await analyzeProductImages(
    images.map(img => ({ buffer: img.buffer, mimeType: img.mimeType })),
    options
  );

  if (!isOk(analysisResult)) {
    return err(createError(
      'ANALYSIS_ERROR',
      `Analysis failed: ${analysisResult.error.message}`
    ));
  }

  // Merge analysis into variables
  const variables = {
    ...analysisResult.data.merged,
    ...testCase.variables
  };

  // Build scale instruction
  let scaleInstruction = 'SCALE REQUIREMENT: Maintain consistent realistic product dimensions.';
  const imagesWithScale = analysisResult.data.individual
    .map((analysis, idx) => ({
      index: idx,
      hasScale: analysis.hasScaleReference,
      description: analysis.scaleDescription
    }))
    .filter(x => x.hasScale);

  if (imagesWithScale.length > 0) {
    const scaleImage = imagesWithScale[0];
    scaleInstruction = `SCALE REQUIREMENT: Image ${scaleImage.index + 1} shows scale reference${scaleImage.description ? ` (${scaleImage.description})` : ''}. Maintain exact same physical product dimensions.`;
  }

  // Build brand instruction
  let brandInstruction = '';
  if (analysisResult.data.merged.brand) {
    const details = analysisResult.data.merged.brandingDetails
      ? ` ${analysisResult.data.merged.brandingDetails}`
      : '';
    brandInstruction = `CRITICAL: The product MUST display "${analysisResult.data.merged.brand}" branding exactly as shown.${details}`;
  }

  return ok({ variables, scaleInstruction, brandInstruction });
}
```

### Step 3: Extract collection planning

```typescript
interface CollectionPlan {
  category: ProductCategory;
  targetAngles: string[];
  detectedAngles: { sourceAngles: Array<{ imageIndex: number; detectedAngle: string; isPrimaryReference?: boolean }> };
  labeledImages: Array<{ buffer: Buffer; mimeType: string; label: string }>;
}

async function planCollectionImages(
  images: ResolvedSourceImage[],
  outputCount: number,
  cacheEnabled?: boolean
): Promise<Result<CollectionPlan>> {
  // Detect category
  let category: ProductCategory = 'generic';
  if (images.length > 0) {
    const categoryResult = await classifyProduct(images[0].r2Url);
    if (isOk(categoryResult)) {
      category = categoryResult.data;
    }
  }

  // Detect angles
  let detectedAngles;
  if (images.length > 0) {
    const detected = await detectSourceAngles(images, { cacheEnabled });
    if (!isOk(detected)) {
      detectedAngles = {
        sourceAngles: images.map((_, index) => ({
          imageIndex: index,
          detectedAngle: 'unknown',
          isPrimaryReference: index === 0
        }))
      };
    } else {
      detectedAngles = detected.data;
    }
  } else {
    detectedAngles = { sourceAngles: [] };
  }

  // Get target angles
  const targetAngles = getAnglesForCategory(category).slice(0, outputCount);

  // Label images for session
  const labeledImages = images.map((img, i) => ({
    buffer: img.buffer,
    mimeType: img.mimeType,
    label: detectedAngles.sourceAngles[i]?.detectedAngle || `reference ${i + 1}`
  }));

  return ok({ category, targetAngles, detectedAngles, labeledImages });
}
```

### Step 4: Refactor main coordinator

```typescript
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
  const { supabase } = dependencies;
  let completed = 0, failed = 0, skipped = 0;
  const tests: PromptTest[] = [];

  for (let i = 0; i < batch.tests.length; i++) {
    const testCase = batch.tests[i];
    onProgress?.('run', i, batch.tests.length, `Processing collection ${i + 1}/${batch.tests.length}...`);

    // Step 1: Resolve source images
    const imagesResult = await resolveCollectionSourceImages(testCase, batchFilePath, analysisEnabled);
    if (!isOk(imagesResult)) return imagesResult;
    const { images, needsAnalysis } = imagesResult.data;

    // Step 2: Run analysis if needed
    let analysisContext = { variables: testCase.variables || {}, scaleInstruction: '', brandInstruction: '' };
    if (needsAnalysis && images.length > 0) {
      const analysisResult = await runCollectionAnalysisPhase(images, testCase, {
        model: analysisModel,
        cacheEnabled: analysisCacheEnabled
      });
      if (!isOk(analysisResult)) return analysisResult;
      analysisContext = analysisResult.data;
      testCase.variables = analysisContext.variables;
    }

    // Step 3: Plan collection
    const planResult = await planCollectionImages(images, template.outputCount, analysisCacheEnabled);
    if (!isOk(planResult)) return planResult;
    const plan = planResult.data;

    // Step 4: Generate images via session
    const genResult = await generateCollectionWithSession(
      template, testCase, plan, analysisContext, batchLabel, dryRun, dependencies
    );
    if (!isOk(genResult)) return genResult;

    completed += genResult.data.completed;
    failed += genResult.data.failed;
    skipped += genResult.data.skipped;
    tests.push(...genResult.data.tests);
  }

  return ok({ completed, failed, skipped, tests });
};
```

### Step 5: Extract generation loop (optional, if time permits)

```typescript
async function generateCollectionWithSession(
  template: CollectionTemplate,
  testCase: TestCase,
  plan: CollectionPlan,
  analysisContext: AnalysisPhaseResult,
  batchLabel: string,
  dryRun: boolean,
  deps: GenerationDependencies
): Promise<Result<{ completed: number; failed: number; skipped: number; tests: PromptTest[] }>>;
```

## Acceptance Criteria
- [ ] Main coordinator function reduced to ~60-80 lines
- [ ] Each extracted function has single responsibility
- [ ] All extracted functions have clear input/output types
- [ ] No TypeScript errors: `bunx tsc --noEmit`
- [ ] Tests pass: `bun test prompt-bench`
- [ ] Collection generation works end-to-end: `bun bench test --template multi-angle-collection --batch prompt-bench/fixtures/multi-image-batch.json`

## Dependencies
Complete tasks 01-05 first. This is the most complex refactor and benefits from earlier cleanup.

## Risk Level
High - complex function with many interdependencies.

## Savings
~120 lines through better organization, significant complexity reduction (-20 cyclomatic complexity points).

## Notes
- Consider breaking into multiple PRs (one per extracted function)
- Add unit tests for each extracted function before refactoring
- Use TDD approach: write test, extract function, verify test passes
- May want to create separate file `collection-generation.ts` if coordinator becomes import-heavy
