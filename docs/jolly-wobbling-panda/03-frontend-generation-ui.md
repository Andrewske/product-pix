# Frontend: Conversation Generation UI

## Files to Modify/Create
- `prompt-bench/ui/components/notebook/GenerationPhase.tsx` (modify)

## Implementation Details

Update the GenerationPhase component to use conversation-based generation and support all gemini-3-pro-image-preview aspect ratios.

### State Additions

Add new state variables:
```typescript
const [isGenerating, setIsGenerating] = useState<boolean>(false);
const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number } | null>(null);
```

### Update Aspect Ratio Options

Replace existing aspect ratio options with:
```typescript
options={[
  { value: '1:1', label: '1:1 (Square)' },
  { value: '2:3', label: '2:3 (Portrait)' },
  { value: '3:2', label: '3:2 (Landscape)' },
  { value: '3:4', label: '3:4 (Portrait)' },
  { value: '4:3', label: '4:3 (Landscape)' },
  { value: '4:5', label: '4:5 (Portrait)' },
  { value: '5:4', label: '5:4 (Landscape)' },
  { value: '9:16', label: '9:16 (Vertical)' },
  { value: '16:9', label: '16:9 (Horizontal)' },
  { value: '21:9', label: '21:9 (Ultrawide)' },
]}
```

### Update Generate Button Text

Change button to display dynamic text based on outputCount:
```typescript
<Button onClick={handleRun} disabled={isRunning || !templateSlug}>
  {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isRunning ? 'Generating...' : `Generate ${generationConfig.numberOfImages} Image${generationConfig.numberOfImages > 1 ? 's' : ''}`}
  {!isRunning && <Play className="ml-2 h-3 w-3" />}
</Button>
```

### Replace handleRun() Function

Replace the existing single-image generation with conversation-based:
```typescript
const handleRun = async () => {
  if (!templateSlug || !parentRunId) {
    setError('Missing required fields');
    return;
  }

  setError(null);
  setIsRunning(true);
  setGenerationProgress({ current: 0, total: generationConfig.numberOfImages });

  try {
    const res = await fetch('/api/notebook/conversation-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        parentRunId,
        templateSlug,
        templateData,
        variables: analysisVariables,
        model,
        config: {
          aspectRatio: generationConfig.aspectRatio,
          resolution: generationConfig.resolution
        },
        outputCount: generationConfig.numberOfImages
      }),
    });

    const result = await res.json();

    if (result.error) {
      setError(`Generation failed: ${result.error}`);
    } else {
      // result.generationRuns is array of generation records
      result.generationRuns.forEach(run => onRunComplete(run));
      setError(null);
    }
  } catch (err) {
    setError(`Network error: ${(err as Error).message}`);
  } finally {
    setIsRunning(false);
    setGenerationProgress(null);
  }
};
```

### Add Progress Display

Add progress indicator in the UI (after error alert):
```tsx
{generationProgress && (
  <Alert>
    <AlertDescription>
      Generating image {generationProgress.current} of {generationProgress.total}...
    </AlertDescription>
  </Alert>
)}
```

### Update Generation Results Display

The existing generation history display should automatically handle multiple results since `onRunComplete` is called for each run.

Consider adding:
- Grid layout for multiple images
- Total cost display across all runs
- Total tokens display

## Acceptance Criteria

- [ ] Aspect ratio dropdown includes all 10 supported ratios
- [ ] Button text shows "Generate {N} Image(s)" dynamically
- [ ] `handleRun()` calls `/api/notebook/conversation-generate` endpoint
- [ ] Progress indicator shows during generation
- [ ] Multiple generation results displayed correctly
- [ ] Error handling works for failed generations
- [ ] Network errors caught and displayed
- [ ] UI updates properly when generation completes

## Dependencies

- **Task 02** - Requires `/api/notebook/conversation-generate` endpoint to exist
