# Prompt-Bench Sync Infrastructure

## Files to Create
- `prompt-bench/db/analysis-prompts.ts` (new)
- `prompt-bench/commands/sync-analysis.ts` (new)

## Files to Modify
- `prompt-bench/cli.ts` (add sync-analysis command)

## Implementation Details

### 1. Prompt-Bench DB Layer
Mirror the template sync pattern for analysis prompts:

```typescript
// prompt-bench/db/analysis-prompts.ts
import { createAdminClient } from '@/lib/supabase/admin';
import { getRegisteredAnalysisPrompt, getRegisteredAnalysisPromptSlugs } from '@/lib/analysis/prompts/registry';
import { ok, err, type Result } from '@bench/core/errors';
import type { AnalysisPrompt } from '@/types/analysis';

export async function syncAnalysisPrompt(
  slug: string,
  userId?: string
): Promise<Result<AnalysisPrompt>> {
  const registered = getRegisteredAnalysisPrompt(slug);
  if (!registered) {
    return err(createError('VALIDATION_ERROR', `Analysis prompt "${slug}" not found in registry`));
  }

  const supabase = createAdminClient();

  // Check if exact version already exists (idempotent)
  const { data: existing } = await supabase
    .from('analysis_prompts')
    .select('id')
    .eq('slug', slug)
    .eq('version', registered.version)
    .single();

  if (existing) {
    // Already synced, return existing
    return fetchAnalysisPrompt(slug, registered.version);
  }

  // Insert new version
  const { data, error } = await supabase
    .from('analysis_prompts')
    .insert({
      slug: registered.slug,
      version: registered.version,
      status: registered.status,
      prompt_text: registered.promptText,
      response_schema: registered.responseSchema,
      created_by: userId
    })
    .select()
    .single();

  if (error) {
    return err(createError('DATABASE_ERROR', `Failed to sync analysis prompt: ${error.message}`));
  }

  return ok({
    id: data.id,
    slug: data.slug,
    version: data.version,
    status: data.status,
    promptText: data.prompt_text,
    responseSchema: data.response_schema,
    createdBy: data.created_by,
    createdAt: new Date(data.created_at)
  });
}

export async function syncAllAnalysisPrompts(userId?: string) {
  const results = { synced: [], errors: [] };

  for (const slug of getRegisteredAnalysisPromptSlugs()) {
    const result = await syncAnalysisPrompt(slug, userId);
    if (result.ok) {
      results.synced.push(slug);
    } else {
      results.errors.push({ slug, error: result.error.message });
    }
  }

  return results;
}

export async function fetchAnalysisPrompt(
  slug: string,
  version: number | 'latest' = 'latest'
): Promise<Result<AnalysisPrompt>> {
  const supabase = createAdminClient();

  let query = supabase
    .from('analysis_prompts')
    .select('*')
    .eq('slug', slug);

  if (version === 'latest') {
    query = query.order('version', { ascending: false }).limit(1);
  } else {
    query = query.eq('version', version);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    return err(createError('NOT_FOUND', `Analysis prompt "${slug}" not found`));
  }

  return ok({
    id: data.id,
    slug: data.slug,
    version: data.version,
    status: data.status,
    promptText: data.prompt_text,
    responseSchema: data.response_schema,
    createdBy: data.created_by,
    createdAt: new Date(data.created_at)
  });
}
```

### 2. Sync Command
Create the CLI command:

```typescript
// prompt-bench/commands/sync-analysis.ts
import { syncAllAnalysisPrompts } from '@bench/db/analysis-prompts';
import { logger } from '@/lib/logging';

export async function syncAnalysisCommand(): Promise<void> {
  logger.info('Syncing analysis prompts to database...');

  const results = await syncAllAnalysisPrompts();

  if (results.synced.length > 0) {
    logger.info(`✓ Synced ${results.synced.length} analysis prompts:`);
    results.synced.forEach(slug => logger.info(`  - ${slug}`));
  }

  if (results.errors.length > 0) {
    logger.error(`✗ Failed to sync ${results.errors.length} analysis prompts:`);
    results.errors.forEach(({ slug, error }) => {
      logger.error(`  - ${slug}: ${error}`);
    });
    process.exit(1);
  }

  logger.info('Analysis prompt sync complete');
}
```

### 3. CLI Integration
Add the command to the CLI router:

```typescript
// prompt-bench/cli.ts (add to command routing)
import { syncAnalysisCommand } from '@bench/commands/sync-analysis';

// In the command switch/router:
case 'sync-analysis':
  await syncAnalysisCommand();
  break;
```

## Acceptance Criteria
- [ ] `syncAnalysisPrompt` implements idempotent sync (checks existing version)
- [ ] `syncAllAnalysisPrompts` syncs all registered prompts
- [ ] `fetchAnalysisPrompt` retrieves prompts by slug and version
- [ ] CLI command `bun bench sync-analysis` works and logs results
- [ ] Follows Result<T> error handling pattern
- [ ] Uses admin client to bypass RLS

## Dependencies
- Task 01 (migrations)
- Task 02 (prompt definitions and registry)
