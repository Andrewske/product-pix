import { type CollectionTemplate } from '@bench/core/types';

/**
 * Multi-angle collection template with category-based variety strategies
 */

// Strategy A: Category-based angles (RECOMMENDED)
// Detects product category, then uses research-backed angles for that category
export const multiAngleCategoryBased: CollectionTemplate = {
  slug: 'multi-angle-category-based',
  type: 'collection',
  outputCount: 5,
  varietyStrategy: 'category-based',
  version: 1,
  status: 'active',
  templateData: {
    subject: 'Professional e-commerce photo of {product} from {angle} view',
    background: 'on pure white seamless background',
    lighting: 'soft diffused studio lighting with soft fill',
    camera: 'shot on DSLR with 85mm lens f/8',
    style: 'commercial catalog photography, color-accurate',
    quality: '4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids',
    negative: 'worst quality, blurry, watermark, text, logo',
    icon: '📦',
  },
  variablesSchema: {
    product: {
      type: 'string',
      required: true,
      description: 'The product name/description',
    },
    angle: {
      type: 'string',
      required: true,
      description: 'The camera angle/viewpoint (injected from category angles)',
    },
  },
};

// Strategy B: AI-decided
// No angle guidance - let AI choose all angles
export const multiAngleAiDecided: CollectionTemplate = {
  slug: 'multi-angle-ai-decided',
  type: 'collection',
  outputCount: 5,
  varietyStrategy: 'ai-decided',
  version: 1,
  status: 'active',
  templateData: {
    subject: 'Generate a unique angle of {product} for e-commerce. Create diverse, professional angles showing the product from different perspectives.',
    background: 'on pure white seamless background',
    lighting: 'soft diffused studio lighting with soft fill',
    camera: 'shot on DSLR with 85mm lens f/8',
    style: 'commercial catalog photography, color-accurate',
    quality: '4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids',
    negative: 'worst quality, blurry, watermark, text, logo',
    icon: '🎯',
  },
  variablesSchema: {
    product: {
      type: 'string',
      required: true,
      description: 'The product name/description',
    },
  },
};

// Strategy C: Hybrid
// Uses first 2 angles from category, AI decides remaining 3
export const multiAngleHybrid: CollectionTemplate = {
  slug: 'multi-angle-hybrid',
  type: 'collection',
  outputCount: 5,
  varietyStrategy: 'hybrid',
  version: 1,
  status: 'active',
  templateData: {
    subject: 'Professional photo of {product}. Required: {angle}. For remaining images, choose creative angles appropriate for this product type.',
    background: 'on pure white seamless background',
    lighting: 'soft diffused studio lighting with soft fill',
    camera: 'shot on DSLR with 85mm lens f/8',
    style: 'commercial catalog photography, color-accurate',
    quality: '4K resolution, sharp focus, product centered filling 85% of frame, single product view only, no collages or grids',
    negative: 'worst quality, blurry, watermark, text, logo',
    icon: '🔄',
  },
  variablesSchema: {
    product: {
      type: 'string',
      required: true,
      description: 'The product name/description',
    },
    angle: {
      type: 'string',
      required: false,
      description: 'The camera angle/viewpoint (used for first 2 images, optional for rest)',
    },
  },
};