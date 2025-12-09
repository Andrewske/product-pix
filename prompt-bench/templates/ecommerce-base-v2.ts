import { type PromptTemplate } from '@bench/core/types';

/**
 * ecommerce-base template (version 2)
 */
export const ECOMMERCE_BASE: Omit<PromptTemplate, 'id' | 'createdBy' | 'createdAt'> = {
  slug: "ecommerce-base",
  version: 2,
  status: "active",
  templateData: {
    "subject": "Professional {product_category} product photography: {product} in {color} {material}, commercial quality",
    "background": "set against {background_type} with seamless integration, ensuring product prominence and brand-appropriate presentation",
    "lighting": "Professional {lighting_style} setup with controlled soft fill light{lighting_modifier}, minimizing harsh shadows and ensuring even product illumination",
    "camera": "Professional DSLR capture with 85mm lens at f/8 for optimal depth of field{camera_modifier}, ensuring product sharpness with natural perspective",
    "style": "{style} approach with commercial studio standards, color-accurate reproduction, {composition_style}, optimized for e-commerce display",
    "quality": "Ultra-high resolution 4K output, tack-sharp focus on product details, centered composition with product occupying 80-90% of frame, commercial print quality",
    "negative": "Avoid: poor quality, blur, watermarks, text overlays, logos, blown highlights, deep shadows, color casts, tilted angles, cluttered backgrounds, amateur lighting, overexposed highlights, harsh shadows, color distortion"
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
        "lifestyle",
        "editorial",
        "hero shot"
      ],
      "default": "commercial catalog",
      "description": "Photography style approach"
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
      "description": "Product material (optional) - affects lighting selection"
    },
    "lighting_style": {
      "type": "enum",
      "required": true,
      "options": [
        "soft diffused studio",
        "high-key bright",
        "three-point",
        "rim lighting",
        "polarized studio",
        "gradient lighting"
      ],
      "default": "soft diffused studio",
      "description": "Lighting setup - polarized recommended for reflective materials"
    },
    "background_type": {
      "type": "enum",
      "required": true,
      "options": [
        "pure white seamless",
        "light gray gradient",
        "marble surface",
        "wood texture",
        "fabric texture",
        "colored seamless paper",
        "lifestyle context",
        "abstract geometric",
        "branded backdrop"
      ],
      "default": "pure white seamless",
      "description": "Background style and texture"
    },
    "camera_modifier": {
      "type": "enum",
      "required": false,
      "options": [
        "",
        ", macro lens for detail capture",
        ", tilt-shift for selective focus",
        ", wide angle for context"
      ],
      "default": "",
      "description": "Camera setup modifications for specific product needs"
    },
    "product_category": {
      "type": "enum",
      "required": true,
      "options": [
        "electronics",
        "clothing",
        "jewelry",
        "home goods",
        "beauty products",
        "reflective items",
        "transparent items",
        "small items",
        "general"
      ],
      "default": "general",
      "description": "Product category for specialized photography handling"
    },
    "composition_style": {
      "type": "enum",
      "required": true,
      "options": [
        "centered composition",
        "rule of thirds",
        "diagonal placement",
        "floating perspective"
      ],
      "default": "centered composition",
      "description": "Product placement and composition approach"
    },
    "lighting_modifier": {
      "type": "enum",
      "required": false,
      "options": [
        "",
        ", with polarizing filters for reflections",
        ", with light tent for transparency",
        ", with macro lighting setup",
        ", with fabric-optimized setup"
      ],
      "default": "",
      "description": "Specialized lighting modifications based on product type"
    }
  },
};