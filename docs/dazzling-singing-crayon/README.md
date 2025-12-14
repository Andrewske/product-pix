# Generation Feedback System - Task Breakdown

This directory contains the implementation tasks for the generation feedback system feature.

## Overview

Add thumbs up/down feedback to generated images for data capture. Users can rate results and provide reasons via interactive UI.

## Task Sequence

Execute tasks in numerical order. Each task builds on previous ones.

### 01. Database Foundation
Create `image_feedback` table with RLS policies, indexes, and triggers. Generate TypeScript types.

**Files:** Migration SQL, regenerated types
**Effort:** ~30 minutes
**Dependencies:** None

### 02. Types and Constants
Define TypeScript types and constants for feedback reasons, labels, and interfaces.

**Files:** `src/types/feedback.ts`, update `src/types/index.ts`
**Effort:** ~20 minutes
**Dependencies:** Task 01

### 03. Database Layer
Implement database access functions (submit, get, delete feedback) with tests.

**Files:** `src/lib/db/feedback.ts`, tests, update db index
**Effort:** ~45 minutes
**Dependencies:** Task 01, 02

### 04. API Endpoint
Create REST API endpoint (`/api/images/[id]/feedback`) with POST/GET/DELETE handlers, Zod validation, and ownership checks.

**Files:** `src/app/api/images/[id]/feedback/route.ts`, tests
**Effort:** ~60 minutes
**Dependencies:** Task 01, 02, 03

### 05. Feedback Hook
Build `useImageFeedback` hook with TanStack Query for state management and API integration.

**Files:** `src/hooks/use-image-feedback.ts`, tests
**Effort:** ~60 minutes
**Dependencies:** Task 02, 04

### 06. UI Components
Create FeedbackButtons, NegativeFeedbackModal, and PositiveFeedbackToast components with tests.

**Files:** `src/components/feedback/*`, tests
**Effort:** ~90 minutes
**Dependencies:** Task 02, 05

### 07. Integration
Integrate feedback UI into GenerationResult and ImageCard components.

**Files:** Modify existing components
**Effort:** ~45 minutes
**Dependencies:** Task 05, 06

## Total Estimated Effort
~5.5 hours (excluding testing/debugging time)

## Key Technical Decisions

- **TanStack Query:** Auto-deduplicates requests, no N+1 queries in galleries
- **Positive Flow:** Immediate save → multi-select toast → update on dismiss
- **Negative Flow:** Modal with checkboxes + optional comment
- **Security:** Image ownership validation (only generator can provide feedback)
- **UPSERT Pattern:** Unique constraint on (user_id, image_id) allows feedback changes

## Acceptance Criteria

All tasks complete when:
- [ ] All tests pass (`bun test`)
- [ ] No TypeScript errors (`bun run build`)
- [ ] Coverage ≥75% for new files
- [ ] Feedback submits successfully (manual test)
- [ ] Toast shows multi-select buttons with 10-15s duration
- [ ] Modal validates "Other" requires comment
- [ ] Feedback persists and loads on refresh
- [ ] Cannot submit feedback for others' images

## Implementation Notes

- **Phase 1-4:** Backend foundation (database → types → DB layer → API)
- **Phase 5-6:** Frontend foundation (hook → components)
- **Phase 7:** Integration into existing UI

Each task file contains:
- Files to modify/create
- Detailed implementation requirements
- Acceptance criteria
- Dependencies
- Technical notes

## Getting Started

1. Review task files in order (01-07)
2. Create feature branch: `git checkout -b feature/generation-feedback`
3. Execute tasks sequentially
4. Run tests after each task
5. Commit incrementally with descriptive messages

## Original Plan

Full planning document: `/home/kevin/.claude/plans/dazzling-singing-crayon.md`
