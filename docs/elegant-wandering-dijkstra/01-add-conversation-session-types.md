# Add Conversation Session Types

## Files to Modify/Create
- `src/lib/ai/types.ts` (modify)

## Implementation Details

Add TypeScript interfaces for the conversation session abstraction that will enable multi-turn image generation with cumulative context.

### New Types to Add

```typescript
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: Array<
    | { type: 'text'; text: string }
    | { type: 'image'; image: Buffer }  // For user messages
    | { type: 'file'; data: Buffer; mediaType: string }  // For assistant file responses
  >;
}

export interface ImageConversationSession {
  /** Initialize with reference images. Labels (e.g., "front view", "side angle") help AI understand each image without hard-coupling to specific outputs. */
  initialize(referenceImages: Array<{ buffer: Buffer; mimeType: string; label?: string }>, systemContext: string): Promise<void>;
  generateNext(prompt: string, config: ImageConfig): Promise<GenerationResponse>;
  getMessageCount(): number;
}
```

### Interface Contracts

- `ConversationMessage`: Represents a single turn in the conversation (user or assistant), containing text and/or images
- `ImageConversationSession`:
  - `initialize()`: Sets up the session with reference images and system context
  - `generateNext()`: Generates the next image, accumulating history from previous calls
  - `getMessageCount()`: Returns current conversation length for debugging/monitoring

## Acceptance Criteria

- [ ] `ConversationMessage` interface is exported from `src/lib/ai/types.ts`
- [ ] `ImageConversationSession` interface is exported from `src/lib/ai/types.ts`
- [ ] TypeScript compiles without errors
- [ ] Existing type exports remain unchanged

## Dependencies

None - this is the foundational task.
