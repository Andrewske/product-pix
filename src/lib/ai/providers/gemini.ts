// src/lib/ai/providers/gemini.ts
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import type { ImageProvider, ImageConfig, GenerationResponse } from '../types';

// Map our config to Gemini's expected values
const aspectRatioMap: Record<ImageConfig['aspectRatio'], string> = {
  '1:1': '1:1',
  '2:3': '2:3',
  '3:2': '3:2',
  '3:4': '3:4',
  '4:3': '4:3',
  '4:5': '4:5',
  '5:4': '5:4',
  '9:16': '9:16',
  '16:9': '16:9',
  '21:9': '21:9',
};

const getResolutionDimensions = (
  aspectRatio: ImageConfig['aspectRatio'],
  resolution: ImageConfig['resolution']
): { width: number; height: number } => {
  const baseSize = resolution === '4k' ? 4096 : resolution === '2k' ? 2048 : 1024;

  const [w, h] = aspectRatio.split(':').map(Number);
  const ratio = w / h;

  if (ratio >= 1) {
    return { width: baseSize, height: Math.round(baseSize / ratio) };
  } else {
    return { width: Math.round(baseSize * ratio), height: baseSize };
  }
};

const handleError = (error: unknown): GenerationResponse => {
  const message = error instanceof Error ? error.message : 'Unknown error';

  // Check for rate limiting
  if (message.includes('429') || message.includes('rate')) {
    return {
      success: false,
      error: 'Rate limit exceeded. Please try again later.',
      code: 'RATE_LIMITED',
      retryable: true,
    };
  }

  // Check for content filtering
  if (message.includes('safety') || message.includes('blocked') || message.includes('policy')) {
    return {
      success: false,
      error: 'Content was filtered by safety policies.',
      code: 'CONTENT_FILTERED',
      retryable: false,
    };
  }

  // Check for invalid input
  if (message.includes('invalid') || message.includes('unsupported')) {
    return {
      success: false,
      error: 'Invalid input provided.',
      code: 'INVALID_INPUT',
      retryable: false,
    };
  }

  return {
    success: false,
    error: message,
    code: 'PROVIDER_ERROR',
    retryable: true,
  };
};

export const createGeminiProvider = (): ImageProvider => {
  // Use the correct model ID for image generation
  const model = google('gemini-2.0-flash-exp'); // Will switch to gemini-3-pro-image-preview when available

  return {
    name: 'gemini',

    async generateFromText(prompt: string, config: ImageConfig): Promise<GenerationResponse> {
      try {
        const result = await generateText({
          model,
          providerOptions: {
            google: {
              responseModalities: ['TEXT', 'IMAGE'],
              imageConfig: {
                aspectRatio: aspectRatioMap[config.aspectRatio],
              },
            },
          },
          prompt: `Generate a professional product photo: ${prompt}`,
        });

        // Extract image from response
        // Gemini image generation returns image data in the response
        // For now, we'll return a placeholder until we test the actual API response
        const dimensions = getResolutionDimensions(config.aspectRatio, config.resolution);

        // TODO: Update this once we test the actual Gemini image response format
        return {
          success: false,
          error: 'Image generation not yet fully implemented - awaiting Gemini 3 Pro Image API access',
          code: 'PROVIDER_ERROR',
          retryable: true,
        };
      } catch (error) {
        return handleError(error);
      }
    },

    async generateFromImage(
      sourceImage: Buffer,
      sourceMimeType: string,
      prompt: string,
      config: ImageConfig
    ): Promise<GenerationResponse> {
      try {
        const result = await generateText({
          model,
          providerOptions: {
            google: {
              responseModalities: ['TEXT', 'IMAGE'],
              imageConfig: {
                aspectRatio: aspectRatioMap[config.aspectRatio],
              },
            },
          },
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Transform this product photo: ${prompt}. Create a professional e-commerce image with clean background and good lighting.`,
                },
                {
                  type: 'image',
                  image: sourceImage,
                },
              ],
            },
          ],
        });

        // Extract image from response
        // TODO: Update this once we test the actual Gemini image response format
        const dimensions = getResolutionDimensions(config.aspectRatio, config.resolution);

        return {
          success: false,
          error: 'Image generation not yet fully implemented - awaiting Gemini 3 Pro Image API access',
          code: 'PROVIDER_ERROR',
          retryable: true,
        };
      } catch (error) {
        return handleError(error);
      }
    },

    async isAvailable(): Promise<boolean> {
      try {
        // Simple test call to check availability
        const result = await generateText({
          model,
          prompt: 'Say "ok"',
        });
        return !!result.text;
      } catch {
        return false;
      }
    },
  };
};
