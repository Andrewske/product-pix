# Event Definitions and Schemas

## Files to Modify/Create
- `src/lib/analytics/events.ts` (new)
- `src/lib/analytics/__tests__/events.test.ts` (new)

## Implementation Details

### Task 1.4: Create Event Type Definitions with Zod Schemas

Define centralized event catalog with runtime validation in `src/lib/analytics/events.ts`:

**Content Requirements:**
- TypeScript discriminated union type for all analytics events
- Zod schemas for runtime validation of event properties
- All property names in snake_case (job_id, template_slug, aspect_ratio, etc.)

**Events to Include:**
- **Auth**: user_signed_up, user_logged_in, user_logged_out
- **Generation**: generation_started, generation_completed, generation_failed, image_downloaded
- **Batch**: batch_created, batch_completed, batch_cancelled
- **Credits**: credits_purchased, subscription_started, subscription_cancelled, insufficient_credits
- **Navigation**: pricing_viewed, dashboard_viewed, template_selected
- **Errors**: error_occurred, rate_limit_hit

**Example Structure:**
```typescript
import { z } from 'zod';

// Zod schemas for each event type
export const generationStartedSchema = z.object({
  event: z.literal('generation_started'),
  properties: z.object({
    template_slug: z.string(),
    aspect_ratio: z.enum(['1:1', '2:3', '3:2', ...]),
    resolution: z.enum(['1k', '2k', '4k']),
    has_source_image: z.boolean(),
  }),
});

// TypeScript types derived from schemas
export type GenerationStartedEvent = z.infer<typeof generationStartedSchema>;

// Discriminated union of all event types
export type AnalyticsEvent =
  | GenerationStartedEvent
  | GenerationCompletedEvent
  | ...;
```

## Acceptance Criteria
- All event types compile without TypeScript errors
- Discriminated union works correctly
- Zod schemas validate correct event properties
- Zod schemas reject invalid properties (wrong types, missing fields)
- All property names use snake_case

## Tests Required
Create `src/lib/analytics/__tests__/events.test.ts`:
- Test: TypeScript discriminated union compiles
- Test: Zod schemas validate correct event properties
- Test: Zod schemas reject invalid properties (wrong types, missing fields)

## Dependencies
- Task 01 (env setup) must be complete
