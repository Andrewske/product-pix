# Phase 2: Batch Processing Implementation Plan

## Overview

Implement batch image generation for ProductPix using Trigger.dev v3 for background job processing. Users upload CSV files with product data, the system processes images in parallel with real-time progress updates, and provides job management (cancel, retry).

**User Requirements:**
- Source images: URL references in CSV (fetched during processing)
- Credit model: Upfront consumption, refund on failures
- Progress: Trigger.dev realtime React hooks
- Batch limit: 100 items maximum

## Architecture Decisions

- **Background Jobs**: Trigger.dev v3 (unlimited duration, native batch support, real-time metadata)
- **Progress Updates**: Trigger.dev React hooks (`@trigger.dev/react-hooks`) over Supabase Realtime (simpler, type-safe, native batch support)
- **Credit Consumption**: Upfront atomic transaction via RPC, refund failed items (matches Phase 1 pattern)
- **Task Pattern**: Coordinator task orchestrates child item tasks (centralized control, easier cancellation)
- **Concurrency**: Queue limit of 5 concurrent Gemini API calls (rate limiting)

## Implementation Tasks

### Phase 2A: Trigger.dev Setup

- [ ] Install Trigger.dev packages
  - Files: `package.json` (modify)
  - Command: `bun add @trigger.dev/sdk @trigger.dev/react-hooks`
  - Acceptance: Packages in dependencies

- [ ] Create Trigger.dev configuration
  - Files: `trigger.config.ts` (new)
  - Tests: Manual verification with `npx trigger.dev@latest dev`
  - Acceptance: Dev server starts without errors
  - Content:
    ```typescript
    import { defineConfig } from "@trigger.dev/sdk";
    export default defineConfig({
      project: "productpix-batch",
      runtime: "node",
      logLevel: "info",
      dirs: ["./src/trigger"],
    });
    ```

- [ ] Add environment variables
  - Files: `.env.local` (modify), `.env.example` (modify)
  - Vars: `TRIGGER_SECRET_KEY`, `TRIGGER_PROJECT_ID`
  - Acceptance: Variables documented and loaded

- [ ] Add npm scripts for development
  - Files: `package.json` (modify)
  - Scripts:
    - `"trigger:dev": "npx trigger.dev@latest dev"`
    - `"dev:all": "concurrently \"bun dev\" \"bun trigger:dev\""`
  - Acceptance: Both servers run with single command

- [ ] Create trigger directory structure
  - Files: `src/trigger/index.ts` (new)
  - Acceptance: Barrel export file exists

### Phase 2B: Database Schema

- [ ] Create batch job status enum and tables migration
  - Files: `supabase/migrations/00016_create_batch_tables.sql` (new)
  - Tests: `npx supabase db push` succeeds
  - Acceptance: Tables created in Supabase
  - Schema:
    ```sql
    -- batch_job_status enum
    CREATE TYPE batch_job_status AS ENUM (
      'pending', 'processing', 'completed', 'cancelled', 'failed'
    );

    -- batch_item_status enum
    CREATE TYPE batch_item_status AS ENUM (
      'pending', 'processing', 'completed', 'failed', 'skipped'
    );

    -- batch_jobs table
    CREATE TABLE public.batch_jobs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      status batch_job_status NOT NULL DEFAULT 'pending',
      total_items INTEGER NOT NULL,
      completed_items INTEGER NOT NULL DEFAULT 0,
      failed_items INTEGER NOT NULL DEFAULT 0,
      credits_charged INTEGER NOT NULL,
      credits_refunded INTEGER NOT NULL DEFAULT 0,
      default_prompt TEXT,
      parameters JSONB DEFAULT '{}',
      trigger_run_id TEXT,
      error_message TEXT,
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- batch_items table
    CREATE TABLE public.batch_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      batch_id UUID NOT NULL REFERENCES public.batch_jobs(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      sequence_number INTEGER NOT NULL,
      status batch_item_status NOT NULL DEFAULT 'pending',
      product_name TEXT,
      prompt TEXT NOT NULL,
      source_image_url TEXT,
      parameters JSONB DEFAULT '{}',
      trigger_run_id TEXT,
      generated_image_id UUID REFERENCES public.generated_images(id),
      error_message TEXT,
      retry_count INTEGER NOT NULL DEFAULT 0,
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(batch_id, sequence_number)
    );

    -- Indexes
    CREATE INDEX idx_batch_jobs_user_id ON public.batch_jobs(user_id);
    CREATE INDEX idx_batch_jobs_status ON public.batch_jobs(status);
    CREATE INDEX idx_batch_jobs_created_at ON public.batch_jobs(created_at DESC);
    CREATE INDEX idx_batch_items_batch_id ON public.batch_items(batch_id);
    CREATE INDEX idx_batch_items_status ON public.batch_items(status);

    -- RLS
    ALTER TABLE public.batch_jobs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.batch_items ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users view own batches" ON public.batch_jobs
      FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users create own batches" ON public.batch_jobs
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users update own batches" ON public.batch_jobs
      FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY "Users view own batch items" ON public.batch_items
      FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users create own batch items" ON public.batch_items
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    ```

