import type { AnalysisPrompt } from '@/types/analysis';

export const PRODUCT_ANALYSIS_V1: Omit<AnalysisPrompt, 'id' | 'createdBy' | 'createdAt'> = {
  slug: 'product-analysis',
  version: 1,
  status: 'deprecated',
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

export const PRODUCT_ANALYSIS_V2: Omit<AnalysisPrompt, 'id' | 'createdBy' | 'createdAt'> = {
  slug: 'product-analysis',
  version: 2,
  status: 'active',
  promptText: `Analyze this product image carefully. Be specific and descriptive.

## Brand Detection (CRITICAL)
Look for brand identifiers on:
- Metal plaques or badges
- Embossed or debossed text
- Tags, labels, or hang tags
- Logos or emblems

**IMPORTANT**: Read brand text CHARACTER BY CHARACTER. Do not guess or infer brand names.
- If text is partially obscured or unclear, report only the letters you can clearly see
- Report EXACTLY what is written, preserving spacing and capitalization
- If you cannot read the text clearly, leave brand empty rather than guessing

## Product Analysis
Extract product details accurately. If you cannot determine a field, use an empty string.`,
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
    },
    brand: {
      type: 'string',
      optional: true,
      description: 'Brand name EXACTLY as shown on product (read character by character, do not guess)'
    },
    brandingDetails: {
      type: 'string',
      optional: true,
      description: 'Description of where/how branding appears (e.g., "metal plaque on front", "embossed on strap")'
    },
    hasScaleReference: {
      type: 'boolean',
      description: 'True if human hand/body part or common object visible for scale comparison'
    },
    scaleDescription: {
      type: 'string',
      optional: true,
      description: 'Natural language description of scale if reference visible (e.g., "fits in palm", "hand-holdable size")'
    }
  }
};
