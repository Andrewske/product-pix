# UI Components

## Files to Create
- `prompt-bench/ui/components/review/index.ts` (new)
- `prompt-bench/ui/components/review/RatingScale.tsx` (new)
- `prompt-bench/ui/components/review/ScoreComparison.tsx` (new)
- `prompt-bench/ui/components/review/ReviewCard.tsx` (new)
- `prompt-bench/ui/components/review/ReviewView.tsx` (new)

## Implementation Details

Create components in leaf-to-root order (dependencies first).

### 1. Barrel Export (`index.ts`)

```typescript
export { ReviewView } from './ReviewView';
export { ReviewCard } from './ReviewCard';
export { RatingScale } from './RatingScale';
export { ScoreComparison } from './ScoreComparison';
```

### 2. RatingScale Component

**Purpose:** 1-10 clickable rating scale

**Props:**
```typescript
interface RatingScaleProps {
  value: number | null;
  onChange: (rating: number) => void;
  disabled?: boolean;
}
```

**UI Requirements:**
- 10 clickable buttons (1-10)
- Color coding (matches existing EvaluationPhase.tsx pattern):
  - Green: 8-10
  - Yellow: 5-7
  - Red: 1-4
- Hover states showing potential selection
- Clear visual feedback for selected state
- Use shadcn Button components

### 3. ScoreComparison Component

**Purpose:** Post-rating comparison display

**Props:**
```typescript
interface ScoreComparisonProps {
  humanScore: number;
  llmScore: number;
  llmDetails: Record<string, unknown>;
}
```

**UI Requirements:**
- Display "Your rating: X/10"
- Display "AI rating: Y/10"
- Delta indicator showing +/- difference with color coding
- Expandable section for AI reasoning (Collapsible)
- Use shadcn Badge for scores

### 4. ReviewCard Component

**Purpose:** Individual image review card

**Props:**
```typescript
interface ReviewCardProps {
  testId: string;
  imageUrl: string;
  imageUrls?: string[];
  prompt: string;
  llmScore: number;
  llmDetails: Record<string, unknown>;
  sourceImageUrl?: string | null;
  onRatingSubmit: (testId: string, rating: number, imageIndex?: number) => Promise<void>;
  isRated: boolean;
  humanScore?: number;
}
```

**UI Requirements:**
- Large generated image display
- "Show Original" button that shows source image overlay on hover
- Collapsible prompt section (collapsed by default)
- RatingScale component for unrated images
- ScoreComparison component after rating
- For multi-image runs: display all images, allow individual rating
- Use shadcn Card, Button, Collapsible

### 5. ReviewView Component

**Purpose:** Main page container

**State:**
- `pendingImages: UnreviewedImage[]`
- `ratedImages: Map<string, number>` (testId → humanScore)
- `loading: boolean`
- `error: string | null`

**Behavior:**
- Fetch `/api/review/pending` on mount
- Display grid/list of ReviewCards
- Track rated images in session
- Handle rating submission via POST `/api/review/rate`
- Update local state after successful rating

**UI Requirements:**
- Loading state with spinner
- Empty state if no pending images
- Error display for fetch failures
- Grid layout for multiple images
- Count indicator: "X images to review"

## Component Patterns

Follow existing patterns from:
- `EvaluationPhase.tsx` - Score display with Progress bars
- Use shadcn: Card, Button, Collapsible, Badge, Progress
- Color coding: green (>=8), yellow (>=5), red (<5)

## Acceptance Criteria
- [ ] RatingScale renders 1-10 buttons with correct colors
- [ ] RatingScale calls onChange when button clicked
- [ ] ScoreComparison shows human vs AI scores with delta
- [ ] ReviewCard displays image, prompt (collapsed), rating scale
- [ ] ReviewCard shows source image on hover/click
- [ ] ReviewCard switches to comparison view after rating
- [ ] ReviewView fetches and displays pending images
- [ ] ReviewView handles rating submission
- [ ] Multi-image runs show all images with individual ratings

## Dependencies
- Task 01: Types and Interfaces
- Task 02: API Endpoints (for data fetching)
