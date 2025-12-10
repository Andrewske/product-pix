// src/lib/db/templates.ts
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';

export interface PromptTemplate {
  id: string;
  slug: string;
  version: number;
  status: string;
  templateData: Record<string, unknown>;
  variablesSchema: Record<string, unknown>;
  createdAt: string;
  createdBy?: string;
}

/**
 * Fetch a template by ID from the database
 */
export const getTemplateById = async (templateId: string): Promise<PromptTemplate | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('prompt_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (error) {
    logger.error('Error fetching template', { error });
    return null;
  }

  return {
    id: data.id,
    slug: data.slug,
    version: data.version,
    status: data.status,
    templateData: data.template_data as Record<string, unknown>,
    variablesSchema: data.variables_schema as Record<string, unknown>,
    createdAt: data.created_at,
    createdBy: data.created_by || undefined,
  };
};

/**
 * Fetch a template by slug (latest version)
 */
export const getTemplateBySlug = async (slug: string): Promise<PromptTemplate | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('prompt_templates')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    logger.error('Error fetching template by slug', { error });
    return null;
  }

  return {
    id: data.id,
    slug: data.slug,
    version: data.version,
    status: data.status,
    templateData: data.template_data as Record<string, unknown>,
    variablesSchema: data.variables_schema as Record<string, unknown>,
    createdAt: data.created_at,
    createdBy: data.created_by || undefined,
  };
};

/**
 * Resolve template ID to slug (for backward compatibility)
 */
export const resolveTemplateIdToSlug = async (templateId: string): Promise<string> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('prompt_templates')
    .select('slug')
    .eq('id', templateId)
    .single();

  if (error) {
    logger.error('Error resolving template ID to slug', { error, templateId });
    return 'ecommerce-base'; // Fallback
  }

  return data.slug;
};

/**
 * Fetch all active templates
 */
export const getAllActiveTemplates = async (): Promise<PromptTemplate[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('prompt_templates')
    .select('*')
    .eq('status', 'active')
    .order('slug');

  if (error) {
    logger.error('Error fetching active templates', { error });
    return [];
  }

  return data.map((template) => ({
    id: template.id,
    slug: template.slug,
    version: template.version,
    status: template.status,
    templateData: template.template_data as Record<string, unknown>,
    variablesSchema: template.variables_schema as Record<string, unknown>,
    createdAt: template.created_at,
    createdBy: template.created_by || undefined,
  }));
};