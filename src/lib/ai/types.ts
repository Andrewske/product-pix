// src/lib/ai/types.ts

/**
 * Analysis result from vision model for product images
 */
export interface ProductAnalysis {
  product: string;
  color: string;
  material: string;
  shape: string;
  features: string[];
}

export interface ImageConfig {
  aspectRatio: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';
  resolution: '1k' | '2k' | '4k';
  quality?: 'standard' | 'hd';
  /**
   * If true, use the prompt as-is without any prefixes.
   * Used by the prompt testing framework for controlled experiments.
   */
  rawPrompt?: boolean;
}

export interface GenerationResult {
  success: true;
  imageData: string; // base64
  mimeType: string;
  width: number;
  height: number;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface GenerationError {
  success: false;
  error: string;
  code: 'RATE_LIMITED' | 'CONTENT_FILTERED' | 'INVALID_INPUT' | 'PROVIDER_ERROR' | 'UNKNOWN';
  retryable: boolean;
}

export type GenerationResponse = GenerationResult | GenerationError;

export interface ImageProvider {
  name: string;

  /**
   * Generate an image from a text prompt
   */
  generateFromText(
    prompt: string,
    config: ImageConfig
  ): Promise<GenerationResponse>;

  /**
   * Transform an existing image with a prompt
   */
  generateFromImage(
    sourceImage: Buffer,
    sourceMimeType: string,
    prompt: string,
    config: ImageConfig
  ): Promise<GenerationResponse>;

  /**
   * Check if the provider is available
   */
  isAvailable(): Promise<boolean>;
}
