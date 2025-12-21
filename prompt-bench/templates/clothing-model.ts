import { type CollectionTemplate } from '@bench/core/types';

/**
 * Clothing on model templates
 * Transforms amateur clothing photos (mirror selfies, hanger shots) into professional model imagery
 */

// White Background Model Template
// Professional model on clean background (Poshmark standard)
export const clothingModelWhite: CollectionTemplate = {
  slug: 'clothing-model-white',
  type: 'collection',
  outputCount: 3,
  version: 2,
  status: 'active',
  templateData: {
    subject:
      'Professional fashion photography of {product} on a {model_type} model from {angle}',
    background: 'on pure white seamless background',
    lighting: 'soft diffused studio lighting with even fill, no harsh shadows',
    camera: 'shot on DSLR with 85mm lens f/2.8 for natural depth',
    style:
      'commercial fashion catalog photography, natural model pose, color-accurate garment reproduction',
    quality:
      '4K resolution, sharp focus on garment details, model centered in frame, single subject only, no collages or grids',
    negative:
      'amateur selfie, mirror photo, phone in shot, messy background, poor lighting, interior labels visible on exterior, inside garment tags showing on chest, care labels on outside, worst quality, blurry',
    icon: '👗',
  },
  variablesSchema: {
    product: {
      type: 'string',
      required: true,
      description: 'The clothing item description (e.g., "floral mini dress")',
    },
    model_type: {
      type: 'enum',
      required: false,
      options: ['female', 'male', 'non-binary'],
      default: 'female',
      description: 'Model type based on garment category',
    },
    angle: {
      type: 'string',
      required: false,
      description: 'Model pose/angle (e.g., "front view", "three-quarter turn")',
    },
  },
};

// Lifestyle Scene Model Template
// Model in contextual setting (lifestyle/editorial style)
export const clothingModelLifestyle: CollectionTemplate = {
  slug: 'clothing-model-lifestyle',
  type: 'collection',
  outputCount: 3,
  version: 2,
  status: 'active',
  templateData: {
    subject:
      'Lifestyle fashion photography of {product} on a {model_type} model {pose_description}',
    background: 'in a {scene_setting}',
    lighting: 'natural {lighting_style} with soft fill',
    camera: 'shot on mirrorless camera with 50mm lens f/2.0',
    style:
      'lifestyle editorial photography, natural candid moment, warm tones, {mood} atmosphere, color-accurate garment',
    quality:
      'high resolution, shallow depth of field with bokeh background, model naturally posed, single subject only, no collages or grids',
    negative:
      'amateur selfie, mirror photo, phone in shot, messy background, poor lighting, interior labels visible on exterior, inside garment tags showing on chest, care labels on outside, worst quality, blurry',
    icon: '📸',
  },
  variablesSchema: {
    product: {
      type: 'string',
      required: true,
      description: 'The clothing item description',
    },
    model_type: {
      type: 'enum',
      required: false,
      options: ['female', 'male', 'non-binary'],
      default: 'female',
    },
    scene_setting: {
      type: 'enum',
      required: false,
      options: [
        'minimalist urban street with soft bokeh',
        'cozy coffee shop interior',
        'natural outdoor setting with greenery',
        'modern minimalist interior',
        'sunlit window with natural light',
      ],
      default: 'minimalist urban street with soft bokeh',
      description: 'Background scene for lifestyle shot',
    },
    lighting_style: {
      type: 'enum',
      required: false,
      options: ['golden hour sunlight', 'soft overcast daylight', 'morning window light'],
      default: 'golden hour sunlight',
    },
    mood: {
      type: 'enum',
      required: false,
      options: ['relaxed', 'confident', 'casual', 'elegant'],
      default: 'relaxed',
    },
    pose_description: {
      type: 'string',
      required: false,
      default: 'in a natural, candid pose',
      description: 'Model pose description',
    },
  },
};
