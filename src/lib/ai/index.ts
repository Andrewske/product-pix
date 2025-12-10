// src/lib/ai/index.ts
import { createGeminiProvider } from './providers/gemini';
import type { ImageProvider } from './types';

export type { ImageProvider, ImageConfig, GenerationResponse, GenerationResult, GenerationError, ProductAnalysis } from './types';
export { analyzeProductImage } from './product-analyzer';
export { buildPromptFromTemplate, buildPromptFromTemplateSlug } from './prompt-builder';
export { generateImageTitle, getTitleFromFilename } from './title-generator';

let cachedProvider: ImageProvider | null = null;

/**
 * Get the configured image generation provider
 * Currently uses Gemini, but can be swapped via env or config
 */
export const getImageProvider = (): ImageProvider => {
  if (cachedProvider) {
    return cachedProvider;
  }

  // In the future, this could read from env to select provider
  // const providerName = process.env.IMAGE_PROVIDER || 'gemini';

  cachedProvider = createGeminiProvider();
  return cachedProvider;
};

/**
 * Clear the cached provider (useful for testing)
 */
export const clearProviderCache = (): void => {
  cachedProvider = null;
};