- [ ] Create batch RPC functions migration
  - Files: `supabase/migrations/00017_batch_rpc_functions.sql` (new)
  - Tests: RPC functions callable from Supabase client
  - Acceptance: Functions exist and work atomically
  - Functions:
    - `create_batch_job(user_id, name, total_items, credits_per_item, default_prompt, parameters)` - Atomic credit consumption + batch creation
    - `update_batch_progress(batch_id, completed, failed)` - Update counters and status
    - `refund_batch_failures(batch_id, credits_per_item)` - Refund for failed items

- [ ] Regenerate TypeScript types
  - Files: `src/types/database.ts` (modify)
  - Command: `npx supabase gen types ts --local > src/types/database.ts`
  - Acceptance: BatchJob, BatchItem types available

- [ ] Create batch database utilities
  - Files: `src/lib/db/batch.ts` (new), `src/lib/db/index.ts` (modify)
  - Tests: `src/lib/db/__tests__/batch.test.ts` (new)
  - Acceptance: Functions exported, tests pass
  - Functions:
    - `createBatchJob(userId, name, items, parameters)`
    - `getBatchJob(batchId)`
    - `getUserBatches(userId, options)`
    - `updateBatchStatus(batchId, status)`
    - `getBatchItems(batchId)`
    - `updateBatchItem(itemId, data)`

### Phase 2C: Trigger.dev Tasks

- [ ] Create batch types
  - Files: `src/trigger/lib/batch-types.ts` (new)
  - Acceptance: Types exported and importable
  - Types:
    ```typescript
    export interface BatchCoordinatorPayload {
      batchId: string;
      userId: string;
    }

    export interface BatchItemPayload {
      batchId: string;
      itemId: string;
      userId: string;
      prompt: string;
      sourceImageUrl?: string;
      parameters: { aspectRatio: string; resolution: string };
    }

    export interface BatchProgress {
      total: number;
      completed: number;
      failed: number;
      status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    }
    ```

- [ ] Create generate batch item task
  - Files: `src/trigger/generate-batch-item.ts` (new)
  - Tests: Manual test via Trigger.dev dashboard
  - Acceptance: Single item generates successfully
  - Implementation:
    - Queue with `concurrencyLimit: 5`
    - Retry: 3 attempts, exponential backoff (2s, 4s, 8s)
    - Flow: Update item status → Fetch source image if URL provided → Call Gemini provider → Upload to R2 → Create generated_image record → Update batch item
    - On error: Update item with error_message, increment retry_count

- [ ] Create batch coordinator task
  - Files: `src/trigger/batch-coordinator.ts` (new)
  - Tests: Manual test with small batch (3 items)
  - Acceptance: Batch completes, progress metadata updates
  - Implementation:
    - Update batch status to 'processing'
    - Fetch all batch_items
    - Set initial progress metadata
    - Use `batch.triggerAndWait()` for all items
    - Track completed/failed counts
    - Call `update_batch_progress` RPC
    - If failures > 0, call `refund_batch_failures` RPC
    - Set final progress metadata

- [ ] Export tasks from index
  - Files: `src/trigger/index.ts` (modify)
  - Acceptance: Both tasks importable

### Phase 2D: API Routes

- [ ] Create CSV parsing route
  - Files: `src/app/api/batch/parse-csv/route.ts` (new)
  - Tests: `src/app/api/batch/__tests__/parse-csv.test.ts` (new)
  - Acceptance: Valid CSV returns parsed items, invalid returns errors
  - Implementation:
    - POST: Accept multipart form data with CSV file
    - Parse headers: `product_name`, `prompt` (required), `source_image_url`, `aspect_ratio`, `resolution`
    - Validate each row with Zod schema
    - Return: `{ items, errors, sourceImageUrls }`
    - Max 100 rows

