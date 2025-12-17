# Implement GoogleConversationSession

## Goal
Create new `GoogleConversationSession` class using official Google Gen AI SDK to handle multi-turn image generation with automatic thought signature management.

## Prerequisites
- Review research findings: `docs/linear-singing-cocoa/research-findings.md`

## Files to Modify
- `src/lib/ai/providers/gemini.ts` (add new class)

---

## Implementation Details

### Import Statement

```typescript
import { GoogleGenAI, type Chat, type Part, type GenerateContentResponse } from '@google/genai';
```

### Class Structure

```typescript
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
    // Build initial history with reference images
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

    // Create chat WITH history (SDK pattern - can't add history later)
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

    this.messageCount = 1; // Initial context counts as first message
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

    // Validate aspect ratio (Google SDK supports fewer ratios)
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
      // Send message with per-message config for aspect ratio
      const response = await this.chat.sendMessage({
        message: prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            aspectRatio: config.aspectRatio,
          },
        },
      });

      // Extract image from response
      const imageData = this.extractImageFromResponse(response);
      if (!imageData) {
        return {
          success: false,
          error: 'No image generated in response',
          code: 'PROVIDER_ERROR',
          retryable: true,
        };
      }

      // Extract usage data
      const usage = this.extractUsage(response);

      // Increment message count on success
      this.messageCount++;

      const dimensions = getResolutionDimensions(config.aspectRatio, config.resolution);

      return {
        success: true,
        imageData: imageData.base64,
        mimeType: imageData.mimeType,
        width: dimensions.width,
        height: dimensions.height,
        usage,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  getMessageCount(): number {
    return this.messageCount;
  }

  // --- Private Helper Methods ---

  private extractImageFromResponse(response: GenerateContentResponse): {
    base64: string;
    mimeType: string;
  } | null {
    for (const candidate of response.candidates || []) {
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

  private extractUsage(response: GenerateContentResponse): UsageData | undefined {
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

    // Check for ApiError with status code
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
```

---

## Key Implementation Notes

### 1. Chat Lifecycle (Critical)

The Google SDK creates the chat WITH history. You cannot create an empty chat and add history later.

```typescript
// WRONG - won't work
const chat = client.chats.create({ model: '...' });
chat.addHistory([...]); // No such method!

// CORRECT - pass history at creation
const chat = client.chats.create({
  model: '...',
  history: [{ role: 'user', parts: [...] }],
});
```

This is why:
- Constructor: Only creates the `GoogleGenAI` client
- `initialize()`: Creates the chat WITH reference images in history
- `generateNext()`: Uses the stored chat

### 2. Error Recovery Semantics

**On success**: History updated automatically by SDK.

**On failure**: The failed attempt appears in comprehensive history but NOT in curated history used for subsequent model calls. The model effectively doesn't see failed attempts.

**Caller may retry**: The same prompt can be retried after a failure.

```typescript
// SDK distinguishes curated vs comprehensive history
chat.getHistory(true);  // curated - only valid turns, used for subsequent calls
chat.getHistory(false); // comprehensive - all attempts including failures
```

### 3. Aspect Ratio Validation

Google SDK supports only: `1:1`, `3:4`, `4:3`, `9:16`, `16:9`

Our config includes unsupported ratios: `2:3`, `3:2`, `4:5`, `5:4`, `21:9`

Implementation must validate and reject unsupported ratios with clear error message.

### 4. Per-Message Config

Each `sendMessage()` call can override config (useful for different aspect ratios per angle):

```typescript
const response = await chat.sendMessage({
  message: prompt,
  config: {
    imageConfig: { aspectRatio: '16:9' }, // Per-message override
  },
});
```

### 5. Usage Data Mapping

Google SDK field names differ from our normalized format:

| Google SDK | Our Format |
|------------|------------|
| `promptTokenCount` | `promptTokens` |
| `candidatesTokenCount` | `completionTokens` |
| `totalTokenCount` | `totalTokens` |
| `thoughtsTokenCount` | (pass through) |

Use existing `normalizeUsage()` function with these field names.

---

## Unit Tests Required

Create `src/lib/ai/providers/__tests__/google-conversation-session.test.ts`:

```typescript
import { describe, it, expect, mock, beforeEach } from 'bun:test';

// Mock @google/genai
mock.module('@google/genai', () => ({
  GoogleGenAI: mock(() => ({
    chats: {
      create: mock(() => ({
        sendMessage: mock(),
        getHistory: mock(() => []),
      })),
    },
  })),
}));

describe('GoogleConversationSession', () => {
  describe('initialize', () => {
    it('creates chat with reference images in history', async () => {
      // Test that chat.create is called with correct history structure
    });

    it('includes labels as text parts before images', async () => {
      // Test label handling
    });
  });

  describe('generateNext', () => {
    it('returns error if not initialized', async () => {
      // Test initialization check
    });

    it('rejects unsupported aspect ratios', async () => {
      // Test aspect ratio validation
    });

    it('extracts image from response candidates', async () => {
      // Test image extraction
    });

    it('normalizes usage data correctly', async () => {
      // Test usage mapping
    });

    it('handles rate limit errors', async () => {
      // Test error code mapping
    });

    it('handles content filter errors', async () => {
      // Test error code mapping
    });

    it('increments message count on success only', async () => {
      // Test message counting
    });
  });
});
```

---

## Acceptance Criteria

- [ ] Class implements `ImageConversationSession` interface
- [ ] `initialize()` creates chat WITH reference images in history param
- [ ] `generateNext()` validates aspect ratio before calling API
- [ ] `generateNext()` passes per-message config for aspect ratio
- [ ] `generateNext()` extracts image from `response.candidates[].content.parts[].inlineData`
- [ ] Usage data normalized to existing `UsageData` format
- [ ] Error handling maps to correct codes: `RATE_LIMITED`, `CONTENT_FILTERED`, `INVALID_INPUT`, `PROVIDER_ERROR`
- [ ] No `any` types - use proper types from `@google/genai`
- [ ] TypeScript compiles without errors: `bunx tsc --noEmit`
- [ ] Unit tests exist with mocked SDK
- [ ] Verified: First `generateNext()` call successfully returns image data in integration test

## Dependencies

None - this is the first implementation task.
