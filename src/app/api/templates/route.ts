// src/app/api/templates/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('prompt_templates')
    .select('id, slug, version, template_data')
    .eq('status', 'active')
    .order('slug')
    .order('version', { ascending: false }); // Highest version first

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }

  // Deduplicate by slug, keeping highest version
  const templateMap = new Map<string, typeof data[0]>();
  for (const template of data) {
    if (!templateMap.has(template.slug)) {
      templateMap.set(template.slug, template);
    }
  }

  // Transform the data to extract display information
  const templates = Array.from(templateMap.values()).map((template) => {
    const templateData = template.template_data as Record<string, unknown>;
    return {
      slug: template.slug,
      version: template.version,
      name: (templateData.name as string) || template.slug,
      description: (templateData.description as string) || '',
      icon: (templateData.icon as string) || '📷',
    };
  });

  return NextResponse.json({ templates });
}
