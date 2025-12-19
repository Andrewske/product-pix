// src/lib/ai/providers/gemini.ts
import { google } from '@ai-sdk/google';
import { generateText, convertToModelMessages } from 'ai';
import { GoogleGenAI, type Chat, type Part, type GenerateContentResponse, type GenerateContentConfig } from '@google/genai';
import { env } from '@/lib/env';
import type { ImageProvider, ImageConfig, GenerationResponse, ConversationMessage, ImageConversationSession } from '../types';
import { normalizeUsage } from '../usage-types';
import { logger } from '@bench/core/logger';

// =============================================================================
// Types
// =============================================================================

interface GenerateTextResult {
  text?: string;
  files?: Array<{
    mediaType?: string;
    base64?: string;
  }>;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

interface GeminiPart {
  thought?: boolean;
  text?: string;
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
  result: unknown,
  config: ImageConfig
): GenerationResponse => {
  // Type cast to access properties
  const response = result as GenerateTextResult;

  // Extract image from response
  // Gemini 2.5 returns images in the files array
  const files = response.files;

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

  // Extract usage data if available
  const usage = response.usage ? normalizeUsage(response.usage) : undefined;

      return {
        success: true,
        imageData: imageFile.base64,
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
/**
 * @deprecated Use GoogleConversationSession for multi-turn conversations.
 *
 * This class remains for reference but is not used in production due to
 * AI SDK v6 beta limitation with thought signatures for image parts.
 *
 * @see https://github.com/vercel/ai/issues/10441
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
    // Note: This implementation attempts to preserve providerMetadata but
    // AI SDK v6 beta does not return thought signatures for image parts.
    // See GoogleConversationSession for working implementation.

    // Build user message (don't mutate state yet)
    const userMessage: ConversationMessage = {
      role: 'user',
      content: [{ type: 'text', text: prompt }],
    };

    // Convert conversation messages to UIMessage format for AI SDK
    const uiMessages: any = [...this.messages, userMessage].map((msg, index) => ({
      id: `msg-${index}`,
      role: msg.role,
      parts: msg.content.map((part: any) => {
        if (part.type === 'text') {
          return { type: 'text', text: part.text };
        } else if (part.type === 'image') {
          const filePart: any = {
            type: 'file',
            mediaType: 'image/png',
            url: `data:image/png;base64,${part.image.toString('base64')}`,
          };
          // Preserve provider metadata (thought signatures) if present
          if (part.providerMetadata) {
            filePart.providerMetadata = part.providerMetadata;
          }
          return filePart;
        } else if (part.type === 'file') {
          const filePart: any = {
            type: 'file',
            mediaType: part.mediaType,
            url: `data:${part.mediaType};base64,${part.data.toString('base64')}`,
          };
          // Preserve provider metadata if present
          if (part.providerMetadata) {
            filePart.providerMetadata = part.providerMetadata;
          }
          return filePart;
        }
        throw new Error(`Unsupported content type: ${part.type}`);
      }),
    }));

    // Use AI SDK's convertToModelMessages (async in v6)
    const modelMessages = await convertToModelMessages(uiMessages);

    // Call API with converted messages
    const result = await generateText({
      model: this.model,
      messages: modelMessages,
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
      // Fallback if no messages in result (shouldn't happen)
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
/* eslint-enable @typescript-eslint/no-explicit-any */

export class GoogleConversationSession implements ImageConversationSession {
  private client: GoogleGenAI;
  private chat: Chat | null = null;
  private messageCount = 0;

  constructor() {
    this.client = new GoogleGenAI({ apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY });
  }

  async initialize(
    referenceImages: Array<{ buffer: Buffer; mimeType: string; label?: string }>,
    systemContext: string
  ): Promise<void> {
    const imageParts = referenceImages.flatMap((img, i): Part[] => {
      const parts: Part[] = [];
      if (img.label) {
        parts.push({ text: `Reference image ${i + 1}: ${img.label}` });
      }
      parts.push({
        inlineData: {
          data: img.buffer.toString('base64'),
          mimeType: img.mimeType,
        },
      });
      return parts;
    });

    this.chat = this.client.chats.create({
      model: env.GEMINI_MODEL,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
      history: [
        {
          role: 'user',
          parts: [{ text: systemContext }, ...imageParts],
        },
      ],
    });

    this.messageCount = 1;

    logger.debug('GoogleConversationSession initialized', {
      referenceImageCount: referenceImages.length,
      model: env.GEMINI_MODEL,
    });
  }

  async generateNext(prompt: string, config: ImageConfig): Promise<GenerationResponse> {
    if (!this.chat) {
      return {
        success: false,
        error: 'Session not initialized. Call initialize() first.',
        code: 'INVALID_INPUT',
        retryable: false,
      };
    }

    const supportedRatios = ['1:1', '3:4', '4:3', '9:16', '16:9'];
    if (!supportedRatios.includes(config.aspectRatio)) {
      return {
        success: false,
        error: `Unsupported aspect ratio: ${config.aspectRatio}. Supported: ${supportedRatios.join(', ')}`,
        code: 'INVALID_INPUT',
        retryable: false,
      };
    }

    try {
      const response = await this.chat.sendMessage({
        message: prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            aspectRatio: config.aspectRatio,
          },
          thinkingConfig: {
            includeThoughts: true,
          },
        } as GenerateContentConfig,
      });

      const imageData = this.extractImageFromResponse(response);
      if (!imageData) {
        return {
          success: false,
          error: 'No image generated in response',
          code: 'PROVIDER_ERROR',
          retryable: true,
        };
      }

      const usage = this.extractUsage(response);
      const thinking = this.extractThinking(response);

      this.messageCount++;

      const dimensions = getResolutionDimensions(config.aspectRatio, config.resolution);

      logger.debug('GoogleConversationSession generated image', {
        messageCount: this.messageCount,
        aspectRatio: config.aspectRatio,
        hasUsage: !!usage,
        hasThinking: !!thinking,
      });

      return {
        success: true,
        imageData: imageData.base64,
        mimeType: imageData.mimeType,
        width: dimensions.width,
        height: dimensions.height,
        usage,
      };
    } catch (error) {
      logger.debug('GoogleConversationSession generation failed', {
        messageCount: this.messageCount,
        errorCode: (error as { status?: number }).status,
      });
      return this.handleError(error);
    }
  }

  getMessageCount(): number {
    return this.messageCount;
  }

  private extractImageFromResponse(response: GenerateContentResponse): {
    base64: string;
    mimeType: string;
  } | null {
    for (const candidate of response.candidates || []) {
      if (!candidate.content?.parts) continue;
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          return {
            base64: part.inlineData.data,
            mimeType: part.inlineData.mimeType || 'image/png',
          };
        }
      }
    }
    return null;
  }

  private extractThinking(response: GenerateContentResponse): string | undefined {
    // Extract all thinking text from parts marked with thought: true
    const thinkingTexts: string[] = [];

    for (const candidate of response.candidates || []) {
      if (!candidate.content?.parts) continue;
      for (const part of candidate.content.parts) {
        // Gemini marks thinking parts with thought: true
        const geminiPart = part as GeminiPart;
        if (geminiPart.thought === true && geminiPart.text) {
          thinkingTexts.push(geminiPart.text);
        }
      }
    }

    return thinkingTexts.length > 0 ? thinkingTexts.join('\n\n') : undefined;
  }

  private extractUsage(response: GenerateContentResponse): {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | undefined {
    const m = response.usageMetadata;
    if (!m) return undefined;

    return normalizeUsage({
      promptTokenCount: m.promptTokenCount,
      candidatesTokenCount: m.candidatesTokenCount,
      totalTokenCount: m.totalTokenCount,
      thoughtsTokenCount: m.thoughtsTokenCount,
    });
  }

  private handleError(error: unknown): GenerationResponse {
    const message = error instanceof Error ? error.message : 'Unknown error';

    const status = (error as { status?: number }).status;

    if (status === 429 || message.includes('rate')) {
      return {
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMITED',
        retryable: true,
      };
    }

    if (message.includes('safety') || message.includes('blocked') || message.includes('policy')) {
      return {
        success: false,
        error: 'Content was filtered by safety policies.',
        code: 'CONTENT_FILTERED',
        retryable: false,
      };
    }

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
  }
}

/**
 * Creates a conversation session for multi-turn image generation.
 *
 * Uses Google Gen AI SDK for automatic thought signature handling.
 * AI SDK v6 beta does not properly preserve thought signatures for
 * multi-turn image generation.
 *
 * @see https://github.com/vercel/ai/issues/10441
 */
export const createConversationSession = (): ImageConversationSession => {
  return new GoogleConversationSession();
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
