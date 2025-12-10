// src/lib/ai/prompt-builder.ts
import { getTemplateById, getTemplateBySlug, type PromptTemplate } from '@/lib/db/templates';
import { compileTemplate } from '@bench/core/compiler';
import { ok, err, type Result } from '@/lib/result';
import type { ProductAnalysis } from './types';
import type { TemplateData, VariablesSchema } from '@bench/core/types';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Helper function to compile a template with product analysis
 */
const compileWithAnalysis = (
  template: PromptTemplate,
  analysis: ProductAnalysis | undefined
): Result<string> => {
  const variables: Record<string, string> = {
    product: analysis?.product || '',
    color: analysis?.color || '',
    material: analysis?.material || '',
    shape: analysis?.shape || '',
    features: analysis?.features?.join(', ') || '',
  };

  const compileResult = compileTemplate(
    template.templateData as TemplateData,
    template.variablesSchema as VariablesSchema,
    variables,
    { skipValidation: false }
  );

  if (!compileResult.ok) {
    return err({
      code: 'COMPILATION_ERROR',
      message: `Failed to compile template: ${compileResult.error.message}`,
    });
  }

  return ok(compileResult.data.prompt);
};

// =============================================================================
// Prompt Builder
// =============================================================================

/**
 * Build a prompt from a template fetched from the database
 *
 * @param templateId - ID of the template to use
 * @param analysis - Product analysis data (optional, uses empty strings if undefined)
 * @returns Result with compiled prompt or error
 */
export const buildPromptFromTemplate = async (
  templateId: string,
  analysis: ProductAnalysis | undefined
): Promise<Result<string>> => {
  // Fetch template from database
  const template = await getTemplateById(templateId);
  if (!template) {
    return err({
      code: 'TEMPLATE_NOT_FOUND',
      message: `Template with ID "${templateId}" not found`,
    });
  }

  return compileWithAnalysis(template, analysis);
};

/**
 * Build a prompt from a template slug (uses latest active version)
 *
 * @param templateSlug - Slug of the template to use
 * @param analysis - Product analysis data (optional, uses empty strings if undefined)
 * @returns Result with compiled prompt or error
 */
export const buildPromptFromTemplateSlug = async (
  templateSlug: string,
  analysis: ProductAnalysis | undefined
): Promise<Result<string>> => {
  // Fetch template from database by slug
  const template = await getTemplateBySlug(templateSlug);
  if (!template) {
    return err({
      code: 'TEMPLATE_NOT_FOUND',
      message: `Template with slug "${templateSlug}" not found`,
    });
  }

  return compileWithAnalysis(template, analysis);
};