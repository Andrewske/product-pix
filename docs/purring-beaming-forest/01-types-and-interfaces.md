# Types and Interfaces

## Files to Modify/Create
- `prompt-bench/core/types.ts` (modify)

## Implementation Details

Add the following interfaces to support the angle detection and planning system:

### DetectedAngles Interface
Result from Gemini angle detection (cached):

```typescript
interface DetectedAngles {
  sourceAngles: Array<{
    imageIndex: number;
    detectedAngle: string;  // Free-form description of what angle this shows
    isPrimaryReference: boolean;  // Best source for unmatched angles
  }>;
}
```

### AnglePlan Interface
Result from algorithmic collection planning (not cached):

```typescript
interface AnglePlan {
  assignments: Array<{
    targetAngle: string;  // Prefer category vocabulary
    sourceImageIndex: number;
    matchType: 'exact' | 'similar' | 'primary-fallback';
  }>;
}
```

## Acceptance Criteria
- [ ] `DetectedAngles` interface is exported from types.ts
- [ ] `AnglePlan` interface is exported from types.ts
- [ ] Types compile without errors
- [ ] Interfaces are documented with JSDoc comments

## Dependencies
None - this is the foundational task.
