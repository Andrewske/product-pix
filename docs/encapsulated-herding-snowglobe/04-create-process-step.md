# Create ProcessStep Component

## Files to Modify/Create
- `src/components/process-step.tsx` (new)

## Implementation Details

Create a process step component with numbered badges and visual connectors between steps.

### Component Implementation

```typescript
// src/components/process-step.tsx
import { Badge } from "@/components/ui/badge"

interface ProcessStepProps {
  step: number
  title: string
  description: string
  isLast?: boolean
}

export function ProcessStep({ step, title, description, isLast }: ProcessStepProps) {
  return (
    <div className="flex gap-4 items-start relative">
      <Badge
        variant="outline"
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-medium"
      >
        {step}
      </Badge>
      {!isLast && (
        <div className="absolute left-4 top-10 bottom-0 w-px bg-border -translate-x-1/2" />
      )}
      <div className="flex-1">
        <h3 className="font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
```

## Acceptance Criteria
- [ ] Component displays step number in circular badge
- [ ] Visual connector line appears between steps (except for last step)
- [ ] Connector line aligns correctly with badge center
- [ ] Title and description render with correct typography
- [ ] `isLast` prop correctly hides connector on final step
- [ ] TypeScript types are correct (no `any` or unguarded `unknown`)
- [ ] Badge is non-shrinking (shrink-0) to maintain size
- [ ] Component works in vertical stacks of multiple steps

## Dependencies
- Existing Badge component

## Notes
- Connector line uses absolute positioning relative to parent
- `translate-x-1/2` centers the connector line on the badge
- `shrink-0` prevents badge from collapsing in flex layout
- `isLast` prop prevents orphan connector after final step
- Works best in a vertical stack with consistent spacing (e.g., `space-y-6`)

## Usage Example

```typescript
<div className="space-y-6">
  <ProcessStep
    step={1}
    title="Upload"
    description="Drag & drop your raw product shot."
  />
  <ProcessStep
    step={2}
    title="Prompt"
    description="Describe the scene or choose a preset."
  />
  <ProcessStep
    step={3}
    title="Download"
    description="Get 4K commercial-ready images."
    isLast
  />
</div>
```
