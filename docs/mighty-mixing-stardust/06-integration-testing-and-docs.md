# Integration Testing and Documentation

## Files to Create/Modify
- `prompt-bench/scripts/test-notebook-full-workflow.ts` (new)
- `prompt-bench/ui/README.md` (modify)

## Implementation Details

Create end-to-end integration test and update documentation.

### Part 1: Integration Test

**1. Create end-to-end test script**

Create `prompt-bench/scripts/test-notebook-full-workflow.ts`:

```typescript
#!/usr/bin/env bun
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { runAnalysisPhase, runGenerationPhase } from '../core/notebook-orchestrator';
import { createAdminClient } from '@/lib/supabase/admin';

config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local'), override: true });

console.log('🧪 Testing Notebook Full Workflow\n');

const sessionId = `test-notebook-${Date.now()}`;
const supabase = createAdminClient();

// Step 1: Get fixture images
console.log('Step 1: Fetching fixture images...');
const { data: fixtures } = await supabase
  .from('fixture_images')
  .select('id, product, filename')
  .limit(2);

if (!fixtures || fixtures.length === 0) {
  console.error('❌ No fixture images found. Run: bun bench sync');
  process.exit(1);
}

console.log(`✓ Found ${fixtures.length} fixtures:`, fixtures.map(f => f.filename));

// Step 2: Run analysis
console.log('\nStep 2: Running analysis phase...');
const analysisResult = await runAnalysisPhase({
  sessionId,
  fixtureImageIds: fixtures.map(f => f.id),
  model: 'gemini-2.0-flash',
  cacheEnabled: false
});

if (!analysisResult.ok) {
  console.error('❌ Analysis failed:', analysisResult.error.message);
  process.exit(1);
}

console.log('✓ Analysis complete:');
console.log('  Run ID:', analysisResult.data.runId);
console.log('  Tokens:', analysisResult.data.tokens);
console.log('  Analysis keys:', Object.keys(analysisResult.data.analysis));

// Step 3: Get template
console.log('\nStep 3: Fetching template...');
const { data: template } = await supabase
  .from('prompt_templates')
  .select('slug, template_data')
  .eq('slug', 'ecommerce-base')
  .single();

if (!template) {
  console.error('❌ Template not found. Run: bun bench sync');
  process.exit(1);
}

console.log('✓ Template loaded:', template.slug);

// Step 4: Run generation
console.log('\nStep 4: Running generation phase...');
const generationResult = await runGenerationPhase({
  sessionId,
  parentRunId: analysisResult.data.runId,
  templateSlug: template.slug,
  templateData: template.template_data,
  variables: {}
});

if (!generationResult.ok) {
  console.error('❌ Generation failed:', generationResult.error.message);
  process.exit(1);
}

console.log('✓ Generation complete:');
console.log('  Run ID:', generationResult.data.runId);
console.log('  Image URL:', generationResult.data.imageUrl);
console.log('  Tokens:', generationResult.data.tokens);
console.log('  Has thinking:', !!generationResult.data.thinking);

// Step 5: Verify database relationships
console.log('\nStep 5: Verifying database relationships...');
const { data: dbRuns } = await supabase
  .from('prompt_tests')
  .select('id, phase, phase_run_number, parent_run_id')
  .eq('session_id', sessionId)
  .order('created_at', { ascending: true });

console.log('✓ Database records:');
dbRuns?.forEach(run => {
  console.log(`  ${run.phase} #${run.phase_run_number} (parent: ${run.parent_run_id || 'none'})`);
});

// Step 6: Verify parent-child link
const generationRun = dbRuns?.find(r => r.phase === 'generation');
const analysisRun = dbRuns?.find(r => r.phase === 'analysis');

if (generationRun?.parent_run_id !== analysisRun?.id) {
  console.error('❌ Parent-child relationship broken!');
  process.exit(1);
}

console.log('\n✅ Full workflow test PASSED');
console.log(`\nView in UI: http://localhost:8181/notebook?session=${sessionId}`);
```

**2. Run integration test**

```bash
chmod +x prompt-bench/scripts/test-notebook-full-workflow.ts
bun prompt-bench/scripts/test-notebook-full-workflow.ts
```

Expected: All steps pass, displays session URL

**3. Verify in UI**

Open the session URL from test output. Should show:
- Analysis run with merged data
- Generation run with image and thinking
- Proper parent-child linkage

### Part 2: Documentation Update

**4. Update README**

Replace contents of `prompt-bench/ui/README.md` with:

```markdown
# Prompt Bench UI

Interactive web interface for running prompt tests and iterative prompt engineering.

## Features

### 1. Batch Testing (`/`)
- Run batches of tests against templates
- Real-time progress via SSE
- View results with metrics and images

### 2. Results Viewer (`/results`)
- Browse historical test results
- Compare batches
- View evaluation scores

