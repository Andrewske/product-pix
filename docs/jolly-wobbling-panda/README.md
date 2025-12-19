# Notebook: Collection Generation + Template Saving

## Overview

Transform the ProductPix notebook to support conversation-based multi-image generation and template version management. This implementation:

1. **Conversation-Based Generation**: Replace single-shot image generation with Google Gen AI SDK multi-turn conversation sessions, enabling better diversity and quality across multiple images
2. **Collection Template Support**: Generate multiple images via angle planning and conversation sessions, using detected angles from reference images
3. **Template Versioning**: Save edited templates as new versions with auto-incremented version numbers, making notebook a template editor

### Key Features
- Always use conversation sessions (even for single images)
- Support all gemini-3-pro-image-preview aspect ratios (1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9)
- Auto-increment version numbers when saving templates
- Saved templates are immediately active and usable
- UI numberOfImages control overrides template.outputCount

## Task Sequence

1. [01-backend-conversation-orchestrator.md](./01-backend-conversation-orchestrator.md) - Implement conversation generation orchestrator function with angle planning
2. [02-backend-api-endpoint.md](./02-backend-api-endpoint.md) - Add /api/notebook/conversation-generate endpoint
3. [03-frontend-generation-ui.md](./03-frontend-generation-ui.md) - Update UI to use conversation generation with expanded aspect ratios
4. [04-backend-save-template.md](./04-backend-save-template.md) - Add /api/notebook/save-template endpoint with version auto-increment
5. [05-frontend-save-template.md](./05-frontend-save-template.md) - Add save button and version display to UI

## Success Criteria

### Single Image Generation (outputCount=1)
- [ ] Select template, set numberOfImages=1
- [ ] Conversation session initializes with reference images
- [ ] Single image generates successfully
- [ ] Cost/tokens calculated correctly
- [ ] Image uploaded to R2 and displayed in UI

### Collection Generation (outputCount=4)
- [ ] Select collection template, set numberOfImages=4
- [ ] Angle detection runs on fixture images
- [ ] Angle planning produces 4 assignments
- [ ] 4 sequential generations complete via conversation turns
- [ ] All images show diversity (no duplicates)
- [ ] Total cost and tokens displayed

### Template Saving
- [ ] Edit templateData JSON in Advanced Configuration
- [ ] Click "Save as v{N}" button
- [ ] New version created (e.g., v1 → v2)
- [ ] Status is 'active'
- [ ] Version badge updates in UI
- [ ] Run `bun bench test` with saved template works in CLI

### Template Edit Persistence
- [ ] Edit templateData, save as v2
- [ ] Refresh notebook UI
- [ ] Select template again
- [ ] UI shows v2, not v1
- [ ] Template changes reflected in generation

## Execution Instructions

1. Execute tasks in numerical order (01 → 05)
2. Each task file contains:
   - Files to modify/create
   - Implementation details with code samples
   - Acceptance criteria checklist
   - Dependencies on prior tasks
3. Verify acceptance criteria before moving to next task
4. Test after completing all tasks using success criteria above

## Dependencies

### External Dependencies
- Google Gen AI SDK (`@google/genai`) - already in use
- Conversation session API - already implemented in `src/lib/ai/providers/gemini.ts`
- Angle planning functions - already in `prompt-bench/core/angle-planner.ts`
- R2 upload functions - already in `src/lib/r2`
- Cost calculation - already in `prompt-bench/core/cost.ts`

### Architectural Decision: Database-Only Templates
- CLI will be updated to read templates from database only (not files)
- File-based templates in `prompt-bench/templates/*.ts` will be deprecated
- `bun bench sync` command no longer needed
- Templates saved via notebook are immediately available to CLI
- Single source of truth: `prompt_templates` table

### Database Schema
No migrations needed - `prompt_templates` table already supports:
- `type` ('single' | 'collection')
- `output_count` (integer)
- `UNIQUE(slug, version)` constraint for versioning

### Critical Files
**Backend:**
- `prompt-bench/core/notebook-orchestrator.ts` - New conversation generation function
- `prompt-bench/core/types.ts` - New request/result types
- `prompt-bench/ui/server.ts` - Two new endpoints

**Frontend:**
- `prompt-bench/ui/components/notebook/GenerationPhase.tsx` - Conversation UI + save UI

## Technical Considerations

### Aspect Ratio Support
- Gemini 3 Pro Image supports: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
- All ratios included in UI dropdown
- No validation needed - all are supported by model

### Conversation Sessions for Single Images
- Even when outputCount=1, still use conversation session
- Initialize session with reference images
- Call generateNext() once
- Ensures consistency across all generation flows

### Error Handling
- Angle detection failures → use category defaults
- Classification failures → fallback to 'generic' category
- Session initialization failures → return error to UI (don't fallback to single-shot)
- Individual image generation failures → continue with next angle, return partial results

### Performance
- Sequential generation (conversation turns) slower than parallel single-shots
- Tradeoff: conversation context enables better diversity and quality
- Show per-image progress in UI to manage expectations

### Idempotency
- Use sessionId + parentRunId + angleIndex as uniqueness constraint
- Prevents duplicate generations within same session
- Existing CLI uses slug + version + variables + sourceHash

## Implementation Notes

### Phase 1: Conversation Generation (Tasks 01-03)
Ports CLI's collection generation flow to notebook:
- Same angle detection and planning logic
- Same conversation session initialization
- Same multi-turn generation loop
- Different: uses fixture images from DB instead of batch file paths

### Phase 2: Template Saving (Tasks 04-05)
Independent feature that enables template editor workflow:
- Auto-increment version on save
- Status always 'active' (immediately usable by both notebook and CLI)
- UI control value (numberOfImages) saved to template.output_count
- Preserves full template version history in database
- No file export needed - CLI reads directly from database
