# Generation Flow Event Tracking

## Files to Modify/Create
- `src/app/generate/page.tsx` (modify)
- `src/app/generate/__tests__/page.test.tsx` (modify)

## Implementation Details

### Task 3.1: Track Generation Flow Events

Modify `src/app/generate/page.tsx` to add analytics events:

**Events to Add (all properties snake_case):**

1. **generation_started** - Before API call
   - Properties: template_slug, aspect_ratio, resolution, has_source_image

2. **generation_completed** - On success
   - Properties: job_id, template_slug, duration_ms

3. **generation_failed** - On error
   - Properties: error, template_slug

4. **insufficient_credits** - On 402 response
   - Properties: required, balance

5. **image_downloaded** - On download button click
   - Properties: job_id, image_url

**Implementation Pattern:**
```typescript
import { trackEvent } from '@/lib/analytics';

// Before API call
trackEvent({
  event: 'generation_started',
  properties: {
    template_slug: templateSlug,
    aspect_ratio: aspectRatio,
    resolution: resolution,
    has_source_image: !!uploadId,
  }
});

// On success
trackEvent({
  event: 'generation_completed',
  properties: {
    job_id: result.jobId,
    template_slug: templateSlug,
    duration_ms: Date.now() - startTime,
  }
});
```

## Acceptance Criteria
- All generation events tracked with correct snake_case properties
- Events fire at correct points in flow
- Event properties pass Zod validation
- No errors in browser console

## Tests Required

Update `src/app/generate/__tests__/page.test.tsx`:
- Test: generation_started fired on submit
- Test: Event properties pass Zod validation
- Test: generation_completed fired on success
- Test: generation_failed fired on error
- Test: insufficient_credits fired on 402
- Test: image_downloaded fired on download

## Dependencies
- Task 06 (core app integration) must be complete
