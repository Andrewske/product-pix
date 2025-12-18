# Backend API Endpoints for Notebook

## Files to Modify/Create
- `prompt-bench/ui/server.ts` (modify - add API endpoints)
- `prompt-bench/core/notebook-orchestrator.ts` (new - wrapper functions)
- `prompt-bench/commands/sync.ts` (modify - add fixture image upload)

## Implementation Details

### Part 1: Extend Fixture Sync (`prompt-bench/commands/sync.ts`)

Add fixture image upload to existing `bun bench sync` command.

**New function**:
```typescript
import { readdir } from 'node:fs/promises';
import { join, relative, basename, dirname } from 'node:path';
import { createAdminClient } from '@/lib/supabase/admin';
import { uploadBuffer, getPublicUrl } from '@/lib/r2';
import { createHash } from 'node:crypto';

const syncFixtureImages = async (): Promise<Result<{ synced: number }>> => {
  const fixturesDir = join(process.cwd(), 'prompt-bench/fixtures/images');
  const supabase = createAdminClient();

  // Recursively find all image files
  const imageFiles = await findImageFiles(fixturesDir);
  let synced = 0;

  for (const filePath of imageFiles) {
    const relativePath = relative(fixturesDir, filePath);
    const product = extractProductName(relativePath);
    const filename = basename(filePath);

    // Check if already synced
    const { data: existing } = await supabase
      .from('fixture_images')
      .select('id')
      .eq('filepath', relativePath)
      .single();

    if (existing) {
      console.log(`Skip: ${relativePath} (already synced)`);
      continue;
    }

    // Upload to R2
    const buffer = await Bun.file(filePath).arrayBuffer();
    const hash = createHash('sha256').update(Buffer.from(buffer)).digest('hex').slice(0, 8);
    const r2Key = `fixtures/${product}-${filename.replace(/\.[^.]+$/, '')}-${hash}${extname(filename)}`;

    const uploadResult = await uploadBuffer(Buffer.from(buffer), r2Key, 'image/jpeg');
    if (!isOk(uploadResult)) {
      console.error(`Failed to upload ${relativePath}: ${uploadResult.error.message}`);
      continue;
    }

    const r2Url = getPublicUrl(uploadResult.data.key);

    // Insert into database
    const { error } = await supabase
      .from('fixture_images')
      .insert({
        product,
        filename,
        filepath: relativePath,
        r2_url: r2Url,
        r2_key: uploadResult.data.key
      });

    if (error) {
      console.error(`Failed to save ${relativePath}: ${error.message}`);
      continue;
    }

    console.log(`Synced: ${relativePath} → ${r2Url}`);
    synced++;
  }

  return ok({ synced });
};

const extractProductName = (filepath: string): string => {
  // "bag/front.jpg" → "bag"
  // "coffee-grinder.jpg" → "coffee-grinder"
  const parts = filepath.split('/');
  if (parts.length > 1) {
    return parts[0];
  }
  return basename(filepath, extname(filepath));
};

const findImageFiles = async (dir: string): Promise<string[]> => {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await findImageFiles(fullPath));
    } else if (/\.(jpg|jpeg|png|webp)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
};
```

**Integrate into sync command**:
```typescript
// In prompt-bench/commands/sync.ts syncCommand function
console.log('\\n2. Syncing fixture images...');
const fixtureResult = await syncFixtureImages();
if (isOk(fixtureResult)) {
  console.log(`✓ Synced ${fixtureResult.data.synced} fixture images`);
}
```

### Part 2: Notebook Orchestrator (`prompt-bench/core/notebook-orchestrator.ts`)

Create wrapper functions that call existing core functions without modifying them.

