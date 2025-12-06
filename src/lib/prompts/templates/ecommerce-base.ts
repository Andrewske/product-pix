import { type PromptTemplate } from '../types';

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
