import { type PromptTemplate } from '@bench/core/types';

/**
 * ecommerce-base template (version 1)
 */
export const ECOMMERCE_BASE: Omit<PromptTemplate, 'id' | 'createdBy' | 'createdAt'> = {
  slug: "ecommerce-base",
  version: 1,
  status: "active",
  templateData: {
    "subject": "Professional e-commerce photo of {product}{color ? `, ${color}` : ''}{material ? ` ${material}` : ''}",
    "background": "on {background_type} background",
    "lighting": "{lighting_style} lighting with soft fill{material === 'glass' || material === 'metal' ? ', polarized to reduce reflections' : ''}{material === 'fabric' || material === 'leather' ? ', enhanced contrast for texture detail' : ''}",
    "camera": "shot on DSLR with 85mm lens f/8, {framing_guide}",
    "style": "{style} photography, color-accurate",
    "quality": "4K resolution, sharp focus, even lighting, optimal exposure",
    "negative": "worst quality, blurry, watermark, text, logo, harsh shadows, color cast, uneven lighting, cluttered composition, overexposed highlights, muddy shadows"
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
        "minimalist",
        "lifestyle context",
        "editorial",
        "technical documentation"
      ],
      "default": "commercial catalog",
      "description": "Photography style - choose based on brand positioning and target audience"
    },
    "product": {
      "type": "string",
      "required": true,
      "description": "The product name/description - be specific for better results"
    },
    "material": {
      "type": "string",
      "required": false,
      "default": "",
      "description": "Product material (optional) - helps optimize lighting automatically (e.g., glass, metal, fabric, leather, plastic)"
    },
    "lighting_style": {
      "type": "enum",
      "required": true,
      "options": [
        "soft diffused studio",
        "high-key bright",
        "three-point",
        "rim lighting",
        "natural window"
      ],
      "default": "soft diffused studio",
      "description": "Lighting setup - will be automatically adjusted for material properties"
    },
    "background_type": {
      "type": "enum",
      "required": true,
      "options": [
        "pure white seamless",
        "light gray gradient",
        "marble surface",
        "natural wood",
        "textured paper"
      ],
      "default": "pure white seamless",
      "description": "Background style - choose based on product and brand aesthetic"
    },
    "framing_guide": {
      "type": "enum",
      "required": true,
      "options": [
        "product centered filling 85% of frame",
        "product centered filling 70% of frame with generous white space",
        "product centered filling 60% of frame for tall/vertical items",
        "product centered filling 90% of frame for small detailed items"
      ],
      "default": "product centered filling 85% of frame",
      "description": "Framing guidance based on product type and composition needs"
    }
  },
};