```typescript
import type { Result } from '@bench/core/errors';
import { ok, err, createError, isOk } from '@bench/core/errors';
import { analyzeProductImages } from '@bench/core/product-analyzer';
import { compileTemplate } from '@bench/core/compiler';
import { createGeminiProvider } from '@/lib/ai/providers/gemini';
import { generateFromImage } from '@/lib/ai/generate-image';
import { evaluateBatch } from '@bench/core/evaluator';
import { createAdminClient } from '@/lib/supabase/admin';

export interface AnalysisRequest {
  sessionId: string;
  fixtureImageIds: string[];
  variables?: Record<string, any>;
  model?: string;
  cacheEnabled?: boolean;
}

export interface AnalysisResult {
  runId: string;
  phaseRunNumber: number;
  analysis: Record<string, any>;
  tokens: { input: number; output: number };
  rawPrompt: string;
  rawResponse: any;
}

export const runAnalysisPhase = async (
  request: AnalysisRequest
): Promise<Result<AnalysisResult>> => {
  const supabase = createAdminClient();

  // Fetch fixture images
  const { data: fixtures } = await supabase
    .from('fixture_images')
    .select('*')
    .in('id', request.fixtureImageIds);

  if (!fixtures || fixtures.length === 0) {
    return err(createError('VALIDATION_ERROR', 'No valid fixture images found'));
  }

  // Download images from R2
  const images = await Promise.all(
    fixtures.map(async (f) => {
      const response = await fetch(f.r2_url);
      const buffer = await response.arrayBuffer();
      return { buffer: Buffer.from(buffer), mimeType: 'image/jpeg' };
    })
  );

  // Call existing analysis function
  const analysisResult = await analyzeProductImages(images, {
    model: request.model,
    cacheEnabled: request.cacheEnabled
  });

  if (!isOk(analysisResult)) {
    return analysisResult;
  }

  // Get next phase_run_number
  const { data: existingRuns } = await supabase
    .from('prompt_tests')
    .select('phase_run_number')
    .eq('session_id', request.sessionId)
    .eq('phase', 'analysis')
    .order('phase_run_number', { ascending: false })
    .limit(1);

  const phaseRunNumber = (existingRuns?.[0]?.phase_run_number || 0) + 1;

  // Store in database
  const { data: testRecord, error } = await supabase
    .from('prompt_tests')
    .insert({
      session_id: request.sessionId,
      phase: 'analysis',
      phase_run_number: phaseRunNumber,
      parent_run_id: null,
      status: 'completed',
      inputs: { ...analysisResult.data.merged, ...request.variables },
      final_prompt: '', // Analysis doesn't have a prompt
      debug_metadata: {
        thinking: null,
        tokens: analysisResult.data.usage || { input: 0, output: 0 },
        raw_prompt: '', // Could store the analysis prompt here
        raw_response: analysisResult.data.raw
      }
    })
    .select()
    .single();

  if (error) {
    return err(createError('DATABASE_ERROR', `Failed to save analysis: ${error.message}`));
  }

  return ok({
    runId: testRecord.id,
    phaseRunNumber,
    analysis: analysisResult.data.merged,
    tokens: analysisResult.data.usage || { input: 0, output: 0 },
    rawPrompt: '',
    rawResponse: analysisResult.data.raw
  });
};

export interface GenerationRequest {
  sessionId: string;
  parentRunId: string;  // Analysis run to use
  templateSlug: string;
  templateData: Record<string, string>;  // Edited template JSON
  variables?: Record<string, any>;
}

export interface GenerationResult {
  runId: string;
  phaseRunNumber: number;
  imageUrl: string;
  finalPrompt: string;
  thinking: string | null;
  tokens: { input: number; output: number };
}

export const runGenerationPhase = async (
  request: GenerationRequest
): Promise<Result<GenerationResult>> => {
  const supabase = createAdminClient();

  // Fetch parent analysis
  const { data: parentRun } = await supabase
    .from('prompt_tests')
    .select('*')
    .eq('id', request.parentRunId)
    .single();

  if (!parentRun) {
    return err(createError('VALIDATION_ERROR', 'Parent analysis run not found'));
  }

  // Fetch template
  const { data: template } = await supabase
    .from('prompt_templates')
    .select('*')
    .eq('slug', request.templateSlug)
    .single();

  if (!template) {
    return err(createError('VALIDATION_ERROR', `Template ${request.templateSlug} not found`));
  }

  // Merge variables: analysis + manual overrides
  const mergedVariables = {
    ...parentRun.inputs,
    ...request.variables
  };

  // Compile template (use edited templateData from request)
  const compileResult = compileTemplate(
    request.templateData,
    template.variables_schema,
    mergedVariables
  );

  if (!isOk(compileResult)) {
    return compileResult;
  }

  // Get next phase_run_number
  const { data: existingRuns } = await supabase
    .from('prompt_tests')
    .select('phase_run_number')
    .eq('session_id', request.sessionId)
    .eq('phase', 'generation')
    .eq('parent_run_id', request.parentRunId)
    .order('phase_run_number', { ascending: false })
    .limit(1);

  const phaseRunNumber = (existingRuns?.[0]?.phase_run_number || 0) + 1;

  // Generate image (calls existing function)
  const gemini = createGeminiProvider();
  const genResult = await generateFromImage(
    gemini,
    compileResult.data.prompt,
    parentRun.source_image_url ? Buffer.from(await (await fetch(parentRun.source_image_url)).arrayBuffer()) : undefined
  );

  if (!isOk(genResult)) {
    return genResult;
  }

  // Extract thinking and tokens from result
  const thinking = genResult.data.thinking || null;
  const tokens = genResult.data.usage || { input: 0, output: 0 };

  // Store in database
  const { data: testRecord, error } = await supabase
    .from('prompt_tests')
    .insert({
      session_id: request.sessionId,
      phase: 'generation',
      phase_run_number: phaseRunNumber,
      parent_run_id: request.parentRunId,
      template_id: template.id,
      status: 'completed',
      inputs: mergedVariables,
      final_prompt: compileResult.data.prompt,
      image_url: genResult.data.imageUrl,
      image_key: genResult.data.imageKey,
      debug_metadata: {
        thinking,
        tokens,
        raw_prompt: compileResult.data.prompt,
        raw_response: genResult.data.raw
      }
    })
    .select()
    .single();

  if (error) {
    return err(createError('DATABASE_ERROR', `Failed to save generation: ${error.message}`));
  }

  return ok({
    runId: testRecord.id,
    phaseRunNumber,
    imageUrl: genResult.data.imageUrl,
    finalPrompt: compileResult.data.prompt,
    thinking,
    tokens
  });
};

// Similar pattern for runEvaluationPhase...
```

