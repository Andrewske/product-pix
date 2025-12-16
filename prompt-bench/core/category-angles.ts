import type { ProductCategory } from '@bench/core/types';

/**
 * Research-backed angle mappings for e-commerce photography
 * Based on best practices from Amazon, Shopify, Etsy, and eBay guidelines
 */
export const CATEGORY_ANGLES: Record<ProductCategory, string[]> = {
  apparel: [
    'front-on-model',      // Primary listing view
    '45-degree',           // Shows fit and drape
    'back',                // Back detail
    'detail-fabric',       // Texture/material close-up
    'flat-lay'             // Alternative clean view
  ],
  footwear: [
    '45-degree-left',      // Amazon standard main image
    'side-profile',        // Full side view
    'top-down',            // Toe shape and top
    'back-heel',           // Heel and back detail
    'outsole'              // Bottom tread (high return reducer)
  ],
  electronics: [
    'front-screen',        // Primary interface/screen
    '45-degree',           // Dimensional view
    'back-ports',          // Ports and connectivity
    'side-buttons',        // Side controls
    'detail-interface'     // Close-up of key feature
  ],
  furniture: [
    'front',               // Primary hero
    '45-degree',           // Shows depth
    'room-context',        // Lifestyle in setting
    'detail-material',     // Wood/fabric close-up
    'scale-reference'      // Size context
  ],
  beauty: [
    'front-label',         // Primary pack shot
    '45-degree',           // Dimensional view
    'back-ingredients',    // Ingredients/usage
    'texture-swatch',      // Product texture
    'lifestyle'            // In-use context
  ],
  food: [
    'front-label',         // Primary pack shot
    '45-degree',           // Angled view
    'back-nutrition',      // Nutrition facts
    'inside-texture',      // Product inside
    'serving-lifestyle'    // Prepared/serving context
  ],
  tools: [
    'front',               // Primary profile
    '45-degree',           // Dimensional view
    'working-end-detail',  // Bit/blade/head close-up
    'in-use',              // Action shot on material
    'scale-in-hand'        // Size reference
  ],
  jewelry: [
    'top-down',            // Editorial flat view
    '45-degree',           // Shows sparkle and dimension
    'profile',             // Band thickness/side view
    'macro-detail',        // Gemstone/engraving close-up
    'worn-scale'           // On model for size context
  ],
  generic: [
    'front',               // Primary hero
    '45-degree',           // Most versatile angle
    'back',                // Secondary view
    'detail',              // Close-up of key feature
    'scale'                // Size reference
  ]
};

/**
 * Get the recommended angles for a product category
 */
export function getAnglesForCategory(category: ProductCategory): string[] {
  return CATEGORY_ANGLES[category];
}