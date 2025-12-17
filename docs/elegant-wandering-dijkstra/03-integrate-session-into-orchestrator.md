# Integrate Session into Orchestrator

## Files to Modify/Create
- `prompt-bench/core/orchestrator.ts` (modify)

## Implementation Details

Replace the independent generation loop in `coordinateCollectionGeneration()` with conversation session-based generation.

### Current Implementation (to replace)

```typescript
// Current: Each generation is independent
for (let j = 0; j < plan.assignments.length; j++) {
  const assignment = plan.assignments[j];
  // ...
  if (sourceImage) {
    generationResult = await gemini.generateFromImage(
      sourceImage.buffer,
      sourceImage.mimeType,
      compileResult.data.prompt,
      config
    );
  } else {
    generationResult = await gemini.generateFromText(compileResult.data.prompt, config);
  }
}
```

### New Implementation

```typescript
// Create conversation session for this collection (separate factory, not on provider)
import { createConversationSession } from '@/lib/ai/providers/gemini';

const session = createConversationSession();

// Use angle detection to label source images (soft hints, not hard coupling)
// This helps AI understand what each reference shows without prescribing usage
const labeledImages = resolvedSourceImagesForAnalysis.map((img, i) => ({
  buffer: img.buffer,
  mimeType: img.mimeType,
  label: detectedAngles.sourceAngles[i]?.detectedAngle || `reference ${i + 1}`
}));

// Initialize with labeled reference images
await session.initialize(
  labeledImages,
  `Product: ${testCase.variables?.product || 'product'}
Category: ${category}
You have ${labeledImages.length} reference images of this product from different angles.
Generate ${template.outputCount} distinct professional e-commerce photos.
Each generation must be visually unique from previous outputs.`
);

// Generate each angle - AI chooses best reference naturally
const targetAngles = getAnglesForCategory(category).slice(0, template.outputCount);

for (let j = 0; j < targetAngles.length; j++) {
  const angle = targetAngles[j];

  // Compile prompt as before
  const compileResult = compileTemplate(/* ... */);

  // Build angle-specific prompt with diversity instruction
  const prompt = `Generate image ${j + 1}/${targetAngles.length}: ${angle} view.
This must be distinctly different from any previous images.
${compileResult.data.prompt}`;

  // Use session instead of direct provider call
  const generationResult = await session.generateNext(prompt, {
    rawPrompt: true,
    aspectRatio: '1:1' as const,
    resolution: '1k' as const
  });

  // Rest of processing (upload, cost calculation, database update) unchanged
}
```

### Integration Points

1. **Session creation**: Create session at the start of each test case's collection generation
2. **Soft labeling**: Use angle detection to label source images (e.g., "front view", "side angle") without hard-coupling to outputs
3. **Initialization**: Pass all labeled source images; AI naturally picks best reference for each target
4. **Prompt modification**: Each prompt includes angle index and diversity instruction
5. **Replace provider calls**: `gemini.generateFromImage()` → `session.generateNext()`

### Considerations

- **Text-to-image fallback**: If no source images, initialize session with empty array and text-only context
- **Idempotency**: Collection generation is non-deterministic with sessions (generation N depends on 1..N-1). Acceptable for prompt-bench testing; revisit if promoting to main workflow
- **Error handling**: If generation N fails, decide whether to continue (current behavior) or abort session

## Acceptance Criteria

- [ ] `coordinateCollectionGeneration()` creates a `GeminiConversationSession` per test case
- [ ] Session is initialized with all resolved source images
- [ ] Each angle generation uses `session.generateNext()` instead of direct provider calls
- [ ] Prompts include angle index and diversity instruction
- [ ] Existing database operations (insert, update) remain unchanged
- [ ] Cost tracking continues to work correctly
- [ ] `bun bench test --template multi-angle-hybrid --batch prompt-bench/fixtures/min-multi-image.json` runs without errors

## Dependencies

- Task 01: Types must be defined
- Task 02: Session class must be implemented