- [ ] Create batch CRUD route
  - Files: `src/app/api/batch/route.ts` (new)
  - Tests: `src/app/api/batch/__tests__/batch.test.ts` (new)
  - Acceptance: Batch created, credits consumed, task triggered
  - POST Implementation:
    - Auth check
    - Validate: name (1-100 chars), items array (1-100), parameters
    - Calculate total credits (resolution-based: 1k=1, 2k=2, 4k=3)
    - Call `create_batch_job` RPC (atomic credit consumption)
    - Insert batch_items records
    - Trigger coordinator task
    - Return: `{ batchId, runId, publicAccessToken, creditsCharged }`
  - GET Implementation:
    - Auth check
    - Fetch user's batches with pagination
    - Optional status filter
    - Return: `{ batches }`

- [ ] Create batch detail route
  - Files: `src/app/api/batch/[batchId]/route.ts` (new)
  - Tests: Integration test
  - Acceptance: Returns batch with items
  - GET Implementation:
    - Auth check
    - Verify ownership
    - Fetch batch with items and generated_images
    - Return: `{ batch }`

- [ ] Create batch cancel route
  - Files: `src/app/api/batch/[batchId]/cancel/route.ts` (new)
  - Tests: Integration test
  - Acceptance: Batch cancelled, pending items refunded
  - POST Implementation:
    - Auth check, verify ownership
    - Verify status is 'pending' or 'processing'
    - Cancel Trigger.dev run via `runs.cancel()`
    - Update batch status to 'cancelled'
    - Count pending items, refund credits
    - Return: `{ success, refundedCredits }`

- [ ] Create realtime token route
  - Files: `src/app/api/batch/[batchId]/realtime-token/route.ts` (new)
  - Acceptance: Returns valid Trigger.dev access token
  - GET Implementation:
    - Auth check, verify ownership
    - Get trigger_run_id from batch
    - Create public access token via `auth.createPublicToken()`
    - Return: `{ publicAccessToken, runId }`

### Phase 2E: UI Components

- [ ] Create CSV upload form component
  - Files: `src/components/batch/csv-upload-form.tsx` (new)
  - Tests: `src/components/batch/__tests__/csv-upload-form.test.tsx` (new)
  - Acceptance: Drag-drop works, file validated, parsed items returned
  - Implementation:
    - Drag-and-drop zone (reuse pattern from upload-form.tsx)
    - Accept only .csv files
    - Call `/api/batch/parse-csv` on upload
    - Display validation errors inline
    - Callback: `onParsed(items, errors)`

- [ ] Create batch preview component
  - Files: `src/components/batch/batch-preview.tsx` (new)
  - Acceptance: Shows item count, credit cost, validation errors
  - Implementation:
    - Table of first 5 items with expand
    - Total items count
    - Credit cost calculation display
    - Error list if any validation errors
    - Confirm/Cancel buttons

- [ ] Create batch progress component
  - Files: `src/components/batch/batch-progress.tsx` (new)
  - Tests: `src/components/batch/__tests__/batch-progress.test.tsx` (new)
  - Acceptance: Real-time progress updates display
  - Implementation:
    - Use `useRealtimeRun` from `@trigger.dev/react-hooks`
    - Progress bar (completed + failed / total)
    - Stats: completed, failed, remaining
    - Status badge
    - Cancel button (if processing)

- [ ] Create batch list component
  - Files: `src/components/batch/batch-list.tsx` (new)
  - Acceptance: Lists batches with status, links to detail
  - Implementation:
    - Fetch batches on mount
    - Status filter tabs (all, processing, completed)
    - Card per batch: name, status badge, progress fraction, created date
    - Link to detail page

- [ ] Create batch item grid component
  - Files: `src/components/batch/batch-item-grid.tsx` (new)
  - Acceptance: Shows generated images with status
  - Implementation:
    - Grid of batch items
    - Show image if completed, placeholder if pending/processing, error if failed
    - Hover: show prompt, product name
    - Click: expand image

- [ ] Create batch actions component
  - Files: `src/components/batch/batch-actions.tsx` (new)
  - Acceptance: Cancel and retry buttons work
  - Implementation:
    - Cancel button (calls `/api/batch/[id]/cancel`)
    - Retry failed button (future)
    - Download all button (future)

### Phase 2F: Pages

- [ ] Create batch list page
  - Files: `src/app/batch/page.tsx` (new)
  - Acceptance: Shows user's batches, link to create
  - Implementation:
    - Server component, auth redirect
    - Fetch batches
    - Render BatchList component
    - "Create Batch" button linking to /batch/new

- [ ] Create new batch page
  - Files: `src/app/batch/new/page.tsx` (new)
  - Acceptance: Full create flow works
  - Implementation:
    - Client component
    - Step 1: CSV upload (CSVUploadForm)
    - Step 2: Preview and configure (BatchPreview)
    - Step 3: Confirm and submit
    - On submit: POST to /api/batch, redirect to detail page

