import { type PromptTemplate } from '@bench/core/types';

/**
 * ecommerce-base template (version 3)
 */
export const ECOMMERCE_BASE: Omit<PromptTemplate, 'id' | 'createdBy' | 'createdAt'> = {
  slug: "ecommerce-base",
  version: 3,
  status: "active",
  templateData: {
    "subject": "Professional e-commerce photo of pristine {product} in perfect condition, {color} {material}",
    "background": "on {background_type} background, perfectly white #FFFFFF with no gradients or color variations, seamless infinity curve",
    "lighting": "{lighting_style} lighting with soft fill, anti-glare positioning, minimal reflections on glossy surfaces, even illumination eliminating harsh shadows",
    "camera": "shot on DSLR with 85mm lens, optimal aperture for product depth, focus stacking if needed",
    "style": "{style} photography, color-accurate",
    "quality": "4K resolution, tack sharp focus, product centered filling 85% of frame, subtle drop shadow for dimensionality",
    "negative": "worst quality, blurry, watermark, text overlay, logo overlay, harsh shadows, color cast, reflections, glare, damaged product"
  },
  variablesSchema: {
    "color": {
      "type": "string",
      "required": false,
      "default": "",
      "description": "Product color (optional)"
    },
    "style": {
      "type": "enum",
      "required": true,
      "options": [
        "commercial catalog",
        "luxury advertising",
        "minimalist"
      ],
      "default": "commercial catalog",
      "description": "Photography style"
    },
    "product": {
      "type": "string",
      "required": true,
      "description": "The product name/description"
    },
    "material": {
      "type": "string",
      "required": false,
      "default": "",
      "description": "Product material (optional)"
    },
    "lighting_style": {
      "type": "enum",
      "required": true,
      "options": [
        "soft diffused studio",
        "high-key bright",
        "three-point"
      ],
      "default": "soft diffused studio",
      "description": "Lighting setup"
    },
    "background_type": {
      "type": "enum",
      "required": true,
      "options": [
        "pure white seamless",
        "light gray gradient",
        "marble surface"
      ],
      "default": "pure white seamless",
      "description": "Background style"
    }
  },
};