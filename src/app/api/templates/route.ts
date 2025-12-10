// src/app/api/templates/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('prompt_templates')
    .select('id, slug, template_data')
    .eq('status', 'active')
    .order('slug');

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }

  // Transform the data to extract display information
  const templates = data.map((template) => {
    const templateData = template.template_data as Record<string, unknown>;
    return {
      id: template.id,
      slug: template.slug,
      name: (templateData.name as string) || template.slug,
      description: (templateData.description as string) || '',
    };
  });

  return NextResponse.json({ templates });
}
