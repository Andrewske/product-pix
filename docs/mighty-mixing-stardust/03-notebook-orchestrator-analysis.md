# Notebook Orchestrator - Analysis Phase

## Files to Create
- `prompt-bench/core/notebook-orchestrator.ts` (new)

## Implementation Details

Create orchestrator module with wrapper functions that call existing core functions to implement the notebook's analysis phase.

### Steps

**1. Create file with imports and types**

Create `prompt-bench/core/notebook-orchestrator.ts` with:

```typescript
import type { Result } from '@bench/core/errors';
import { ok, err, createError, isOk } from '@bench/core/errors';
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
```

**2. Implement runAnalysisPhase function**

Add after the types:

```typescript
// =============================================================================
// Analysis Phase
// =============================================================================

export const runAnalysisPhase = async (
  request: AnalysisRequest
): Promise<Result<AnalysisResult>> => {
  const supabase = createAdminClient();

  logger.info('Starting analysis phase', {
    sessionId: request.sessionId,
    fixtureCount: request.fixtureImageIds.length
  });

  // 1. Fetch fixture images from database
  const { data: fixtures, error: fetchError } = await supabase
    .from('fixture_images')
    .select('*')
    .in('id', request.fixtureImageIds);

  if (fetchError) {
    return err(createError('DATABASE_ERROR', `Failed to fetch fixtures: ${fetchError.message}`));
  }

  if (!fixtures || fixtures.length === 0) {
    return err(createError('VALIDATION_ERROR', 'No valid fixture images found'));
  }

  logger.info('Fetched fixture images', {
    sessionId: request.sessionId,
    count: fixtures.length
  });

  // 2. Download images from R2
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

  // 3. Run product analysis
  const analysisResult = await analyzeProductImages(images, {
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

  const { merged, individual } = analysisResult.data;

  // 4. Get next phase run number
  const { data: existingRuns } = await supabase
    .from('prompt_tests')
    .select('phase_run_number')
    .eq('session_id', request.sessionId)
    .eq('phase', 'analysis')
    .order('phase_run_number', { ascending: false })
    .limit(1);

  const phaseRunNumber = (existingRuns?.[0]?.phase_run_number || 0) + 1;

  // 5. Store in database
  const { data: testRecord, error: insertError } = await supabase
    .from('prompt_tests')
    .insert({
      session_id: request.sessionId,
      phase: 'analysis',
      phase_run_number: phaseRunNumber,
      parent_run_id: null, // Analysis has no parent
      status: 'completed',
      inputs: { ...merged, ...request.variables },
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

  logger.info('Analysis phase complete', {
    sessionId: request.sessionId,
    runId: testRecord.id,
    phaseRunNumber
  });

  return ok({
    runId: testRecord.id,
    phaseRunNumber,
    analysis: merged,
    tokens: analysisResult.data.usage || { input: 0, output: 0 },
    rawPrompt: '',
    rawResponse: analysisResult.data.raw
  });
};
```

**3. Test analysis phase in isolation** (Optional)

Create test script `prompt-bench/scripts/test-notebook-analysis.ts`:

```typescript
#!/usr/bin/env bun
import { runAnalysisPhase } from '../core/notebook-orchestrator';
import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local'), override: true });

// Test with fixture IDs from database (get these from earlier fixture sync)
const result = await runAnalysisPhase({
  sessionId: `test-${Date.now()}`,
  fixtureImageIds: ['<paste-fixture-id-here>'], // Replace with actual ID
  model: 'gemini-2.0-flash',
  cacheEnabled: false
});

if (result.ok) {
  console.log('✓ Analysis succeeded');
  console.log('Run ID:', result.data.runId);
  console.log('Tokens:', result.data.tokens);
  console.log('Analysis:', JSON.stringify(result.data.analysis, null, 2));
} else {
  console.error('✗ Analysis failed:', result.error.message);
  process.exit(1);
}
```

Run:
```bash
chmod +x prompt-bench/scripts/test-notebook-analysis.ts
bun prompt-bench/scripts/test-notebook-analysis.ts
```

**4. Commit**

```bash
git add prompt-bench/core/notebook-orchestrator.ts
git commit -m "feat: implement notebook analysis phase orchestrator

- Create runAnalysisPhase wrapper function
- Fetch fixture images from database
- Download images from R2
- Call analyzeProductImages for product analysis
- Store results in prompt_tests with notebook columns
- Return analysis data and metadata for UI"
```

## Acceptance Criteria

- [ ] notebook-orchestrator.ts file created
- [ ] TypeScript types defined (AnalysisRequest, AnalysisResult, etc.)
- [ ] runAnalysisPhase function implemented
- [ ] Function fetches fixtures from database
- [ ] Images downloaded from R2 URLs
- [ ] Calls existing analyzeProductImages function
- [ ] Stores results with notebook columns (session_id, phase, phase_run_number)
- [ ] Returns Result<AnalysisResult> type
- [ ] Changes committed to git

## Dependencies

- Task 01 (database migration)
- Task 02 (fixture sync) - needed for testing