### Part 3: API Endpoints (`prompt-bench/ui/server.ts`)

Add simple POST endpoints that call the orchestrator functions.

```typescript
// In Bun.serve fetch handler

if (url.pathname === '/api/notebook/analyze' && req.method === 'POST') {
  const body = await req.json();
  const result = await runAnalysisPhase(body);

  if (!isOk(result)) {
    return Response.json({ error: result.error.message }, { status: 400 });
  }

  return Response.json(result.data);
}

if (url.pathname === '/api/notebook/generate' && req.method === 'POST') {
  const body = await req.json();
  const result = await runGenerationPhase(body);

  if (!isOk(result)) {
    return Response.json({ error: result.error.message }, { status: 400 });
  }

  return Response.json(result.data);
}

if (url.pathname === '/api/notebook/evaluate' && req.method === 'POST') {
  const body = await req.json();
  const result = await runEvaluationPhase(body);

  if (!isOk(result)) {
    return Response.json({ error: result.error.message }, { status: 400 });
  }

  return Response.json(result.data);
}

// Get fixture images
if (url.pathname === '/api/notebook/fixtures' && req.method === 'GET') {
  const supabase = createAdminClient();
  const { data: fixtures } = await supabase
    .from('fixture_images')
    .select('*')
    .order('product', { ascending: true })
    .order('filename', { ascending: true });

  // Group by product
  const grouped = fixtures?.reduce((acc, img) => {
    if (!acc[img.product]) acc[img.product] = [];
    acc[img.product].push(img);
    return acc;
  }, {} as Record<string, any[]>) || {};

  return Response.json({ fixtures: grouped });
}

// Get session data
if (url.pathname.startsWith('/api/notebook/session/') && req.method === 'GET') {
  const sessionId = url.pathname.split('/').pop();
  const supabase = createAdminClient();

  const { data: runs } = await supabase
    .from('prompt_tests')
    .select(`
      *,
      prompt_evaluations(*)
    `)
    .eq('session_id', sessionId)
    .order('phase', { ascending: true })
    .order('phase_run_number', { ascending: true });

  // Group by phase
  const phases = {
    analysis: runs?.filter(r => r.phase === 'analysis') || [],
    generation: runs?.filter(r => r.phase === 'generation') || [],
    evaluation: runs?.filter(r => r.phase === 'evaluation') || []
  };

  return Response.json({ sessionId, phases });
}
```

## Acceptance Criteria

### Fixture Sync
- [ ] `bun bench sync` uploads all images from `fixtures/images/`
- [ ] Product name correctly extracted from folder structure
- [ ] Duplicate uploads skipped (checks filepath)
- [ ] R2 URLs generated and stored
- [ ] Database records created in `fixture_images`

### API Endpoints
- [ ] `POST /api/notebook/analyze` runs analysis phase
- [ ] `POST /api/notebook/generate` runs generation phase
- [ ] `POST /api/notebook/evaluate` runs evaluation phase
- [ ] `GET /api/notebook/fixtures` returns grouped fixture images
- [ ] `GET /api/notebook/session/:id` returns all phase runs
- [ ] All endpoints return JSON (no SSE)
- [ ] Errors return 400 with error message

### Orchestrator Functions
- [ ] `runAnalysisPhase` calls existing `analyzeProductImages`
- [ ] `runGenerationPhase` calls existing generation code
- [ ] Parent-child relationships correctly set
- [ ] Phase run numbers increment correctly
- [ ] Debug metadata captured (thinking, tokens, prompts)
- [ ] Batch pipeline orchestrator unchanged

## Dependencies
- Task 01 (database migration) must be completed

## Testing

```bash
# Test fixture sync
bun bench sync
# Check database: should see fixture_images rows

# Test API endpoints (after UI built)
curl -X POST http://localhost:3001/api/notebook/analyze \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-123","fixtureImageIds":["uuid-1"]}'

# Should return: {"runId":"...", "analysis":{...}, "tokens":{...}}
```