- [ ] Create batch detail page
  - Files: `src/app/batch/[batchId]/page.tsx` (new)
  - Acceptance: Shows progress (realtime) and results
  - Implementation:
    - Server component for initial data
    - Auth redirect, ownership check
    - If processing: show BatchProgress (client component with realtime)
    - Show BatchItemGrid with results
    - Show BatchActions

### Phase 2G: Integration

- [ ] Update header navigation
  - Files: `src/components/layout/header.tsx` (modify)
  - Acceptance: Batch link visible in nav
  - Implementation: Add "Batches" link next to "Gallery"

- [ ] Add CSV template file
  - Files: `public/templates/batch-template.csv` (new)
  - Acceptance: Downloadable from batch/new page
  - Content:
    ```csv
    product_name,prompt,source_image_url,aspect_ratio,resolution
    "Example Product","Professional product photo on white background, soft shadows","https://example.com/image.jpg","1:1","1k"
    ```

- [ ] Update dashboard with batch stats
  - Files: `src/app/dashboard/page.tsx` (modify)
  - Acceptance: Shows recent batches or batch count
  - Implementation: Add section showing 3 most recent batches

## Acceptance Criteria

- [ ] All TypeScript compiles without errors (`bun tsc --noEmit`)
- [ ] All tests pass (`bun test`)
- [ ] Test coverage >=70% for new files
- [ ] CSV upload parses correctly (valid and invalid files)
- [ ] Batch creation consumes credits atomically
- [ ] Real-time progress updates display correctly
- [ ] Failed items refund credits
- [ ] Cancel stops processing and refunds pending items
- [ ] Works with 1, 10, and 100 item batches

## Files to Create

```
trigger.config.ts
src/trigger/
  index.ts
  lib/batch-types.ts
  generate-batch-item.ts
  batch-coordinator.ts
src/lib/db/
  batch.ts
  __tests__/batch.test.ts
src/app/api/batch/
  route.ts
  parse-csv/route.ts
  [batchId]/route.ts
  [batchId]/cancel/route.ts
  [batchId]/realtime-token/route.ts
  __tests__/parse-csv.test.ts
  __tests__/batch.test.ts
src/app/batch/
  page.tsx
  new/page.tsx
  [batchId]/page.tsx
src/components/batch/
  csv-upload-form.tsx
  batch-preview.tsx
  batch-progress.tsx
  batch-list.tsx
  batch-item-grid.tsx
  batch-actions.tsx
  __tests__/csv-upload-form.test.tsx
  __tests__/batch-progress.test.tsx
supabase/migrations/
  00016_create_batch_tables.sql
  00017_batch_rpc_functions.sql
public/templates/
  batch-template.csv
```

## Files to Modify

```
package.json (add deps, scripts)
.env.local (add TRIGGER_* vars)
.env.example (document TRIGGER_* vars)
src/types/database.ts (regenerate)
src/lib/db/index.ts (export batch)
src/components/layout/header.tsx (add nav link)
src/app/dashboard/page.tsx (add batch section)
```

## Dependencies

**New npm packages:**
- `@trigger.dev/sdk@^4.0.0`
- `@trigger.dev/react-hooks@^4.0.0`
- `concurrently` (dev dependency, if not already installed)

**Environment variables:**
- `TRIGGER_SECRET_KEY` - From Trigger.dev dashboard
- `TRIGGER_PROJECT_ID` - From Trigger.dev dashboard

**External services:**
- Trigger.dev account and project (https://trigger.dev)

**Internal dependencies:**
- Phase 2B depends on Phase 2A (Trigger.dev must be set up first)
- Phase 2C depends on Phase 2B (database must exist)
- Phase 2D depends on Phase 2C (tasks must exist to trigger)
- Phase 2E depends on Phase 2D (API must exist)
- Phase 2F depends on Phase 2E (components must exist)
- Phase 2G can be done in parallel with Phase 2F

## Testing Strategy

1. **Unit Tests:**
   - CSV parsing logic
   - Credit calculation
   - Batch database utilities

2. **Integration Tests:**
   - API routes with mock Trigger.dev
   - Credit consumption/refund flow

3. **Manual E2E Tests:**
   - Upload CSV → Monitor progress → View results
   - Cancel mid-processing
   - Handle partial failures

## Notes

- Trigger.dev tasks run in separate process, use admin Supabase client (bypass RLS)
- Source image URLs fetched at processing time (not upload time)
- Progress metadata available immediately via Trigger.dev hooks
- Credits refunded per-item for failures, not per-batch
