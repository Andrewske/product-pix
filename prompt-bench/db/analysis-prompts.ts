import { createAdminClient } from '@/lib/supabase/admin';
import { getRegisteredAnalysisPrompt, getRegisteredAnalysisPromptSlugs } from '@/lib/analysis/prompts/registry';
import { ok, err, type Result, createError } from '@bench/core/errors';
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
