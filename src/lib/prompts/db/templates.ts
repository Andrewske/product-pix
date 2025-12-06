import { createAdminClient } from '@/lib/supabase/admin';
import {
  type PromptTemplate,
  type TemplateStatus,
  TemplateDataSchema,
  VariablesSchemaSchema,
  TemplateStatusSchema,
} from '../types';
import { type Result, ok, err, createError } from '../errors';
import { validateTemplateVariables } from '../compiler';
import { getRegisteredTemplate, getRegisteredSlugs } from '../registry';
import { z } from 'zod';

/**
 * Safely parse a database row into a PromptTemplate.
 * Uses Zod schemas to validate JSONB fields at runtime instead of unsafe type assertions.
 */
const parseTemplateRow = (data: Record<string, unknown>): Result<PromptTemplate> => {
  try {
    const templateData = TemplateDataSchema.parse(data.template_data);
    const variablesSchema = VariablesSchemaSchema.parse(data.variables_schema);
    const status = TemplateStatusSchema.parse(data.status);

    // Validate primitive fields with inline checks
    const id = z.string().uuid().parse(data.id);
    const slug = z.string().min(1).parse(data.slug);
    const version = z.number().int().positive().parse(data.version);
    const createdAt = z.string().datetime().parse(data.created_at);
    const createdBy = data.created_by
      ? z.string().uuid().parse(data.created_by)
      : undefined;

    return ok({
      id,
      slug,
      version,
      status,
      templateData,
      variablesSchema,
      createdBy,
      createdAt: new Date(createdAt),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid template data';
    return err(createError('VALIDATION_ERROR', `Failed to parse template: ${message}`));
  }
};

/**
 * Fetch a template from the database by slug and version
 */
export const fetchTemplate = async (
  slug: string,
  version: number | 'latest'
): Promise<Result<PromptTemplate>> => {
  const supabase = createAdminClient();

  let query = supabase
    .from('prompt_templates')
    .select('*')
    .eq('slug', slug);

  if (version === 'latest') {
    query = query.order('version', { ascending: false }).limit(1);
  } else {
    query = query.eq('version', version);
  }

  const { data, error } = await query.single();

  if (error) {
    return err(
      createError('DATABASE_ERROR', `Failed to fetch template: ${error.message}`)
    );
  }

  if (!data) {
    return err(
      createError('DATABASE_ERROR', `Template not found: ${slug} v${version}`)
    );
  }

  return parseTemplateRow(data as Record<string, unknown>);
};

/**
 * Sync a template from the registry to the database
 * Creates a new version if the template doesn't exist or has changed
 */
export const syncTemplate = async (
  slug: string,
  userId?: string
): Promise<Result<PromptTemplate>> => {
  const registered = getRegisteredTemplate(slug);

  if (!registered) {
    return err(
      createError('VALIDATION_ERROR', `Template not in registry: ${slug}`)
    );
  }

  // Validate template variables match schema
  const validationError = validateTemplateVariables(
    registered.templateData,
    registered.variablesSchema
  );
  if (validationError) {
    return err(validationError);
  }

  const supabase = createAdminClient();

  // Check if this exact version already exists
  const { data: existing } = await supabase
    .from('prompt_templates')
    .select('id')
    .eq('slug', slug)
    .eq('version', registered.version)
    .single();

  if (existing) {
    // Already synced, fetch and return
    return fetchTemplate(slug, registered.version);
  }

  // Insert new template
  const { data, error } = await supabase
    .from('prompt_templates')
    .insert({
      slug: registered.slug,
      version: registered.version,
      status: registered.status,
      template_data: registered.templateData,
      variables_schema: registered.variablesSchema,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    return err(
      createError('DATABASE_ERROR', `Failed to sync template: ${error.message}`)
    );
  }

  return parseTemplateRow(data as Record<string, unknown>);
};

/**
 * Sync all registered templates to the database
 */
export const syncAllTemplates = async (
  userId?: string
): Promise<{ synced: string[]; errors: Array<{ slug: string; error: string }> }> => {
  const results = {
    synced: [] as string[],
    errors: [] as Array<{ slug: string; error: string }>,
  };

  for (const slug of getRegisteredSlugs()) {
    const result = await syncTemplate(slug, userId);
    if (result.ok) {
      results.synced.push(slug);
    } else {
      results.errors.push({ slug, error: result.error.message });
    }
  }

  return results;
};

/**
 * Update template status (draft -> active -> archived)
 */
export const updateTemplateStatus = async (
  slug: string,
  version: number,
  status: TemplateStatus
): Promise<Result<void>> => {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('prompt_templates')
    .update({ status })
    .eq('slug', slug)
    .eq('version', version);

  if (error) {
    return err(
      createError('DATABASE_ERROR', `Failed to update status: ${error.message}`)
    );
  }

  return ok(undefined);
};