### 3. Notebook Interface (`/notebook`) ✨ NEW
Interactive notebook for iterative prompt engineering with granular phase control.

**Workflow:**
1. **Select Fixtures** - Choose pre-uploaded test images from gallery
2. **Analysis Phase** - Run product analysis multiple times, compare results, select best
3. **Generation Phase** - Generate images using analysis data, iterate on templates
4. **Evaluation Phase** - Score generations with different criteria

**Key Features:**
- Phase-by-phase execution (no wasted API calls)
- Run comparison within each phase
- Thinking output visible for debugging
- Token usage tracking
- Session persistence via URL params
- Parent-child run relationships

## Usage

### Start Server

```bash
bun prompt-bench/ui/server.ts
```

Open browser to `http://localhost:8181`

### Setup Notebook

1. **Sync fixture images:**
   ```bash
   bun bench sync
   ```
   Uploads images from `prompt-bench/fixtures/images/` to R2 and database.

2. **Navigate to `/notebook`**
   - Select fixture images from gallery
   - Session ID created automatically
   - URL updated with session param for sharing

3. **Run Analysis**
   - Optionally add manual variables (JSON)
   - Click "Run Analysis"
   - View product attributes, scale detection, brand info
   - Run multiple times to test analysis prompt variations
   - Select best analysis run to unlock generation

4. **Run Generation**
   - Select template from dropdown
   - Edit template JSON to customize
   - Variables auto-merged from selected analysis
   - Click "Run Generation"
   - View image + thinking + tokens
   - Run multiple times with different templates
   - Select best generation to unlock evaluation

5. **Session Sharing**
   - Copy URL from browser (includes `?session=<id>`)
   - Share with teammates
   - All runs persisted in database

## Architecture

### Database Schema

**prompt_tests table** (notebook columns):
- `session_id` - Groups runs into notebook sessions
- `phase` - 'analysis' | 'generation' | 'evaluation'
- `phase_run_number` - Sequential number within phase (1, 2, 3...)
- `parent_run_id` - Links generation→analysis, evaluation→generation
- `debug_metadata` - JSONB with thinking, tokens, raw prompts

**fixture_images table**:
- Pre-uploaded test images
- Organized by product category
- R2 URLs for fast loading

### Backend Flow

```
UI → POST /api/notebook/analyze
     → runAnalysisPhase() in notebook-orchestrator.ts
        → Fetch fixtures from DB
        → Download from R2
        → analyzeProductImages()
        → Store in prompt_tests
     ← Return analysis + metadata

UI → POST /api/notebook/generate
     → runGenerationPhase()
        → Fetch parent analysis run
        → Merge variables
        → Compile template
        → generateFromImage()
        → Store with parent_run_id
     ← Return image + thinking
```

### Error Handling

All orchestrator functions return `Result<T>` type:
- Success: `{ ok: true, data: T }`
- Failure: `{ ok: false, error: Error }`

Endpoints catch errors and return appropriate HTTP status codes.

## Development

### Testing

**Full workflow test:**
```bash
bun prompt-bench/scripts/test-notebook-full-workflow.ts
```

### Adding Fixture Images

1. Add images to `prompt-bench/fixtures/images/<product>/`
2. Run `bun bench sync`
3. Images appear in notebook fixture selector

**Folder structure:**
```
fixtures/images/
  ├── bag/
  │   ├── front.jpg
  │   └── side.jpg
  ├── coffee-maker/
  │   └── product.jpg
  └── single-image.jpg
```

**Product extraction:**
- `bag/front.jpg` → product: "bag"
- `single-image.jpg` → product: "single-image"

### Debugging

**View thinking output:**
Expand generation run in UI to see Gemini's thought process.

**Check token usage:**
All runs show input/output token counts.

**Inspect database:**
```bash
npx supabase db remote exec "
  SELECT session_id, phase, phase_run_number, parent_run_id
  FROM prompt_tests
  WHERE session_id = 'your-session-id'
  ORDER BY created_at
"
```

## Implementation Details

See `docs/composed-riding-wand/` for comprehensive planning documentation.
```

**5. Commit**

```bash
git add prompt-bench/scripts/test-notebook-full-workflow.ts prompt-bench/ui/README.md
git commit -m "test: add notebook integration test and update docs

- Create end-to-end workflow test (fixtures → analysis → generation)
- Verify database relationships and parent_run_id linkage
- Update README with notebook documentation
- Document workflow, architecture, and debugging tips"
```

## Acceptance Criteria

- [ ] Integration test script created
- [ ] Test fetches fixtures, runs analysis, runs generation
- [ ] Test verifies parent-child relationships in database
- [ ] Test passes successfully
- [ ] README.md updated with notebook documentation
- [ ] Documentation covers setup, usage, architecture, debugging
- [ ] Changes committed to git

## Dependencies

- All previous tasks (01-05) must be completed
