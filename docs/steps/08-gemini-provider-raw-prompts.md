# Step 08: Modify Gemini Provider for Raw Prompts

## Objective

Modify the Gemini provider to support raw prompts (without the automatic "Generate a professional product photo:" prefix) for the prompt testing framework.

## Prerequisites

- Steps 01-07 completed (database and prompts library ready)

## Files to Modify

### 1. `src/lib/ai/types.ts`

Add a `rawPrompt` option to the `ImageConfig` interface:

```typescript
// src/lib/ai/types.ts
export interface ImageConfig {
  aspectRatio: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';
  resolution: '1k' | '2k' | '4k';
  quality?: 'standard' | 'hd';
  /**
   * If true, use the prompt as-is without any prefixes.
   * Used by the prompt testing framework for controlled experiments.
   */
  rawPrompt?: boolean;
}
```

### 2. `src/lib/ai/providers/gemini.ts`

Modify the `generateFromText` method to check for `rawPrompt`:

```typescript
// In the generateFromText method, change line ~96:

// Before:
prompt: `Generate a professional product photo: ${prompt}`,

// After:
prompt: config.rawPrompt
  ? prompt
  : `Generate a professional product photo: ${prompt}`,
```

The full updated method should look like:

```typescript
async generateFromText(prompt: string, config: ImageConfig): Promise<GenerationResponse> {
  try {
    const result = await generateText({
      model,
      providerOptions: {
        google: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            aspectRatio: aspectRatioMap[config.aspectRatio],
          },
        },
      },
      prompt: config.rawPrompt
        ? prompt
        : `Generate a professional product photo: ${prompt}`,
    });

    // ... rest of the method unchanged
  } catch (error) {
    return handleError(error);
  }
}
```

## Implementation Steps

1. Open `src/lib/ai/types.ts`
2. Add the `rawPrompt?: boolean` property to `ImageConfig`
3. Add the JSDoc comment explaining its purpose
4. Open `src/lib/ai/providers/gemini.ts`
5. Modify the `generateFromText` method to conditionally use raw prompts
6. Verify there are no TypeScript errors: `npx tsc --noEmit`

## Acceptance Criteria

- [ ] `ImageConfig` in `src/lib/ai/types.ts` has `rawPrompt?: boolean` property
- [ ] `generateFromText` in Gemini provider uses raw prompt when `config.rawPrompt` is true
- [ ] Default behavior (when `rawPrompt` is undefined or false) is unchanged
- [ ] All existing code continues to work without modification
- [ ] No TypeScript errors

## Testing

After implementation, verify behavior:

```typescript
// With rawPrompt: false (default) - adds prefix
generateFromText('a red mug', { aspectRatio: '1:1', resolution: '1k' });
// Uses: "Generate a professional product photo: a red mug"

// With rawPrompt: true - no prefix
generateFromText('Professional photo of a red mug on white background', {
  aspectRatio: '1:1',
  resolution: '1k',
  rawPrompt: true,
});
// Uses: "Professional photo of a red mug on white background"
```

## Notes

- This is a minimal, non-breaking change
- Existing API consumers are unaffected
- The prompt testing framework will use `rawPrompt: true` to control experiments precisely
- The same pattern should NOT be applied to `generateFromImage` as that method has different context needs
