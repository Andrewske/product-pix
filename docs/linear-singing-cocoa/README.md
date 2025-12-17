# Fix Thought Signatures in Multi-Turn Image Generation

## Overview

**Problem**: Multi-angle image generation pipeline fails with error:
```
Image part is missing a thought_signature in content position 3, part position 1.
```

**Root Cause**: Vercel AI SDK v6 beta does not properly preserve Gemini thought signatures for multi-turn image generation, despite GitHub PR #10462 claiming to fix this issue.

**Solution**: Use Google Gen AI SDK for conversation sessions (handles thought signatures automatically via `ai.chats` API).

**Architecture Decision**:
- **AI SDK** (`ai`, `@ai-sdk/google`): Single-shot generation (text-to-image, image-to-image)
- **Google Gen AI SDK** (`@google/genai`): Multi-turn conversations with automatic thought signature handling

This is intentional separation of concerns, not a workaround. Each SDK is used for what it does best.

**Impact**: Enables multi-angle generation, conversation-based prompting, and sequential image creation with proper context preservation.

---

## Task Sequence

1. **[01-implement-google-conversation-session.md](./01-implement-google-conversation-session.md)** - Implement `GoogleConversationSession` class using official SDK
2. **[02-switch-conversation-factory-and-cleanup.md](./02-switch-conversation-factory-and-cleanup.md)** - Update factory to use Google SDK and add structured logging
3. **[03-test-multi-turn-pipeline.md](./03-test-multi-turn-pipeline.md)** - Verify thought signatures work with multi-angle pipeline
4. **[04-regression-testing.md](./04-regression-testing.md)** - Ensure no breakage in existing single-shot generation
5. **[05-document-architecture.md](./05-document-architecture.md)** - Update CLAUDE.md with architecture rationale

---

## Success Criteria

**Primary Goals**:
- [ ] Multi-angle pipeline completes without "thought_signature" errors
- [ ] Multiple images generated in sequence with preserved conversation context
- [ ] Cost tracking accurate (includes `thoughtsTokenCount` for thinking models)

**Quality Gates**:
- [ ] All existing tests pass (no regressions)
- [ ] Single-shot generation still works via AI SDK
- [ ] TypeScript compiles without errors
- [ ] Error handling produces correct error codes (`RATE_LIMITED`, `CONTENT_FILTERED`, etc.)
- [ ] Unit tests exist for `GoogleConversationSession` with mocked SDK

**Documentation**:
- [ ] CLAUDE.md explains SDK architecture and rationale
- [ ] Code comments mark deprecated `GeminiConversationSession` class

---

## Execution Instructions

### Sequential Execution
Execute tasks in numerical order (01 → 05). Each task file contains:
- **Files to Modify/Create**: Exact file paths to change
- **Implementation Details**: Step-by-step instructions with code examples
- **Acceptance Criteria**: Checklist to verify task completion
- **Dependencies**: Prerequisites from earlier tasks

### Key Commands

**Test multi-turn pipeline**:
```bash
bun bench test --template multi-angle-hybrid --batch prompt-bench/fixtures/min-multi-image.json
```

**Run unit tests**:
```bash
bun test src/lib/ai/providers/__tests__/
bun test prompt-bench/__tests__/
```

**TypeScript compilation check**:
```bash
bunx tsc --noEmit
```

### Rollback Plan

If Google SDK doesn't work:
1. Revert `createConversationSession()` factory to return `GeminiConversationSession`
2. Wait for AI SDK v6 stable release
3. Consider manual thought signature extraction from raw API responses

---

## Dependencies

**Packages**:
- `@google/genai@1.31.0` - Already installed
- `ai@6.0.0-beta.157` - Already upgraded
- `@ai-sdk/google@3.0.0-beta.78` - Already upgraded

**Environment Variables**:
- `GOOGLE_GENERATIVE_AI_API_KEY` - Gemini API key (already configured)
- `GEMINI_MODEL` - Must be a thinking-capable model (e.g., `gemini-3-pro-image-preview`)

**Files**:
- `src/lib/ai/providers/gemini.ts` - Primary implementation file
- `src/lib/ai/types.ts` - Interface definitions (`ImageConversationSession`)
- `prompt-bench/core/orchestrator.ts` - Uses conversation sessions
- `CLAUDE.md` - Documentation

**Research**:
- `docs/linear-singing-cocoa/research-findings.md` - Complete API documentation

---

## References

- [Gemini Thought Signatures Documentation](https://ai.google.dev/gemini-api/docs/thought-signatures)
- [Gemini Extended Thinking Guide](https://ai.google.dev/gemini-api/docs/thinking)
- [AI SDK v6 Beta Announcement](https://v6.ai-sdk.dev/docs/announcing-ai-sdk-6-beta)
- [Google Provider in AI SDK v6](https://v6.ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai)
- [GitHub Issue #10441 - Thought Signature Bug](https://github.com/vercel/ai/issues/10441)
- [GitHub PR #10462 - Attempted Fix (Incomplete)](https://github.com/vercel/ai/pull/10462)

---

## Technical Context

### What Are Thought Signatures?

Thought signatures are **encrypted representations of Gemini's internal thought process**, required for multi-turn conversations with thinking models (Gemini 2.5/3 series). They must be preserved **exactly as received** when sending conversation history back to the API.

**Critical Rules**:
- Don't concatenate parts with signatures together
- Don't merge signed parts with unsigned parts
- Signatures are embedded within response parts themselves

**Automatic Handling**: Official Google Gen AI SDKs handle signature extraction and re-injection automatically—no manual management needed.

### Why AI SDK v6 Doesn't Work for Conversations

Despite PR #10462 claiming to add thought signature support, testing revealed:

```json
// AI SDK v6 beta response providerMetadata
"providerMetadata": {
  "google": {
    "thoughtsTokenCount": 159,
    // NO thought_signature field present!
  }
}
```

The SDK tracks thinking tokens but **does not return or preserve thought signatures** for image parts in multi-turn conversations.

### Architecture Decision Rationale

**Single-shot generation** (text-to-image, image-to-image with no conversation):
- Works correctly with AI SDK v6
- No thought signatures needed (stateless)
- Keep existing implementation

**Multi-turn conversations** (sequential prompts building on previous responses):
- Broken in AI SDK v6 beta (missing thought signatures)
- Works with official Google SDK (automatic signature management)
- Use `GoogleConversationSession`

This is intentional separation of concerns—each SDK for its strength—not a temporary workaround.
