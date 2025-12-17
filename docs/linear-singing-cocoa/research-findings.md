# Google Gen AI SDK Research Findings

## Summary

The `@google/genai` SDK provides a native chat API (`ai.chats`) for multi-turn conversations. The current implementation uses `@ai-sdk/google` wrapper instead of the native SDK - this research documents the native SDK patterns.

## 1. Chat/Conversation API

### Chat Session Initialization

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const chat = ai.chats.create({
  model: 'gemini-2.5-flash',
  config: {
    temperature: 0.7,
    maxOutputTokens: 1024,
    // For image generation responses:
    responseModalities: ['TEXT', 'IMAGE'],
  },
  history: [] // Optional: pre-populate conversation
});
```

### Sending Messages

```typescript
// Synchronous (wait for full response)
const response = await chat.sendMessage({ message: 'Generate a product photo' });

// Streaming (process chunks as generated)
const stream = await chat.sendMessageStream({ message: 'Generate a product photo' });
for await (const chunk of stream) {
  console.log(chunk.text);
}
```

### Getting Conversation History

```typescript
const history = chat.getHistory();
// Returns Content[] with role ('user' | 'model') and parts array
```

## 2. Multi-Turn Image Generation

### Passing Reference Images in Initial Context

Images are passed as `Part` objects with `inlineData`:

```typescript
import { GoogleGenAI, Part } from '@google/genai';

function imageBufferToPart(buffer: Buffer, mimeType: string): Part {
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType
    }
  };
}

// Initialize chat with reference images
const chat = ai.chats.create({
  model: 'gemini-2.5-flash',
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
  },
  history: [
    {
      role: 'user',
      parts: [
        { text: 'Here are reference images for product photography:' },
        { text: 'Reference 1: Front view of product' },
        imageBufferToPart(frontViewBuffer, 'image/png'),
        { text: 'Reference 2: Side view of product' },
        imageBufferToPart(sideViewBuffer, 'image/png'),
      ]
    }
  ]
});
```

### Requesting Image Generation in Responses

Two approaches:

**A. Using generateContent with responseModalities (recommended for single-shot)**:
```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash-image', // or gemini-2.5-flash with image capability
  contents: [imagePart, 'Transform this product photo'],
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
    imageConfig: {
      aspectRatio: '16:9'
    }
  }
});
```

**B. Using chat.sendMessage for multi-turn**:
```typescript
const response = await chat.sendMessage({
  message: 'Generate a studio shot with white background'
});
// Response may contain text and/or image parts
```

### Extracting Images from Chat Responses

```typescript
// Response structure
interface GenerateContentResponse {
  candidates?: Candidate[];
  text?: string;  // Convenience getter
  usageMetadata?: GenerateContentResponseUsageMetadata;
}

// Extract image from response
for (const candidate of response.candidates || []) {
  for (const part of candidate.content.parts) {
    if (part.text) {
      console.log('Text:', part.text);
    } else if (part.inlineData) {
      // Image data
      const base64Image = part.inlineData.data;
      const mimeType = part.inlineData.mimeType;
      const buffer = Buffer.from(base64Image, 'base64');
    }
  }
}
```

## 3. Configuration Mapping

### Aspect Ratio

Supported values for `imageConfig.aspectRatio`:
- `"1:1"` (square)
- `"3:4"`, `"4:3"`
- `"9:16"`, `"16:9"` (portrait/landscape)

```typescript
config: {
  imageConfig: {
    aspectRatio: '16:9'
  }
}
```

### Response Modalities

```typescript
config: {
  responseModalities: ['TEXT', 'IMAGE']  // Request both text and image
}
```

### Model Selection

```typescript
// Use environment variable
const chat = ai.chats.create({
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
});
```

## 4. Response Handling

### Response Structure

```typescript
interface GenerateContentResponse {
  candidates?: Candidate[];
  promptFeedback?: GenerateContentResponsePromptFeedback;
  usageMetadata?: GenerateContentResponseUsageMetadata;

  // Convenience getters
  text?: string;           // Concatenated text from first candidate
  functionCalls?: FunctionCall[];
}

interface Candidate {
  content: Content;
  finishReason?: string;
  safetyRatings?: SafetyRating[];
}

interface Content {
  role: 'user' | 'model';
  parts: Part[];
}

interface Part {
  text?: string;
  inlineData?: {
    data: string;      // Base64 encoded
    mimeType: string;  // e.g., 'image/png'
  };
}
```

### Usage/Cost Data

```typescript
interface GenerateContentResponseUsageMetadata {
  promptTokenCount?: number;        // Tokens in input
  candidatesTokenCount?: number;    // Tokens in output
  totalTokenCount?: number;         // Total
  thoughtsTokenCount?: number;      // Thinking tokens (Gemini 2.5+)
  cachedContentTokenCount?: number; // Cached tokens

  // Modality breakdowns
  promptTokensDetails?: ModalityTokenCount[];
  candidatesTokensDetails?: ModalityTokenCount[];
}

