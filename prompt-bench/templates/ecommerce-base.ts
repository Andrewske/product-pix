import { type PromptTemplate } from '@bench/core/types';

/**
 * Base e-commerce product photography template
 */
export const ECOMMERCE_BASE: Omit<PromptTemplate, 'id' | 'createdBy' | 'createdAt'> = {
  slug: 'ecommerce-base',
  version: 4,
  status: 'active',
  templateData: {
    subject: 'Professional e-commerce photo of {product}, {color} {material}',
    background: 'on pure white seamless background',
    lighting: 'soft diffused studio lighting with soft fill',
    camera: 'shot on DSLR with 85mm lens f/8',
    style: 'commercial catalog photography, color-accurate',
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
  },
};
