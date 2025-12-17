import { createAdminClient } from '@/lib/supabase/admin';
import {
  type PromptTemplate,
  type TemplateStatus,
  TemplateDataSchema,
  VariablesSchemaSchema,
  TemplateStatusSchema,
} from '@bench/core/types';
import { type Result, ok, err, createError } from '@bench/core/errors';
import { validateTemplateVariables } from '@bench/core/compiler';
import { getRegisteredTemplate, getRegisteredSlugs } from '@bench/templates/registry';
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
    const createdAtStr = z.string().parse(data.created_at);
    const createdBy = data.created_by
      ? z.string().uuid().parse(data.created_by)
      : undefined;

    const baseTemplate = {
      id,
      slug,
      version,
      status,
      templateData,
      variablesSchema,
      createdBy,
      createdAt: new Date(createdAtStr),
    };

    // Check if it's a collection template
    if (data.type === 'collection') {
      const outputCount = z.number().int().positive().parse(data.output_count);

      return ok({
        ...baseTemplate,
        type: 'collection' as const,
        outputCount
      });
    }

    // Default: single template
    return ok({
      ...baseTemplate,
      type: 'single' as const,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid template data';
    return err(createError('VALIDATION_ERROR', `Failed to parse template: ${message}`));
  }
};

/**
 * Fetch a template from the database by slug and version
 * Auto-syncs from registry if not found
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

  // If not found (PGRST116 = no rows returned), try auto-sync from registry
  if (error?.code === 'PGRST116' || !data) {
    const syncResult = await syncTemplate(slug);
    if (!syncResult.ok) {
      return err(
        createError('DATABASE_ERROR', `Template not found and sync failed: ${syncResult.error.message}`)
      );
    }

    // Retry fetch after sync
    const { data: retryData, error: retryError } = await query.single();
    if (retryError || !retryData) {
      return err(
        createError('DATABASE_ERROR', `Template synced but fetch failed: ${retryError?.message || 'No data'}`)
      );
    }

    return parseTemplateRow(retryData as Record<string, unknown>);
  }

  if (error) {
    return err(
      createError('DATABASE_ERROR', `Failed to fetch template: ${error.message}`)
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
       // ADD: Collection-specific fields with conditional logic
       type: 'type' in registered ? registered.type : 'single',
       output_count: 'outputCount' in registered ? registered.outputCount : 1,
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
 * Insert a template directly into the database (bypasses registry)
 * Useful for improved templates that haven't been registered yet
 */
export const insertTemplate = async (
  template: Omit<PromptTemplate, 'id' | 'createdBy' | 'createdAt'>,
  userId?: string
): Promise<Result<PromptTemplate>> => {
  // Validate template variables match schema
  const validationError = validateTemplateVariables(
    template.templateData,
    template.variablesSchema
  );
  if (validationError) {
    return err(validationError);
  }

  const supabase = createAdminClient();

  // Check if this exact version already exists
  const { data: existing } = await supabase
    .from('prompt_templates')
    .select('id')
    .eq('slug', template.slug)
    .eq('version', template.version)
    .single();

  if (existing) {
    // Already exists, fetch and return
    return fetchTemplate(template.slug, template.version);
  }

   // Insert new template
   const { data, error } = await supabase
     .from('prompt_templates')
     .insert({
       slug: template.slug,
       version: template.version,
       status: template.status,
       template_data: template.templateData,
       variables_schema: template.variablesSchema,
       created_by: userId,
       // ADD: Collection-specific fields with conditional logic
       type: 'type' in template ? template.type : 'single',
       output_count: 'outputCount' in template ? template.outputCount : 1,
     })
     .select()
     .single();

  if (error) {
    return err(
      createError('DATABASE_ERROR', `Failed to insert template: ${error.message}`)
    );
  }

  return parseTemplateRow(data as Record<string, unknown>);
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