// Accessing usage data
const usage = response.usageMetadata;
console.log(`Input: ${usage?.promptTokenCount}, Output: ${usage?.candidatesTokenCount}`);
console.log(`Thinking: ${usage?.thoughtsTokenCount}`);
```

### Thought Signatures

Gemini 2.5+ returns thought signatures automatically when thinking is enabled. These are encrypted representations of the model's reasoning that must be passed back in multi-turn conversations.

**Important**: The SDK handles thought signatures automatically within the chat session. When using `ai.chats`, the history management preserves these signatures. When manually managing history, return ALL parts from responses back to the model.

## 5. Error Handling

### Error Class

```typescript
import { ApiError } from '@google/genai';

try {
  const response = await ai.models.generateContent({...});
} catch (error) {
  if (error instanceof ApiError) {
    console.error('Status:', error.status);   // HTTP status code
    console.error('Message:', error.message); // Error message
    console.error('Name:', error.name);       // Error name
  }
}
```

### Error Patterns

| Error Type | Detection Pattern | Retryable |
|------------|------------------|-----------|
| Rate limiting | `error.status === 429` or message contains 'rate' | Yes |
| Content filtering | message contains 'safety', 'blocked', 'policy' | No |
| Invalid input | message contains 'invalid', 'unsupported' | No |
| Network/timeout | Network errors | Yes |

```typescript
const handleError = (error: unknown): { code: string; retryable: boolean } => {
  const message = error instanceof Error ? error.message : '';
  const status = error instanceof ApiError ? error.status : 0;

  if (status === 429 || message.includes('rate')) {
    return { code: 'RATE_LIMITED', retryable: true };
  }
  if (message.includes('safety') || message.includes('blocked')) {
    return { code: 'CONTENT_FILTERED', retryable: false };
  }
  if (message.includes('invalid') || message.includes('unsupported')) {
    return { code: 'INVALID_INPUT', retryable: false };
  }
  return { code: 'PROVIDER_ERROR', retryable: true };
};
```

## Implementation Notes

### Constructor Pattern

```typescript
import { GoogleGenAI } from '@google/genai';

// With API key (Gemini Developer API)
const ai = new GoogleGenAI({ apiKey: 'GEMINI_API_KEY' });

// With Vertex AI
const ai = new GoogleGenAI({
  vertexai: true,
  project: 'your_project',
  location: 'us-central1'
});

// With environment variables (auto-detected)
const ai = new GoogleGenAI();
```

### Chat Initialization Signature

```typescript
interface CreateChatParameters {
  model: string;                      // Required
  config?: GenerateContentConfig;     // Optional generation config
  history?: Content[];                // Optional initial history
}

const chat = ai.chats.create(params);
```

### Message Sending Signature

```typescript
interface SendMessageParameters {
  message: string | Part | Part[];    // Text or parts
  config?: GenerateContentConfig;     // Per-message override
}

const response = await chat.sendMessage(params);
```

### Image Extraction

```typescript
function extractImageFromResponse(response: GenerateContentResponse): {
  base64: string;
  mimeType: string;
} | null {
  for (const candidate of response.candidates || []) {
    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) {
        return {
          base64: part.inlineData.data,
          mimeType: part.inlineData.mimeType || 'image/png'
        };
      }
    }
  }
  return null;
}
```

### Usage Data Structure

```typescript
function extractUsage(response: GenerateContentResponse) {
  const m = response.usageMetadata;
  return {
    promptTokens: m?.promptTokenCount ?? 0,
    completionTokens: m?.candidatesTokenCount ?? 0,
    totalTokens: m?.totalTokenCount ?? 0,
    thoughtsTokens: m?.thoughtsTokenCount,  // Gemini 2.5+ only
  };
}
```

## Success Criteria Checklist

- [x] Understand chat session lifecycle: `ai.chats.create()` → `chat.sendMessage()` → `response.candidates`
- [x] Know how to pass reference images with labels: Use `Part` objects with `inlineData` + text labels in history
- [x] Know how to request image generation: Set `responseModalities: ['TEXT', 'IMAGE']` in config
- [x] Know how to extract base64 image data: `response.candidates[0].content.parts[i].inlineData.data`
- [x] Know how to access usage metadata: `response.usageMetadata.{promptTokenCount, candidatesTokenCount, thoughtsTokenCount}`
- [x] Identified error types: ApiError with status codes, pattern matching on messages

## Key Differences: Native SDK vs AI SDK Wrapper

| Feature | Native `@google/genai` | `@ai-sdk/google` wrapper |
|---------|----------------------|-------------------------|
| Chat API | `ai.chats.create()` | Manual message array |
| History | Automatic management | Manual via `convertToModelMessages` |
| Image parts | `inlineData.data` (base64) | `image` property (Buffer) |
| Response images | `part.inlineData` | `result.files` array |
| Thought signatures | Automatic in chat | Manual via `providerMetadata` |
| Config location | `config.responseModalities` | `providerOptions.google.responseModalities` |

## Recommendation

For multi-angle generation with conversation history, consider:
1. **Use native SDK** for cleaner chat management and automatic thought signature handling
2. **Or keep AI SDK wrapper** but ensure proper message conversion and metadata preservation
