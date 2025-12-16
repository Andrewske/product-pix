import { createClient } from '@/lib/supabase/server';
import type { AnalysisPrompt } from '@/types/analysis';

export async function fetchAnalysisPromptBySlug(
  slug: string,
  version: number | 'latest' = 'latest'
): Promise<AnalysisPrompt | null> {
  const supabase = await createClient();

  let query = supabase
    .from('analysis_prompts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active');

  if (version === 'latest') {
    query = query.order('version', { ascending: false }).limit(1);
  } else {
    query = query.eq('version', version);
  }

  const { data, error } = await query.single();

  if (error || !data) return null;

  return {
    id: data.id,
    slug: data.slug,
    version: data.version,
    status: data.status,
    promptText: data.prompt_text,
    responseSchema: data.response_schema,
    createdBy: data.created_by,
    createdAt: new Date(data.created_at)
  };
}

export async function getAllActiveAnalysisPrompts(): Promise<AnalysisPrompt[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('analysis_prompts')
    .select('*')
    .eq('status', 'active')
    .order('slug');

  return data?.map(row => ({
    id: row.id,
    slug: row.slug,
    version: row.version,
    status: row.status,
    promptText: row.prompt_text,
    responseSchema: row.response_schema,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at)
  })) || [];
}
