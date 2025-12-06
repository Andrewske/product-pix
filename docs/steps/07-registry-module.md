# Step 07: Create Registry Module with Base Template

## Objective

Create the registry module that defines prompt templates in code and provides utilities for syncing them to the database.

## Prerequisites

- Step 04 completed (types module exists)
- Step 05 completed (errors module exists)
- Step 06 completed (compiler module exists)

## Files to Create

### `src/lib/prompts/registry.ts`

```typescript
import { PromptTemplate, TemplateData, VariablesSchema, TemplateStatus } from './types';
import { Result, ok, err, createError } from './errors';
import { validateTemplateVariables } from './compiler';
import { createAdminClient } from '@/lib/supabase/admin';

// =============================================================================
// Template Definitions
// =============================================================================

/**
 * Base e-commerce product photography template
 */
export const ECOMMERCE_BASE: Omit<PromptTemplate, 'id' | 'createdBy' | 'createdAt'> = {
  slug: 'ecommerce-base',
  version: 1,
  status: 'active',
  templateData: {
    subject: 'Professional e-commerce photo of {product}, {color} {material}',
    background: 'on {background_type} background',
    lighting: '{lighting_style} lighting with soft fill',
    camera: 'shot on DSLR with 85mm lens f/8',
    style: '{style} photography, color-accurate',
    quality: '4K resolution, sharp focus, product centered filling 85% of frame',
    negative: 'worst quality, blurry, watermark, text, logo',
  },
  variablesSchema: {
    product: {
      type: 'string',
      required: true,
      description: 'The product name/description',
    },
    color: {
      type: 'string',
      required: false,
      default: '',
      description: 'Product color (optional)',
    },
    material: {
      type: 'string',
      required: false,
      default: '',
      description: 'Product material (optional)',
    },
    background_type: {
      type: 'enum',
      required: true,
      options: ['pure white seamless', 'light gray gradient', 'marble surface'],
      default: 'pure white seamless',
      description: 'Background style',
    },
    lighting_style: {
      type: 'enum',
      required: true,
      options: ['soft diffused studio', 'high-key bright', 'three-point'],
      default: 'soft diffused studio',
      description: 'Lighting setup',
    },
    style: {
      type: 'enum',
      required: true,
      options: ['commercial catalog', 'luxury advertising', 'minimalist'],
      default: 'commercial catalog',
      description: 'Photography style',
    },
  },
};

/**
 * Lifestyle product photography template
 */
export const LIFESTYLE_PRODUCT: Omit<PromptTemplate, 'id' | 'createdBy' | 'createdAt'> = {
  slug: 'lifestyle-product',
  version: 1,
  status: 'draft',
  templateData: {
    subject: '{product} in a {setting} setting',
    background: '{background_scene}',
    lighting: 'natural {time_of_day} lighting',
    camera: 'shot on mirrorless camera, {focal_length}mm lens',
    style: 'lifestyle photography, warm tones, {mood} atmosphere',
    quality: 'high resolution, cinematic depth of field',
    negative: 'artificial, sterile, harsh shadows, overexposed',
  },
  variablesSchema: {
    product: {
      type: 'string',
      required: true,
      description: 'The product name/description',
    },
    setting: {
      type: 'enum',
      required: true,
      options: ['modern kitchen', 'cozy living room', 'outdoor patio', 'minimalist workspace'],
      default: 'modern kitchen',
    },
    background_scene: {
      type: 'string',
      required: false,
      default: 'softly blurred interior background',
    },
    time_of_day: {
      type: 'enum',
      required: true,
      options: ['morning', 'golden hour', 'afternoon'],
      default: 'morning',
    },
    focal_length: {
      type: 'enum',
      required: true,
      options: ['35', '50', '85'],
      default: '50',
    },
    mood: {
      type: 'enum',
      required: true,
      options: ['relaxed', 'energetic', 'sophisticated'],
      default: 'relaxed',
    },
  },
};

// =============================================================================
// Registry
// =============================================================================

/**
 * All registered templates
 */
export const TEMPLATE_REGISTRY: Record<string, Omit<PromptTemplate, 'id' | 'createdBy' | 'createdAt'>> = {
  'ecommerce-base': ECOMMERCE_BASE,
  'lifestyle-product': LIFESTYLE_PRODUCT,
};

/**
 * Get a template by slug from the registry
 */
export const getRegisteredTemplate = (
  slug: string
): Omit<PromptTemplate, 'id' | 'createdBy' | 'createdAt'> | undefined => {
  return TEMPLATE_REGISTRY[slug];
};

/**
 * Get all registered template slugs
 */
export const getRegisteredSlugs = (): string[] => {
  return Object.keys(TEMPLATE_REGISTRY);
};

// =============================================================================
// Database Operations
// =============================================================================

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

  // Map snake_case to camelCase
  const template: PromptTemplate = {
    id: data.id,
    slug: data.slug,
    version: data.version,
    status: data.status as TemplateStatus,
    templateData: data.template_data as TemplateData,
    variablesSchema: data.variables_schema as VariablesSchema,
    createdBy: data.created_by,
    createdAt: new Date(data.created_at),
  };

  return ok(template);
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

  const template: PromptTemplate = {
    id: data.id,
    slug: data.slug,
    version: data.version,
    status: data.status as TemplateStatus,
    templateData: data.template_data as TemplateData,
    variablesSchema: data.variables_schema as VariablesSchema,
    createdBy: data.created_by,
    createdAt: new Date(data.created_at),
  };

  return ok(template);
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
```

## Implementation Steps

1. Create the file at `src/lib/prompts/registry.ts`
2. Copy the content exactly as shown
3. Verify there are no TypeScript errors: `npx tsc --noEmit`

## Acceptance Criteria

- [ ] File exists at `src/lib/prompts/registry.ts`
- [ ] All code compiles without TypeScript errors
- [ ] `ECOMMERCE_BASE` template is defined with all required fields
- [ ] `LIFESTYLE_PRODUCT` template is defined as a draft
- [ ] `TEMPLATE_REGISTRY` contains all templates indexed by slug
- [ ] `getRegisteredTemplate` returns template by slug
- [ ] `fetchTemplate` retrieves templates from database with version support
- [ ] `syncTemplate` creates new templates in database
- [ ] `syncTemplate` validates template variables against schema before syncing
- [ ] `syncAllTemplates` syncs all registered templates
- [ ] `updateTemplateStatus` updates template status in database

## Notes

- Templates are defined in code for version control and review
- The registry acts as the source of truth, synced to the database
- The `ECOMMERCE_BASE` template is the primary template from the original plan
- `LIFESTYLE_PRODUCT` is included as an example second template (in draft status)
- All database operations use the admin client to bypass RLS
