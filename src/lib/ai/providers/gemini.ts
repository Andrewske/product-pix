// src/lib/ai/providers/gemini.ts
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { env } from '@/lib/env';
import type { ImageProvider, ImageConfig, GenerationResponse, ConversationMessage, ImageConversationSession } from '../types';
import { normalizeUsage } from '../usage-types';

// =============================================================================
// Types
// =============================================================================

interface GenerateTextResult {
  files?: Array<{
    mediaType?: string;
    base64?: string;
  }>;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

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

const extractImageFromResponse = (
  result: GenerateTextResult,
  config: ImageConfig
): GenerationResponse => {
  // Extract image from response
  // Gemini 2.5 returns images in the files array
  const files = result.files;

  if (!files || files.length === 0) {
    return {
      success: false,
      error: 'No image generated in response',
      code: 'PROVIDER_ERROR',
      retryable: true,
    };
  }

  // Get the first image file
  const imageFile = files.find((file) => file.mediaType?.startsWith('image/'));

  if (!imageFile || !imageFile.base64) {
    return {
      success: false,
      error: 'No image data found in response',
      code: 'PROVIDER_ERROR',
      retryable: true,
    };
  }

  const dimensions = getResolutionDimensions(config.aspectRatio, config.resolution);

  // Extract base64 data (strip data URL prefix if present)
  const base64Data = imageFile.base64.includes(',')
    ? imageFile.base64.split(',')[1]
    : imageFile.base64;

  // Extract usage data if available
  const usage = result.usage ? normalizeUsage(result.usage) : undefined;

  return {
    success: true,
    imageData: base64Data,
    mimeType: imageFile.mediaType || 'image/png',
    width: dimensions.width,
    height: dimensions.height,
    usage,
  };
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

export class GeminiConversationSession implements ImageConversationSession {
  private messages: ConversationMessage[] = [];
  private model: ReturnType<typeof google>;

  constructor() {
    this.model = google(env.GEMINI_MODEL);
  }

  async initialize(
    referenceImages: Array<{ buffer: Buffer; mimeType: string; label?: string }>,
    systemContext: string
  ): Promise<void> {
    // First message: all reference images with labels + context
    // Labels help AI understand what each image shows without hard-coupling
    const imageContents = referenceImages.flatMap((img, i) => {
      const parts: Array<{ type: 'text'; text: string } | { type: 'image'; image: Buffer }> = [];
      if (img.label) {
        parts.push({ type: 'text' as const, text: `Reference image ${i + 1}: ${img.label}` });
      }
      parts.push({ type: 'image' as const, image: img.buffer });
      return parts;
    });

    this.messages = [{
      role: 'user',
      content: [
        { type: 'text', text: systemContext },
        ...imageContents,
      ],
    }];
  }

  async generateNext(prompt: string, config: ImageConfig): Promise<GenerationResponse> {
    // Build user message (don't mutate state yet)
    const userMessage: ConversationMessage = {
      role: 'user',
      content: [{ type: 'text', text: prompt }],
    };

    // Call API with current messages + new user message
    // Type assertion needed because ConversationMessage is compatible with AI SDK messages
    // but has slightly different typing constraints
    const result = await generateText({
      model: this.model,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: [...this.messages, userMessage] as any,
      providerOptions: {
        google: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: { aspectRatio: aspectRatioMap[config.aspectRatio] },
        },
      },
    });

    const response = extractImageFromResponse(result, config);

    // Only persist to history on success (immutable until committed)
    if (response.success) {
      const imageBuffer = Buffer.from(response.imageData, 'base64');
      this.messages.push(userMessage);
      this.messages.push({
        role: 'assistant',
        content: [{ type: 'image', image: imageBuffer }],
      });
    }
    // On failure: state unchanged, conversation remains valid

    return response;
  }

  getMessageCount(): number {
    return this.messages.length;
  }
}

// Separate export - does not pollute ImageProvider interface
export const createConversationSession = (): ImageConversationSession => {
  return new GeminiConversationSession();
};

export const createGeminiProvider = (): ImageProvider => {
  // Use configurable Gemini model for image generation (supports multi-modal outputs)
  const model = google(env.GEMINI_MODEL);

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
          prompt: config.rawPrompt
            ? prompt
            : `Generate a professional product photo: ${prompt}`,
        });

        return extractImageFromResponse(result, config);
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
                  text: config.rawPrompt
                    ? prompt
                    : `Transform this product photo: ${prompt}. Create a professional e-commerce image with clean background and good lighting.`,
                },
                {
                  type: 'image',
                  image: sourceImage,
                },
              ],
            },
          ],
        });

        return extractImageFromResponse(result, config);
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
