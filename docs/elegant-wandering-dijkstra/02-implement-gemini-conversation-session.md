# Implement GeminiConversationSession

## Files to Modify/Create
- `src/lib/ai/providers/gemini.ts` (modify)

## Implementation Details

Create the `GeminiConversationSession` class that maintains a `messages[]` array across multiple generation calls. This enables the AI to see all reference images and previously generated images when creating each new angle.

### Class Implementation

```typescript
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
    const result = await generateText({
      model: this.model,
      messages: [...this.messages, userMessage],
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
        content: [{ type: 'file', data: imageBuffer, mediaType: response.mimeType }],
      });
    }
    // On failure: state unchanged, conversation remains valid

    return response;
  }

  getMessageCount(): number {
    return this.messages.length;
  }
}
```

### Separate Factory Function

Export a standalone factory function (keeps provider interface clean, experimental feature isolated):

```typescript
// Separate export - does not pollute ImageProvider interface
export const createConversationSession = (): ImageConversationSession => {
  return new GeminiConversationSession();
};

// createGeminiProvider() remains unchanged
```

### Key Behaviors

1. **Initialization**: First turn sends all reference images with context prompt
2. **Optimized history**: Each `generateNext()` appends only the generated image to history (reference images are NOT re-sent, reducing token cost from O(n²) to O(n))
3. **Assistant responses**: Generated images are added to history so subsequent calls see them and can produce diverse outputs
4. **Error handling**: If generation fails, roll back the user message to maintain valid conversation structure (see error handling section)

## Acceptance Criteria

- [ ] `GeminiConversationSession` class is exported from `src/lib/ai/providers/gemini.ts`
- [ ] Class implements `ImageConversationSession` interface
- [ ] `createConversationSession()` factory function is exported separately
- [ ] `createGeminiProvider()` remains unchanged (no interface pollution)
- [ ] Existing `generateFromText` and `generateFromImage` methods remain unchanged
- [ ] TypeScript compiles without errors

## Dependencies

- Task 01: Types must be defined first
