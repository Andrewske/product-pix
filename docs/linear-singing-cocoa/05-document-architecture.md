# Document Architecture

## Goal
Update CLAUDE.md to explain the Gemini SDK architecture and rationale.

## Files to Modify
- `CLAUDE.md` (add new section)

---

## Implementation Details

### Add New Section After "## Architecture"

**Location**: After the `prompt-bench/` directory structure section

**Content to add**:

```markdown
**Gemini Integration**:
- **AI SDK** (`ai`, `@ai-sdk/google`): Single-shot generation (`generateFromText`, `generateFromImage`)
- **Google Gen AI SDK** (`@google/genai`): Multi-turn conversations (`createConversationSession`)
- This is intentional separation—each SDK for its strength, not a workaround
- Google SDK handles thought signatures automatically via `ai.chats` API
- Reference: [GitHub Issue #10441](https://github.com/vercel/ai/issues/10441)
```

### Update "## Gotchas" Section

Add item to gotchas list:

```markdown
- **Gemini SDKs**: AI SDK for single-shot, Google SDK for conversations (thought signatures handled automatically)
- **Conversation aspect ratios**: Google SDK supports only `1:1`, `3:4`, `4:3`, `9:16`, `16:9`
```

---

## Technical Notes to Include

### Memory Efficiency

The Google SDK manages conversation history internally via `chat.getHistory()`. This is more memory-efficient than our previous approach of storing full image Buffers in a local array, as the SDK handles serialization and storage optimally.

### Error Recovery

On failure, the SDK distinguishes between:
- **Curated history**: Valid turns only, used for subsequent API calls
- **Comprehensive history**: All attempts including failures

Failed messages don't pollute the model's context—callers can retry safely.

---

## Acceptance Criteria

- [ ] CLAUDE.md explains SDK architecture clearly
- [ ] Rationale documented (intentional separation, not workaround)
- [ ] Use cases differentiated (single-shot vs. multi-turn)
- [ ] Aspect ratio limitation documented in gotchas
- [ ] File location mentioned (`src/lib/ai/providers/gemini.ts`)

## Optional: Update Related Documentation

If time permits:
- `docs/architecture.md` (if exists) - add Gemini provider section
- `src/lib/ai/README.md` (if exists) - document provider selection logic

---

## Dependencies

- Task 04: All tests must pass before documenting as stable architecture
