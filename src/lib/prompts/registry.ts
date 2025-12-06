import { ECOMMERCE_BASE, LIFESTYLE_PRODUCT } from './templates';
import { type PromptTemplate } from './types';

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

// Re-export templates for convenience
export { ECOMMERCE_BASE, LIFESTYLE_PRODUCT };
