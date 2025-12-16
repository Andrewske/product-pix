import type { AnalysisPrompt } from '@/types/analysis';

export const PRODUCT_ANALYSIS_V1: Omit<AnalysisPrompt, 'id' | 'createdBy' | 'createdAt'> = {
  slug: 'product-analysis',
  version: 1,
  status: 'active',
  promptText: `Analyze this product image and extract the following information. Be specific and descriptive. If you cannot determine a field, use an empty string.`,
  responseSchema: {
    product: {
      type: 'string',
      description: 'The main product name/type (e.g., "ceramic coffee mug", "leather wallet", "cotton t-shirt")'
    },
    color: {
      type: 'string',
      description: 'Primary color and finish (e.g., "matte black", "navy blue denim", "brushed stainless steel")'
    },
    material: {
      type: 'string',
      description: 'Primary material composition (e.g., "ceramic", "genuine leather", "100% cotton")'
    },
    shape: {
      type: 'string',
      description: 'Overall shape and form (e.g., "cylindrical with handle", "rectangular with rounded corners")'
    },
    features: {
      type: 'array',
      items: 'string',
      description: 'Key distinguishing features (e.g., ["textured surface", "embossed logo", "adjustable strap"])'
    }
  }
};
