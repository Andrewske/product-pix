# Conversation-Based Multi-Angle Generation

## Overview

Multi-angle collection generation currently produces nearly identical images because each generation is independent—the AI has no awareness of previous outputs. This plan implements a `GeminiConversationSession` abstraction that maintains multi-turn context, allowing each generation to see all reference images plus previously generated images, enabling the AI to consciously produce diverse outputs.

**Problem**: User provides 2-5 source images, but generated angles look nearly identical
**Solution**: Conversation session where each generation sees cumulative context

## Task Sequence

1. [01-add-conversation-session-types.md](./01-add-conversation-session-types.md) - Add TypeScript interfaces for conversation session abstraction
2. [02-implement-gemini-conversation-session.md](./02-implement-gemini-conversation-session.md) - Implement GeminiConversationSession class with cumulative history
3. [03-integrate-session-into-orchestrator.md](./03-integrate-session-into-orchestrator.md) - Replace independent generation loop with session-based generation

## Success Criteria

1. **Visual diversity**: Generated images for different angles are visually distinct (not near-duplicates)
2. **Functional parity**: Existing pipeline operations (database, cost tracking, reporting) continue working
3. **Token cost**: Input cost increase is within expected range (~$0.03-0.05 extra per 5-image batch, using optimized history that excludes reference images from subsequent turns)
4. **Test validation**: `bun bench test --template multi-angle-hybrid --batch prompt-bench/fixtures/min-multi-image.json` completes successfully with diverse outputs

## Execution Instructions

1. Execute tasks in numerical order (01 → 03)
2. Each task file contains:
   - Files to modify/create
   - Implementation details with code examples
   - Acceptance criteria
   - Dependencies
3. Verify acceptance criteria before moving to next task

## Dependencies

- Gemini API access (existing)
- AI SDK (`ai` package) - already installed
- No new packages required

## Key Files

| File | Action |
|------|--------|
| `src/lib/ai/types.ts` | Add interfaces |
| `src/lib/ai/providers/gemini.ts` | Add session class |
| `prompt-bench/core/orchestrator.ts` | Integrate session |

## Testing

After implementation:

```bash
# Run multi-angle generation test
bun bench test --template multi-angle-hybrid --batch prompt-bench/fixtures/min-multi-image.json

# Open report to visually verify diversity
bun bench open-last-report
```

Compare generated images visually to verify they are distinct across angles.
