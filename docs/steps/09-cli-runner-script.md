# Step 09: Create CLI Runner Script with Run Command

## Objective

Create the main CLI entry point (`scripts/prompt-bench.ts`) with the `run` command for executing batch tests against prompt templates.

## Prerequisites

- Steps 01-08 completed (database, prompts library, and Gemini modifications ready)
- `tsx` is installed as a dev dependency

## Files to Create

### `scripts/prompt-bench.ts`

```typescript
#!/usr/bin/env tsx
/**
 * Prompt Testing CLI
 *
 * Usage:
 *   npm run bench run --template <slug> --batch <file> [options]
 *   npm run bench evaluate --label <batch-label>
 *   npm run bench compare --baseline <label> --candidate <label>
 *   npm run bench report --label <batch-label>
 */

import { parseArgs } from 'node:util';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  BatchFileSchema,
  RunCommandOptionsSchema,
  type BatchFile,
  type PromptTemplate,
} from '@/lib/prompts/types';
import {
  Result,
  ok,
  err,
  createError,
  formatError,
  isOk,
} from '@/lib/prompts/errors';
import { compileTemplate, generateIdempotencyKey } from '@/lib/prompts/compiler';
import { fetchTemplate, syncTemplate } from '@/lib/prompts/registry';
import { createAdminClient } from '@/lib/supabase/admin';
import { createGeminiProvider } from '@/lib/ai/providers/gemini';
import { uploadToR2, getPublicUrl } from '@/lib/r2';

// =============================================================================
// CLI Parsing
// =============================================================================

const COMMANDS = ['run', 'evaluate', 'compare', 'report', 'sync'] as const;
type Command = (typeof COMMANDS)[number];

const parseCommand = (): { command: Command; args: string[] } => {
  const args = process.argv.slice(2);
  const command = args[0] as Command;

  if (!COMMANDS.includes(command)) {
    console.error(`Unknown command: ${command}`);
    console.error(`Available commands: ${COMMANDS.join(', ')}`);
    process.exit(1);
  }

  return { command, args: args.slice(1) };
};

// =============================================================================
// Run Command
// =============================================================================

interface RunOptions {
  template: string;
  version: number | 'latest';
  batchFile: string;
  label?: string;
  dryRun: boolean;
}

const parseRunOptions = (args: string[]): RunOptions => {
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

  if (!values.template) {
    console.error('--template is required');
    process.exit(1);
  }

  if (!values.batch) {
    console.error('--batch is required');
    process.exit(1);
  }

  return {
    template: values.template,
    version: values.version === 'latest' ? 'latest' : parseInt(values.version, 10),
    batchFile: values.batch,
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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const runCommand = async (args: string[]): Promise<void> => {
  const options = parseRunOptions(args);

  console.log(`\n📋 Prompt Bench: Run`);
  console.log(`─────────────────────────────────`);
  console.log(`Template: ${options.template}`);
  console.log(`Version: ${options.version}`);
  console.log(`Batch: ${options.batchFile}`);
  console.log(`Label: ${options.label || '(none)'}`);
  console.log(`Dry Run: ${options.dryRun}`);
  console.log(`─────────────────────────────────\n`);

  // 1. Load batch file
  const batchResult = loadBatchFile(options.batchFile);
  if (!isOk(batchResult)) {
    console.error(formatError(batchResult.error));
    process.exit(1);
  }
  const batch = batchResult.data;
  const batchLabel = options.label || batch.label || `batch-${Date.now()}`;

  console.log(`📦 Loaded ${batch.tests.length} tests from batch file`);

  // 2. Fetch template
  const templateResult = await fetchTemplate(options.template, options.version);
  if (!isOk(templateResult)) {
    console.error(formatError(templateResult.error));
    process.exit(1);
  }
  const template = templateResult.data;

  console.log(`📝 Using template: ${template.slug} v${template.version}`);

  // 3. Dry run - validate only
  if (options.dryRun) {
    console.log(`\n🔍 Dry Run - Validating inputs...\n`);

    let valid = 0;
    let invalid = 0;

    for (let i = 0; i < batch.tests.length; i++) {
      const test = batch.tests[i];
      const result = compileTemplate(
        template.templateData,
        template.variablesSchema,
        test.variables
      );

      if (isOk(result)) {
        console.log(`✅ Test ${i + 1}: Valid`);
        console.log(`   Prompt: ${result.data.prompt.slice(0, 80)}...`);
        valid++;
      } else {
        console.log(`❌ Test ${i + 1}: Invalid`);
        console.log(`   Error: ${result.error.message}`);
        invalid++;
      }
    }

    console.log(`\n📊 Validation Summary: ${valid} valid, ${invalid} invalid`);
    return;
  }

  // 4. Initialize providers
  const supabase = createAdminClient();
  const gemini = createGeminiProvider();

  // 5. Run tests
  console.log(`\n🚀 Running ${batch.tests.length} tests...\n`);

  let completed = 0;
  let failed = 0;

  for (let i = 0; i < batch.tests.length; i++) {
    const test = batch.tests[i];
    const testNum = i + 1;

    console.log(`[${testNum}/${batch.tests.length}] Processing...`);

    // Compile template
    const compileResult = compileTemplate(
      template.templateData,
      template.variablesSchema,
      test.variables,
      { includeNegative: true }
    );

    if (!isOk(compileResult)) {
      console.log(`  ❌ Compilation failed: ${compileResult.error.message}`);
      failed++;
      continue;
    }

    const compiled = compileResult.data;
    const idempotencyKey = generateIdempotencyKey(
      template.slug,
      template.version,
      test.variables,
      batchLabel
    );

    // Check for existing test with same idempotency key
    const { data: existing } = await supabase
      .from('prompt_tests')
      .select('id, status')
      .eq('idempotency_key', idempotencyKey)
      .single();

    if (existing) {
      console.log(`  ⏭️  Skipping (already exists: ${existing.status})`);
      if (existing.status === 'completed') completed++;
      else if (existing.status === 'failed') failed++;
      continue;
    }

    // Create test record
    const startTime = Date.now();
    const { data: testRecord, error: insertError } = await supabase
      .from('prompt_tests')
      .insert({
        template_id: template.id,
        idempotency_key: idempotencyKey,
        status: 'generating',
        inputs: test.variables,
        final_prompt: compiled.prompt,
        batch_label: batchLabel,
      })
      .select()
      .single();

    if (insertError || !testRecord) {
      console.log(`  ❌ Database error: ${insertError?.message}`);
      failed++;
      continue;
    }

    // Generate image
    const generationResult = await gemini.generateFromText(compiled.prompt, {
      aspectRatio: '1:1',
      resolution: '2k',
      rawPrompt: true,
    });

    if (!generationResult.success) {
      await supabase.rpc('update_prompt_test_status', {
        p_test_id: testRecord.id,
        p_new_status: 'failed',
        p_error_message: generationResult.error,
        p_error_code: generationResult.code,
      });
      console.log(`  ❌ Generation failed: ${generationResult.error}`);
      failed++;
      continue;
    }

    // Upload to R2
    const imageKey = `prompt-tests/${testRecord.id}.png`;
    const imageBuffer = Buffer.from(generationResult.imageData, 'base64');

    try {
      await uploadToR2(imageKey, imageBuffer, 'image/png');
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Unknown error';
      await supabase.rpc('update_prompt_test_status', {
        p_test_id: testRecord.id,
        p_new_status: 'failed',
        p_error_message: message,
        p_error_code: 'STORAGE_ERROR',
      });
      console.log(`  ❌ Upload failed: ${message}`);
      failed++;
      continue;
    }

    // Update test record as completed
    const durationMs = Date.now() - startTime;
    const imageUrl = getPublicUrl(imageKey);

    await supabase
      .from('prompt_tests')
      .update({
        status: 'evaluating', // Ready for evaluation
        image_url: imageUrl,
        image_key: imageKey,
        duration_ms: durationMs,
        completed_at: new Date().toISOString(),
      })
      .eq('id', testRecord.id);

    console.log(`  ✅ Generated in ${durationMs}ms`);
    completed++;

    // Rate limiting: wait between requests
    if (i < batch.tests.length - 1) {
      await sleep(1000);
    }
  }

  // Summary
  console.log(`\n─────────────────────────────────`);
  console.log(`📊 Results:`);
  console.log(`   Completed: ${completed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Batch Label: ${batchLabel}`);
  console.log(`─────────────────────────────────\n`);

  console.log(`Next steps:`);
  console.log(`  npm run bench evaluate --label "${batchLabel}"`);
};

// =============================================================================
// Sync Command
// =============================================================================

const syncCommand = async (): Promise<void> => {
  console.log(`\n🔄 Syncing templates to database...\n`);

  const { syncAllTemplates } = await import('@/lib/prompts/registry');
  const result = await syncAllTemplates();

  if (result.synced.length > 0) {
    console.log(`✅ Synced: ${result.synced.join(', ')}`);
  }

  if (result.errors.length > 0) {
    console.log(`❌ Errors:`);
    for (const e of result.errors) {
      console.log(`   ${e.slug}: ${e.error}`);
    }
  }

  console.log(`\nDone.`);
};

// =============================================================================
// Main
// =============================================================================

const main = async (): Promise<void> => {
  const { command, args } = parseCommand();

  switch (command) {
    case 'run':
      await runCommand(args);
      break;
    case 'sync':
      await syncCommand();
      break;
    case 'evaluate':
      console.log('Evaluate command - see step 10');
      break;
    case 'compare':
      console.log('Compare command - see step 12');
      break;
    case 'report':
      console.log('Report command - see step 12');
      break;
    default:
      console.error(`Command not implemented: ${command}`);
      process.exit(1);
  }
};

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

### Update `package.json`

Add the bench script:

```json
{
  "scripts": {
    "bench": "tsx scripts/prompt-bench.ts"
  }
}
```

### Create Example Batch File: `tests/fixtures/products-mix.json`

```json
{
  "label": "products-baseline",
  "tests": [
    {
      "variables": {
        "product": "ceramic coffee mug",
        "color": "matte black",
        "material": "glazed ceramic",
        "background_type": "pure white seamless",
        "lighting_style": "soft diffused studio",
        "style": "commercial catalog"
      }
    },
    {
      "variables": {
        "product": "wireless earbuds",
        "color": "white",
        "material": "plastic",
        "background_type": "light gray gradient",
        "lighting_style": "high-key bright",
        "style": "minimalist"
      }
    },
    {
      "variables": {
        "product": "leather wallet",
        "color": "brown",
        "material": "genuine leather",
        "background_type": "marble surface",
        "lighting_style": "three-point",
        "style": "luxury advertising"
      }
    }
  ]
}
```

## Implementation Steps

1. Create `scripts/` directory if it doesn't exist: `mkdir -p scripts`
2. Create `scripts/prompt-bench.ts` with the content above
3. Create `tests/fixtures/` directory: `mkdir -p tests/fixtures`
4. Create `tests/fixtures/products-mix.json` with the example batch
5. Update `package.json` to add the `bench` script
6. Verify the script runs: `npm run bench --help` (should show commands)
7. Verify dry run works: `npm run bench run --template ecommerce-base --batch tests/fixtures/products-mix.json --dry-run`

## Acceptance Criteria

- [ ] `scripts/prompt-bench.ts` exists and is executable
- [ ] `package.json` has `"bench": "tsx scripts/prompt-bench.ts"` script
- [ ] Running `npm run bench` shows available commands
- [ ] `npm run bench run --help` shows run options
- [ ] `npm run bench run --template ecommerce-base --batch tests/fixtures/products-mix.json --dry-run` validates inputs
- [ ] `npm run bench sync` syncs templates to database
- [ ] Full run command creates test records in `prompt_tests` table
- [ ] Idempotency prevents duplicate tests on re-run
- [ ] Tests are left in `evaluating` status after generation
- [ ] Example batch file exists at `tests/fixtures/products-mix.json`

## Notes

- The script uses Node.js `parseArgs` for argument parsing (built-in, no dependencies)
- Tests are created with `evaluating` status so the evaluate command knows which ones need processing
- Idempotency keys are based on template + version + variables + batch label
- Rate limiting (1 second delay) prevents API throttling
- The sync command must be run first to populate the database with templates
