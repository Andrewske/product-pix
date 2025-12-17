# Switch Conversation Factory and Cleanup

## Goal
Update `createConversationSession()` factory to use Google SDK, add structured logging, and mark deprecated class.

## Files to Modify
- `src/lib/ai/providers/gemini.ts` (modify)

---

## Implementation Details

### 1. Update Factory Function

**Location**: Find `createConversationSession` function (around line 299-302)

**Current code**:
```typescript
export const createConversationSession = (): ImageConversationSession => {
  return new GeminiConversationSession();
};
```

**New code**:
```typescript
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
```

### 2. Add Deprecation Comment to GeminiConversationSession

**Location**: Before the `GeminiConversationSession` class definition

**Add comment**:
```typescript
/**
 * @deprecated Use GoogleConversationSession for multi-turn conversations.
 *
 * This class remains for reference but is not used in production due to
 * AI SDK v6 beta limitation with thought signatures for image parts.
 *
 * @see https://github.com/vercel/ai/issues/10441
 */
export class GeminiConversationSession implements ImageConversationSession {
```

### 3. Replace Debug Logging with Structured Logging

**Location**: Find debug console.log statements (around lines 238-246)

**Remove this block entirely**:
```typescript
// DEBUG: Log response structure
console.log('[DEBUG] Result keys:', Object.keys(result));
console.log('[DEBUG] Result.steps length:', result.steps?.length);
if (result.steps && result.steps.length > 0) {
  const lastStep = result.steps[result.steps.length - 1];
  console.log('[DEBUG] Last step keys:', Object.keys(lastStep));
  console.log('[DEBUG] Last step providerMetadata:', JSON.stringify(lastStep.providerMetadata, null, 2));
  console.log('[DEBUG] Last step content:', JSON.stringify(lastStep.content, null, 2));
}
```

### 4. Add Structured Logging to GoogleConversationSession

Add logging at key points in the new class:

```typescript
import { logger } from '@bench/core/logger';

// In initialize():
logger.debug('GoogleConversationSession initialized', {
  referenceImageCount: referenceImages.length,
  model: env.GEMINI_MODEL,
});

// In generateNext() on success:
logger.debug('GoogleConversationSession generated image', {
  messageCount: this.messageCount,
  aspectRatio: config.aspectRatio,
  hasUsage: !!usage,
});

// In generateNext() on error:
logger.debug('GoogleConversationSession generation failed', {
  messageCount: this.messageCount,
  errorCode: response.code,
});
```

### 5. Clean Up Stale Comments in GeminiConversationSession (Optional)

The deprecated class has comments about preserving thought signatures that are now misleading. Consider adding a note at the top of relevant methods:

```typescript
// Note: This implementation attempts to preserve providerMetadata but
// AI SDK v6 beta does not return thought signatures for image parts.
// See GoogleConversationSession for working implementation.
```

---

## Acceptance Criteria

- [ ] `createConversationSession()` returns `GoogleConversationSession` instance
- [ ] Factory has JSDoc comment explaining why Google SDK is used
- [ ] `GeminiConversationSession` marked as `@deprecated` with comment
- [ ] All debug `console.log` statements removed
- [ ] Structured `logger.debug()` calls added to `GoogleConversationSession`
- [ ] TypeScript compiles without errors
- [ ] No runtime errors when importing the module

## Dependencies

- Task 01: `GoogleConversationSession` must be implemented first
