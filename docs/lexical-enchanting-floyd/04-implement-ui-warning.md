# Implement UI Warning Display in Generation Phase

## Files to Modify
- `prompt-bench/ui/components/notebook/GenerationPhase.tsx` - modify multiple sections

## Implementation Details

Implement the complete warning UI flow in the GenerationPhase component, including state management, button behavior, and alert display.

### Part 1: Add State for Warning Tracking (after line 76)

```typescript
const [showAllRuns, setShowAllRuns] = React.useState(false);
const previousTemplateSlugRef = React.useRef<string | null>(null);

// NEW: Track paperwork warning dismissal per analysis ID
const [dismissedPaperworkWarnings, setDismissedPaperworkWarnings] =
  React.useState<Set<string>>(new Set());
```

### Part 2: Compute Warning State (before line 228)

Add logic to determine when to show the warning:

```typescript
// Compute paperwork warning state
const selectedAnalysis = analysisRuns.find(r => r.id === parentRunId);
const hasPaperworkDetected = selectedAnalysis?.inputs?.hasPaperwork === true;
const showPaperworkWarning = hasPaperworkDetected &&
  !dismissedPaperworkWarnings.has(parentRunId || '');

const handleDismissPaperworkWarning = React.useCallback(() => {
  if (parentRunId) {
    setDismissedPaperworkWarnings(prev => new Set([...prev, parentRunId]));
    handleRun(); // Proceed to generation immediately on single click
  }
}, [parentRunId, handleRun]);
```

### Part 3: Update Generate Button (lines 264-268)

Replace existing button implementation with conditional rendering:

```typescript
<Button
  onClick={showPaperworkWarning ? handleDismissPaperworkWarning : handleRun}
  disabled={isRunning || !templateSlug}
  className="bg-purple-600 hover:bg-purple-700"
>
  {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isRunning ? 'Generating...' :
   showPaperworkWarning ? 'Continue' :
   `Generate ${generationConfig.numberOfImages} Image${generationConfig.numberOfImages > 1 ? 's' : ''}`}
  {!isRunning && <Play className="ml-2 h-3 w-3" />}
</Button>
```

**Behavior:**
- Normal state: Shows "Generate X Images", calls `handleRun()`
- Warning state: Shows "Continue", calls `handleDismissPaperworkWarning()`
- Running state: Shows "Generating..." with spinner

### Part 4: Add Warning Alert UI (after CardHeader, before line 272)

Insert the red warning alert immediately after the CardHeader closing tag:

```typescript
</CardHeader>

{/* Paperwork Warning */}
{showPaperworkWarning && (
  <div className="px-6 pt-6">
    <Alert variant="destructive">
      <AlertDescription>
        <div className="flex flex-col gap-2">
          <p className="font-semibold">
            Packaging or paperwork detected in analysis images
          </p>
          <p className="text-sm">
            {selectedAnalysis?.inputs?.paperworkDetails ||
             'Remove packaging materials before generating for best results.'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Click "Continue" to proceed anyway, or run a new analysis with
            clean product images.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  </div>
)}

<CardContent className="space-y-6 pt-6">
```

**Visual Design:**
- `variant="destructive"` → red background (existing shadcn Alert styling)
- Three text levels: bold header, normal body, muted instructions
- Displays specific paperwork details from analysis
- Positioned prominently at top of generation phase

### Part 5: Reset Warning on Analysis Change (after line 115)

Add effect to clear dismissed warnings when user switches to a different analysis run:

```typescript
React.useEffect(() => {
  if (parentRunId) {
    const parentRun = analysisRuns.find((r) => r.id === parentRunId);
    if (parentRun) {
      setAnalysisVariables(parentRun.inputs || {});
    }
  }
}, [parentRunId, analysisRuns]);

// NEW: Clear dismissed paperwork warnings when switching analysis runs
React.useEffect(() => {
  if (parentRunId) {
    setDismissedPaperworkWarnings(new Set());
  }
}, [parentRunId]);
```

**Reset Logic:**
- Triggers when `parentRunId` changes (user selects different analysis)
- Clears all dismissed warnings (user must acknowledge warning for new analysis)
- Ensures user sees warning for each unique analysis run at least once

## Acceptance Criteria

### Functional Requirements
- [ ] Warning appears when `hasPaperwork: true` in selected analysis
- [ ] Button text changes from "Generate X Images" to "Continue"
- [ ] Single click on "Continue" dismisses warning AND starts generation
- [ ] Warning displays specific paperwork details from analysis
- [ ] Warning uses red Alert component (destructive variant)
- [ ] Warning positioned at top of GenerationPhase card

### State Management
- [ ] `dismissedPaperworkWarnings` tracks dismissed state per analysis ID
- [ ] Warning persists across template changes (same analysis)
- [ ] Warning resets when switching to different analysis run
- [ ] No warning shown for analyses without paperwork

### Edge Cases
- [ ] Warning doesn't appear if analysis has no paperwork field
- [ ] Button remains disabled if no template selected (existing behavior)
- [ ] Warning doesn't break layout on mobile/narrow viewports
- [ ] Multiple clicks on "Continue" don't trigger multiple generations

### Visual Verification
- [ ] Alert uses destructive variant (red background)
- [ ] Text hierarchy: bold → normal → muted
- [ ] Spacing matches existing UI patterns
- [ ] No layout shift when warning appears/disappears

## Dependencies
- Task 01 (schema extension)
- Task 02 (detection logic)
- Task 03 (consensus merger)

All backend tasks must complete before UI can access `hasPaperwork` and `paperworkDetails` fields.
