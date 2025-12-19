# Backend: Conversation Generation Orchestrator

## Files to Modify/Create
- `prompt-bench/core/notebook-orchestrator.ts` (modify)
- `prompt-bench/core/types.ts` (modify - add new types)

## Implementation Details

Create `runConversationGenerationPhase()` function that implements conversation-based collection generation using Google Gen AI SDK multi-turn sessions.

### New Type Definitions (add to `types.ts`)

```typescript
interface ConversationGenerationRequest {
  sessionId: string;
  parentRunId: string;         // Analysis run with fixture images
  templateSlug: string;
  templateData: Record<string, unknown>;  // UI edits
  variables?: Record<string, unknown>;    // Manual variable overrides
  model?: string;
  config?: ImageConfig;        // aspectRatio, resolution
  outputCount: number;         // From UI (overrides template.outputCount)
}

interface ConversationGenerationResult {
  generationRuns: Array<{
    runId: string;
    phaseRunNumber: number;
    angleIndex: number;
    targetAngle: string;
    imageUrl: string;
    finalPrompt: string;
    tokens: { input: number; output: number };
  }>;
  totalTokens: { input: number; output: number };
  totalCost: number;
}
```

### Function Signature

```typescript
export const runConversationGenerationPhase = async (
  request: ConversationGenerationRequest
): Promise<Result<ConversationGenerationResult>>
```

### Implementation Steps

1. **Fetch parent analysis run**
   - Query `prompt_tests` where `id = request.parentRunId`
   - Validate `phase === 'analysis'`
   - Extract fixture image IDs from analysis run data

2. **Fetch template from database**
   - Query `prompt_templates` where `slug = request.templateSlug`
   - Use `request.templateData` if provided, else `template.template_data`

3. **Resolve fixture images**
   - Query `fixture_images` table using IDs from parent run
   - Download images from R2 URLs as `Buffer + mimeType`
   - Use helper: `downloadImagesFromR2()` pattern from existing code
   - **Note**: Consider resizing to max 1024px on longest side to prevent API payload bloat and excessive costs

4. **Product category classification**
   - Import: `import { classifyProduct } from '@bench/core/angle-planner';`
   - Call: `classifyProduct(firstFixtureImage)`
   - Fallback to `'generic'` if fails

5. **Angle detection**
   - Import: `import { detectSourceAngles } from '@bench/core/angle-planner';`
   - Call: `detectSourceAngles(fixtureImages)`
   - Returns `DetectedAngles` with array of detected angles

6. **Angle planning**
   - Import: `import { planCollection } from '@bench/core/angle-planner';`
   - Call: `planCollection(detectedAngles, category, request.outputCount)`
   - Returns `AnglePlan` with target angle → source image assignments

7. **Create conversation session**
   - Import: `import { createConversationSession } from '@/lib/ai/providers/gemini';`
   - Call: `const session = createConversationSession();`

8. **Initialize session with reference images**
   ```typescript
   await session.initialize(
     fixtureImages.map((img, idx) => ({
       buffer: img.buffer,
       mimeType: img.mimeType,
       label: detectedAngles.angles[idx]?.label || `Reference ${idx + 1}`
     })),
     systemContext: `Product: ${productName}\nCategory: ${category}\nGenerating ${outputCount} images`
   );
   ```

9. **Generate each angle in loop**
   For each assignment in angle plan:
   - Get next `phaseRunNumber` using existing `getNextPhaseRunNumber()` helper
   - Merge variables: `{ ...parentRun.inputs, ...request.variables, angle: assignment.targetAngle, outputIndex: i, totalOutputs: outputCount }`
   - Compile template using existing `compileTemplate()` function
   - Build angle-specific prompt:
     ```
     Generate image {i+1}/{outputCount}: {targetAngle} view.
     This must be distinctly different from any previous images.
     {compiledPrompt}
     ```
   - Call `session.generateNext(prompt, { aspectRatio, resolution })`
   - Upload to R2: `uploadBase64Image(imageData, 'notebook-user', sessionId, format)`
   - Calculate cost using existing `calculateCost()` function
   - Insert `prompt_tests` record with all metadata
   - Accumulate tokens + cost

10. **Return result**
    - Build array of all generation runs with IDs, URLs, prompts
    - Include total tokens and cost

### Required Imports
```typescript
import { createConversationSession } from '@/lib/ai/providers/gemini';
import { classifyProduct, detectSourceAngles, planCollection } from '@bench/core/angle-planner';
import type { ProductCategory, DetectedAngles, AnglePlan } from '@bench/core/types';
import { uploadBase64Image } from '@/lib/r2';
import { calculateCost } from '@bench/core/cost';
```

## Acceptance Criteria

- [ ] New types added to `types.ts`
- [ ] `runConversationGenerationPhase()` function implemented in `notebook-orchestrator.ts`
- [ ] Function handles single image (outputCount=1) and collections (outputCount>1)
- [ ] Angle detection gracefully handles failures (fallback to category defaults)
- [ ] Classification failures fallback to 'generic' category
- [ ] All images uploaded to R2 successfully
- [ ] Database records created with correct phase, parentRunId, phaseRunNumber
- [ ] Cost and tokens accumulated correctly across all images
- [ ] Returns complete result with all generation runs

## Dependencies

None - this is the foundation for conversation-based generation
