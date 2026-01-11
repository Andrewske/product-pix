# Human Review Page for Prompt Bench

## Overview

Add a `/review` page to the prompt-bench UI where users can manually rate generated images on a 1-10 scale. After rating, users see how their score compares to the AI's evaluation. This enables human-in-the-loop quality assessment and helps calibrate AI evaluation accuracy.

**Key Features:**
- Grid of images pending human review (have AI eval, no human rating)
- 1-10 clickable rating scale with color coding
- Collapsible prompt section
- Source image preview on hover
- Post-rating comparison showing human vs AI scores

## Task Sequence

1. [01-types-and-interfaces.md](./01-types-and-interfaces.md) - Add TypeScript interfaces for UnreviewedImage and HumanRating
2. [02-api-endpoints.md](./02-api-endpoints.md) - Add GET /api/review/pending and POST /api/review/rate endpoints
3. [03-ui-components.md](./03-ui-components.md) - Create RatingScale, ScoreComparison, ReviewCard, and ReviewView components
4. [04-entry-and-build.md](./04-entry-and-build.md) - Create entry point, update build system, add HTML route

## Success Criteria

1. Run `bun prompt-bench/ui/build.ts all` - should build review.js without errors
2. Start server: `bun run prompt-bench/ui/server.ts`
3. Navigate to `http://localhost:8181/review`
4. Verify pending images load (images with AI eval but no human rating)
5. Rate an image → verify human eval saved in database
6. Refresh page → rated image should not appear in pending list
7. Check `prompt_evaluations` table for `evaluator_type = 'human'`

## Execution Instructions

1. Execute tasks in numerical order (01 → 04)
2. Each task file contains:
   - Files to modify/create
   - Implementation details
   - Acceptance criteria
   - Dependencies
3. Verify acceptance criteria before moving to next task

## Dependencies

**Existing Infrastructure:**
- Bun HTTP server (port 8181)
- React + shadcn/ui component library
- Supabase admin client for database access
- `prompt_evaluations` table with `evaluator_type` field (already supports 'human')

**No schema changes required** - uses existing database structure.

## Architecture Notes

- Human ratings stored in `prompt_evaluations` with `evaluator_type = 'human'`
- Multi-image runs: each image rated separately, `imageIndex` stored in `details` field
- Source images resolved via `parent_run_id` → parent analysis run's `source_image_url`
- Follows existing UI patterns from EvaluationPhase.tsx
