import { type PromptTemplate } from '../types';

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
