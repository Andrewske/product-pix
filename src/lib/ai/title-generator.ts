// src/lib/ai/title-generator.ts

import type { ProductAnalysis } from './types';

/**
 * Slugify a string for use in titles
 * - Converts to lowercase
 * - Replaces spaces and special chars with hyphens
 * - Removes consecutive hyphens
 * - Trims hyphens from start/end
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Trim hyphens from start and end
}

/**
 * Generate a descriptive title from product analysis
 * Combines product, color, and material fields into a slugified title
 * Example: "ceramic-coffee-mug-matte-black-ceramic"
 */
export function generateImageTitle(analysis: ProductAnalysis): string {
  const parts: string[] = [];

  // Add product (required field)
  if (analysis.product.trim()) {
    parts.push(slugify(analysis.product));
  } else {
    // If product is empty, return fallback immediately
    return 'untitled-product';
  }

  // Add color if present
  if (analysis.color.trim()) {
    parts.push(slugify(analysis.color));
  }

  // Add material if present
  if (analysis.material.trim()) {
    parts.push(slugify(analysis.material));
  }

  return parts.join('-');
}

/**
 * Extract title from filename, removing extension
 * Example: "product-shot-v2.jpg" → "product-shot-v2"
 */
export function getTitleFromFilename(filename: string): string {
  // Handle empty input
  if (!filename.trim()) {
    return 'untitled';
  }

  // Remove file extension by taking everything before the last dot
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return filename.trim(); // No extension found
  }

  const title = filename.substring(0, lastDotIndex).trim();

  // If title is empty after removing extension, return a fallback
  return title || 'untitled';
}