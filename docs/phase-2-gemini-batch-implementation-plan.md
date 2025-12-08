# Phase 2: Batch Processing Implementation Plan (Gemini Batch API)

## Overview

Implement batch image generation for ProductPix using **Gemini Batch API** for 50% cost savings. Users upload CSV files with product data, the system submits to Gemini Batch API, polls for completion via Vercel Cron, and processes results with real-time status updates via Supabase Realtime.

**User Requirements:**
- Source images: URL references in CSV (fetched during batch creation, embedded in JSONL)
- Credit model: Upfront consumption, refund on failures
- Progress: Batch-level status via Supabase Realtime (no per-item granularity until completion)
- Batch limit: 100 items maximum

## Architecture Decisions

- **Batch Processing**: Gemini Batch API (50% cost, up to 24hr turnaround, automatic retry)
- **Polling**: Vercel Cron every 5 minutes (free on Vercel Pro)
- **Progress Updates**: Supabase Realtime on batch_jobs table (already in stack)
- **Credit Consumption**: Upfront atomic transaction via RPC, refund failed items on completion
- **Source Images**: Fetch and base64-encode during batch creation (inline_data in JSONL)
- **Results Processing**: Download JSONL, upload images to R2, create generated_images records

## Cost Analysis

**Per 100-item batch:**
- Gemini Batch API: ~$0.50-2.00 (50% off standard pricing)
- Vercel Cron: $0 (included in Pro plan)
- R2 storage: ~$0.01
- **Total: ~$0.50-2.00 per batch**

**Monthly at 300 batches (10/day):**
- Gemini: ~$150-600
- Infrastructure: $0
- **Total: ~$150-600/month**

Compare to Trigger.dev approach: ~$250-900/month (Gemini full price + Trigger.dev fees)

## Implementation Tasks

### Phase 2A: Database Schema

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
      'pending', 'processing', 'completed', 'failed'
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
      gemini_batch_id TEXT UNIQUE,
      gemini_file_id TEXT,
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
      generated_image_id UUID REFERENCES public.generated_images(id),
      error_message TEXT,
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(batch_id, sequence_number)
    );

    -- Indexes
    CREATE INDEX idx_batch_jobs_user_id ON public.batch_jobs(user_id);
    CREATE INDEX idx_batch_jobs_status ON public.batch_jobs(status);
    CREATE INDEX idx_batch_jobs_created_at ON public.batch_jobs(created_at DESC);
    CREATE INDEX idx_batch_jobs_gemini_batch_id ON public.batch_jobs(gemini_batch_id);
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
    ```sql
    -- create_batch_job: Atomic credit consumption + batch creation
    CREATE OR REPLACE FUNCTION create_batch_job(
      p_user_id UUID,
      p_name TEXT,
      p_total_items INTEGER,
      p_credits_to_charge INTEGER,
      p_default_prompt TEXT DEFAULT NULL,
      p_parameters JSONB DEFAULT '{}'
    ) RETURNS UUID AS $$
    DECLARE
      v_batch_id UUID;
      v_current_credits INTEGER;
    BEGIN
      -- Check credits
      SELECT credits INTO v_current_credits
      FROM users WHERE id = p_user_id FOR UPDATE;

      IF v_current_credits < p_credits_to_charge THEN
        RAISE EXCEPTION 'Insufficient credits';
      END IF;

      -- Consume credits
      UPDATE users
      SET credits = credits - p_credits_to_charge
      WHERE id = p_user_id;

      -- Create credit transaction
      INSERT INTO credit_transactions (user_id, amount, transaction_type, description)
      VALUES (p_user_id, -p_credits_to_charge, 'debit', 'Batch generation: ' || p_name);

      -- Create batch job
      INSERT INTO batch_jobs (
        user_id, name, total_items, credits_charged,
        default_prompt, parameters
      ) VALUES (
        p_user_id, p_name, p_total_items, p_credits_to_charge,
        p_default_prompt, p_parameters
      ) RETURNING id INTO v_batch_id;

      RETURN v_batch_id;
    END;
    $$ LANGUAGE plpgsql;

    -- update_batch_progress: Update counters and status
    CREATE OR REPLACE FUNCTION update_batch_progress(
      p_batch_id UUID,
      p_completed INTEGER,
      p_failed INTEGER
    ) RETURNS VOID AS $$
    DECLARE
      v_total INTEGER;
      v_new_status batch_job_status;
    BEGIN
      SELECT total_items INTO v_total FROM batch_jobs WHERE id = p_batch_id;

      -- Determine status
      IF (p_completed + p_failed) >= v_total THEN
        v_new_status := 'completed';
      ELSE
        v_new_status := 'processing';
      END IF;

      UPDATE batch_jobs
      SET
        completed_items = p_completed,
        failed_items = p_failed,
        status = v_new_status,
        completed_at = CASE WHEN v_new_status = 'completed' THEN NOW() ELSE NULL END
      WHERE id = p_batch_id;
    END;
    $$ LANGUAGE plpgsql;

    -- refund_batch_failures: Refund for failed items
    CREATE OR REPLACE FUNCTION refund_batch_failures(
      p_batch_id UUID,
      p_credits_per_item INTEGER
    ) RETURNS INTEGER AS $$
    DECLARE
      v_user_id UUID;
      v_failed_count INTEGER;
      v_refund_amount INTEGER;
    BEGIN
      SELECT user_id, failed_items INTO v_user_id, v_failed_count
      FROM batch_jobs WHERE id = p_batch_id;

      v_refund_amount := v_failed_count * p_credits_per_item;

      IF v_refund_amount > 0 THEN
        -- Add credits back
        UPDATE users
        SET credits = credits + v_refund_amount
        WHERE id = v_user_id;

        -- Create credit transaction
        INSERT INTO credit_transactions (user_id, amount, transaction_type, description)
        VALUES (v_user_id, v_refund_amount, 'credit', 'Batch refund: failed items');

        -- Update batch
        UPDATE batch_jobs
        SET credits_refunded = v_refund_amount
        WHERE id = p_batch_id;
      END IF;

      RETURN v_refund_amount;
    END;
    $$ LANGUAGE plpgsql;
    ```

- [ ] Regenerate TypeScript types
  - Files: `src/types/database.ts` (modify)
  - Command: `npx supabase gen types ts --local > src/types/database.ts`
  - Acceptance: BatchJob, BatchItem types available

- [ ] Create batch database utilities
  - Files: `src/lib/db/batch.ts` (new), `src/lib/db/index.ts` (modify)
  - Tests: `src/lib/db/__tests__/batch.test.ts` (new)
  - Acceptance: Functions exported, tests pass
  - Functions:
    - `createBatchJob(userId, name, totalItems, creditsToCharge, defaultPrompt, parameters)`
    - `getBatchJob(batchId)`
    - `getUserBatches(userId, options: { status?, limit?, offset? })`
    - `updateBatchStatus(batchId, status, errorMessage?)`
    - `updateBatchGeminiIds(batchId, geminiBatchId, geminiFileId)`
    - `getBatchItems(batchId)`
    - `updateBatchItem(itemId, data: { status?, generated_image_id?, error_message? })`

### Phase 2B: Gemini Integration

- [ ] Install Gemini SDK
  - Files: `package.json` (modify)
  - Command: `bun add @google/generative-ai`
  - Acceptance: Package in dependencies

- [ ] Create Gemini batch client
  - Files: `src/lib/ai/gemini-batch.ts` (new)
  - Tests: `src/lib/ai/__tests__/gemini-batch.test.ts` (new)
  - Acceptance: Client functions work, tests pass
  - Functions:
    ```typescript
    import { GoogleGenAI } from '@google/generative-ai';

    const client = new GoogleGenAI({
      apiKey: process.env.GOOGLE_AI_API_KEY
    });

    export async function createBatchJob(params: {
      items: Array<{
        id: string;
        prompt: string;
        sourceImageUrl?: string;
        aspectRatio: string;
        resolution: string;
      }>;
      batchName: string;
    }) {
      // 1. Fetch source images if URLs provided
      const itemsWithImages = await Promise.all(
        params.items.map(async (item) => {
          if (item.sourceImageUrl) {
            const imageData = await fetchImageAsBase64(item.sourceImageUrl);
            return { ...item, imageData };
          }
          return item;
        })
      );

      // 2. Build JSONL content
      const requests = itemsWithImages.map((item) => ({
        key: `item-${item.id}`,
        request: {
          contents: [{
            parts: [
              item.imageData ? {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: item.imageData
                }
              } : null,
              { text: item.prompt }
            ].filter(Boolean)
          }],
          generation_config: {
            responseModalities: ['IMAGE'],
            // Map resolution to Gemini params
          }
        }
      }));

      const jsonlContent = requests.map(r => JSON.stringify(r)).join('\n');

      // 3. Upload JSONL to Gemini File API
      const uploadedFile = await client.files.upload({
        file: Buffer.from(jsonlContent),
        config: {
          mimeType: 'jsonl',
          displayName: `${params.batchName}-input`
        }
      });

      // 4. Create batch job
      const batchJob = await client.batches.create({
        model: 'gemini-3-pro-image-preview',
        src: uploadedFile.name,
        config: {
          displayName: params.batchName
        }
      });

      return {
        geminiBatchId: batchJob.name,
        geminiFileId: uploadedFile.name
      };
    }

    export async function getBatchStatus(geminiBatchId: string) {
      const job = await client.batches.get({ name: geminiBatchId });
      return {
        state: job.state,
        error: job.error,
        destFileName: job.dest?.fileName
      };
    }

    export async function cancelBatch(geminiBatchId: string) {
      await client.batches.cancel({ name: geminiBatchId });
    }

    export async function downloadResults(fileName: string) {
      const buffer = await client.files.download({ file: fileName });
      return buffer.toString('utf-8');
    }

    async function fetchImageAsBase64(url: string): Promise<string> {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer).toString('base64');
    }
    ```

### Phase 2C: API Routes

- [ ] Create CSV parsing route
  - Files: `src/app/api/batch/parse-csv/route.ts` (new)
  - Tests: `src/app/api/batch/__tests__/parse-csv.test.ts` (new)
  - Acceptance: Valid CSV returns parsed items, invalid returns errors
  - Implementation:
    ```typescript
    import { z } from 'zod';

    const batchItemSchema = z.object({
      product_name: z.string().optional(),
      prompt: z.string().min(1),
      source_image_url: z.string().url().optional(),
      aspect_ratio: z.enum(['1:1', '16:9', '9:16']).default('1:1'),
      resolution: z.enum(['1k', '2k', '4k']).default('1k')
    });

    export async function POST(req: Request) {
      const formData = await req.formData();
      const file = formData.get('file') as File;

      if (!file || !file.name.endsWith('.csv')) {
        return Response.json({ error: 'Invalid file' }, { status: 400 });
      }

      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());

      if (lines.length > 101) { // Header + 100 items
        return Response.json({ error: 'Max 100 items' }, { status: 400 });
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const items = [];
      const errors = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = Object.fromEntries(
          headers.map((h, idx) => [h, values[idx]])
        );

        const result = batchItemSchema.safeParse(row);
        if (result.success) {
          items.push({ ...result.data, sequence: i });
        } else {
          errors.push({ line: i + 1, errors: result.error.errors });
        }
      }

      return Response.json({ items, errors });
    }
    ```

- [ ] Create batch creation route
  - Files: `src/app/api/batch/route.ts` (new)
  - Tests: `src/app/api/batch/__tests__/batch.test.ts` (new)
  - Acceptance: Batch created, credits consumed, Gemini job started
  - POST Implementation:
    ```typescript
    import { createBatchJob as createGeminiBatch } from '@/lib/ai/gemini-batch';
    import { createBatchJob, updateBatchGeminiIds } from '@/lib/db/batch';

    export async function POST(req: Request) {
      const session = await getSession(req);
      if (!session) return unauthorized();

      const { name, items, parameters } = await req.json();

      // Validate
      if (!name || !items?.length || items.length > 100) {
        return Response.json({ error: 'Invalid input' }, { status: 400 });
      }

      // Calculate credits (1k=1, 2k=2, 4k=3 per item)
      const creditsPerItem = { '1k': 1, '2k': 2, '4k': 3 };
      const totalCredits = items.reduce(
        (sum, item) => sum + creditsPerItem[item.resolution || '1k'],
        0
      );

      try {
        // Create batch in DB (atomic credit consumption)
        const batchId = await createBatchJob(
          session.user.id,
          name,
          items.length,
          totalCredits,
          parameters.defaultPrompt,
          parameters
        );

        // Insert batch_items
        const itemRecords = await Promise.all(
          items.map((item, idx) =>
            supabase.from('batch_items').insert({
              batch_id: batchId,
              user_id: session.user.id,
              sequence_number: idx,
              product_name: item.product_name,
              prompt: item.prompt || parameters.defaultPrompt,
              source_image_url: item.source_image_url,
              parameters: {
                aspect_ratio: item.aspect_ratio,
                resolution: item.resolution
              }
            }).select().single()
          )
        );

        // Submit to Gemini Batch API
        const { geminiBatchId, geminiFileId } = await createGeminiBatch({
          items: itemRecords.map(r => ({
            id: r.data.id,
            prompt: r.data.prompt,
            sourceImageUrl: r.data.source_image_url,
            aspectRatio: r.data.parameters.aspect_ratio,
            resolution: r.data.parameters.resolution
          })),
          batchName: name
        });

        // Update batch with Gemini IDs
        await updateBatchGeminiIds(batchId, geminiBatchId, geminiFileId);
        await updateBatchStatus(batchId, 'processing');

        return Response.json({
          batchId,
          geminiBatchId,
          creditsCharged: totalCredits
        });
      } catch (error) {
        console.error('Batch creation failed:', error);
        return Response.json(
          { error: 'Failed to create batch' },
          { status: 500 }
        );
      }
    }

    // GET: List user's batches
    export async function GET(req: Request) {
      const session = await getSession(req);
      if (!session) return unauthorized();

      const { searchParams } = new URL(req.url);
      const status = searchParams.get('status');

      const batches = await getUserBatches(session.user.id, { status });
      return Response.json({ batches });
    }
    ```

- [ ] Create batch polling worker route
  - Files: `src/app/api/batch/poll-gemini/route.ts` (new)
  - Tests: Integration test with mock Gemini API
  - Acceptance: Processes completed batches, updates DB
  - Implementation:
    ```typescript
    import { getBatchStatus, downloadResults } from '@/lib/ai/gemini-batch';
    import { uploadToR2 } from '@/lib/r2/upload';

    export async function POST(req: Request) {
      // Verify Vercel Cron secret
      const authHeader = req.headers.get('authorization');
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get all processing batches
      const { data: batches } = await supabase
        .from('batch_jobs')
        .select('*')
        .eq('status', 'processing')
        .not('gemini_batch_id', 'is', null);

      let processed = 0;

      for (const batch of batches || []) {
        try {
          const status = await getBatchStatus(batch.gemini_batch_id);

          if (status.state === 'JOB_STATE_SUCCEEDED') {
            // Download results JSONL
            const resultsContent = await downloadResults(status.destFileName);

            let completedCount = 0;
            let failedCount = 0;

            // Process each line
            for (const line of resultsContent.split('\n')) {
              if (!line.trim()) continue;

              const parsed = JSON.parse(line);
              const itemId = parsed.key.replace('item-', '');

              if (parsed.response) {
                // Extract image from response
                const imagePart = parsed.response.candidates?.[0]?.content?.parts
                  ?.find(p => p.inlineData);

                if (imagePart) {
                  // Upload to R2
                  const imageBuffer = Buffer.from(
                    imagePart.inlineData.data,
                    'base64'
                  );
                  const r2Url = await uploadToR2({
                    buffer: imageBuffer,
                    fileName: `batch-${batch.id}-${itemId}.png`,
                    contentType: imagePart.inlineData.mimeType
                  });

                  // Create generated_image record
                  const { data: imageRecord } = await supabase
                    .from('generated_images')
                    .insert({
                      user_id: batch.user_id,
                      url: r2Url,
                      prompt: '', // Get from batch_item
                      parameters: {}
                    })
                    .select()
                    .single();

                  // Update batch_item
                  await supabase
                    .from('batch_items')
                    .update({
                      status: 'completed',
                      generated_image_id: imageRecord.id,
                      completed_at: new Date().toISOString()
                    })
                    .eq('id', itemId);

                  completedCount++;
                }
              } else if (parsed.error) {
                // Mark as failed
                await supabase
                  .from('batch_items')
                  .update({
                    status: 'failed',
                    error_message: parsed.error.message,
                    completed_at: new Date().toISOString()
                  })
                  .eq('id', itemId);

                failedCount++;
              }
            }

            // Update batch progress
            await supabase.rpc('update_batch_progress', {
              p_batch_id: batch.id,
              p_completed: completedCount,
              p_failed: failedCount
            });

            // Refund failures
            if (failedCount > 0) {
              const creditsPerItem = { '1k': 1, '2k': 2, '4k': 3 };
              // Get resolution from first item
              const { data: firstItem } = await supabase
                .from('batch_items')
                .select('parameters')
                .eq('batch_id', batch.id)
                .limit(1)
                .single();

              const resolution = firstItem?.parameters?.resolution || '1k';
              await supabase.rpc('refund_batch_failures', {
                p_batch_id: batch.id,
                p_credits_per_item: creditsPerItem[resolution]
              });
            }

            processed++;
          } else if (status.state === 'JOB_STATE_FAILED') {
            // Mark batch as failed
            await supabase
              .from('batch_jobs')
              .update({
                status: 'failed',
                error_message: status.error?.message || 'Gemini batch failed',
                completed_at: new Date().toISOString()
              })
              .eq('id', batch.id);

            processed++;
          }
          // Other states (PENDING, RUNNING): do nothing, check next time
        } catch (error) {
          console.error(`Error processing batch ${batch.id}:`, error);
        }
      }

      return Response.json({ processed });
    }
    ```

- [ ] Create batch detail route
  - Files: `src/app/api/batch/[batchId]/route.ts` (new)
  - Tests: Integration test
  - Acceptance: Returns batch with items and images
  - GET Implementation:
    ```typescript
    export async function GET(
      req: Request,
      { params }: { params: { batchId: string } }
    ) {
      const session = await getSession(req);
      if (!session) return unauthorized();

      const { data: batch } = await supabase
        .from('batch_jobs')
        .select(`
          *,
          batch_items (
            *,
            generated_images (*)
          )
        `)
        .eq('id', params.batchId)
        .eq('user_id', session.user.id)
        .single();

      if (!batch) {
        return Response.json({ error: 'Not found' }, { status: 404 });
      }

      return Response.json({ batch });
    }
    ```

- [ ] Create batch cancel route
  - Files: `src/app/api/batch/[batchId]/cancel/route.ts` (new)
  - Tests: Integration test
  - Acceptance: Batch cancelled, Gemini job cancelled, pending refunded
  - POST Implementation:
    ```typescript
    import { cancelBatch } from '@/lib/ai/gemini-batch';

    export async function POST(
      req: Request,
      { params }: { params: { batchId: string } }
    ) {
      const session = await getSession(req);
      if (!session) return unauthorized();

      const { data: batch } = await supabase
        .from('batch_jobs')
        .select('*')
        .eq('id', params.batchId)
        .eq('user_id', session.user.id)
        .single();

      if (!batch) {
        return Response.json({ error: 'Not found' }, { status: 404 });
      }

      if (!['pending', 'processing'].includes(batch.status)) {
        return Response.json(
          { error: 'Cannot cancel completed batch' },
          { status: 400 }
        );
      }

      // Cancel Gemini batch
      if (batch.gemini_batch_id) {
        await cancelBatch(batch.gemini_batch_id);
      }

      // Update status
      await supabase
        .from('batch_jobs')
        .update({ status: 'cancelled' })
        .eq('id', params.batchId);

      // Refund pending items (not started yet)
      const { data: pendingItems } = await supabase
        .from('batch_items')
        .select('*')
        .eq('batch_id', params.batchId)
        .eq('status', 'pending');

      const refundAmount = pendingItems?.length || 0; // Simplified
      if (refundAmount > 0) {
        await supabase.rpc('refund_batch_failures', {
          p_batch_id: params.batchId,
          p_credits_per_item: 1 // TODO: Get actual resolution
        });
      }

      return Response.json({ success: true, refundedCredits: refundAmount });
    }
    ```

- [ ] Add Vercel Cron configuration
  - Files: `vercel.json` (new or modify)
  - Acceptance: Cron job runs every 5 minutes
  - Content:
    ```json
    {
      "crons": [
        {
          "path": "/api/batch/poll-gemini",
          "schedule": "*/5 * * * *"
        }
      ]
    }
    ```

- [ ] Add cron secret to environment
  - Files: `.env.local` (modify), `.env.example` (modify)
  - Vars: `CRON_SECRET` (generate random string)
  - Acceptance: Polling route rejects unauthorized requests

### Phase 2D: UI Components

- [ ] Create CSV upload form component
  - Files: `src/components/batch/csv-upload-form.tsx` (new)
  - Tests: `src/components/batch/__tests__/csv-upload-form.test.tsx` (new)
  - Acceptance: Drag-drop works, file validated, parsed items returned
  - Implementation:
    - Drag-and-drop zone
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
    - Error list if validation errors
    - Confirm/Cancel buttons

- [ ] Create batch status component
  - Files: `src/components/batch/batch-status.tsx` (new)
  - Tests: `src/components/batch/__tests__/batch-status.test.tsx` (new)
  - Acceptance: Real-time batch status updates display
  - Implementation:
    ```typescript
    'use client';
    import { useEffect, useState } from 'react';
    import { supabase } from '@/lib/supabase/client';

    export function BatchStatus({ batchId }: { batchId: string }) {
      const [batch, setBatch] = useState(null);

      useEffect(() => {
        // Subscribe to batch_jobs changes
        const channel = supabase
          .channel('batch-status')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'batch_jobs',
              filter: `id=eq.${batchId}`
            },
            (payload) => {
              setBatch(payload.new);
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }, [batchId]);

      if (!batch) return <div>Loading...</div>;

      const progress = batch.total_items > 0
        ? ((batch.completed_items + batch.failed_items) / batch.total_items) * 100
        : 0;

      return (
        <div>
          <h3>Status: {batch.status}</h3>
          <div className="progress-bar">
            <div style={{ width: `${progress}%` }} />
          </div>
          <p>
            {batch.completed_items} completed, {batch.failed_items} failed,
            {batch.total_items - batch.completed_items - batch.failed_items} remaining
          </p>
          {batch.status === 'processing' && (
            <p className="text-sm text-muted">
              Processing via Gemini Batch API. Results available soon.
            </p>
          )}
        </div>
      );
    }
    ```

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
    - Show image if completed, placeholder if pending, error if failed
    - Hover: show prompt, product name
    - Click: expand image

- [ ] Create batch actions component
  - Files: `src/components/batch/batch-actions.tsx` (new)
  - Acceptance: Cancel button works
  - Implementation:
    - Cancel button (calls `/api/batch/[id]/cancel`)
    - Disabled if status is completed/failed/cancelled
    - Download all button (future)

### Phase 2E: Pages

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
  - Acceptance: Shows status (realtime) and results
  - Implementation:
    - Server component for initial data
    - Auth redirect, ownership check
    - If processing: show BatchStatus (client component with realtime)
    - Show BatchItemGrid with results
    - Show BatchActions

### Phase 2F: Integration

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
- [ ] Gemini Batch API job created successfully
- [ ] Polling worker processes completed batches
- [ ] Generated images uploaded to R2
- [ ] Real-time status updates display correctly
- [ ] Failed items refund credits
- [ ] Cancel stops Gemini job and refunds pending items
- [ ] Works with 1, 10, and 100 item batches

## Files to Create

```
src/lib/ai/
  gemini-batch.ts
  __tests__/gemini-batch.test.ts
src/lib/db/
  batch.ts
  __tests__/batch.test.ts
src/app/api/batch/
  route.ts
  parse-csv/route.ts
  poll-gemini/route.ts
  [batchId]/route.ts
  [batchId]/cancel/route.ts
  __tests__/parse-csv.test.ts
  __tests__/batch.test.ts
src/app/batch/
  page.tsx
  new/page.tsx
  [batchId]/page.tsx
src/components/batch/
  csv-upload-form.tsx
  batch-preview.tsx
  batch-status.tsx
  batch-list.tsx
  batch-item-grid.tsx
  batch-actions.tsx
  __tests__/csv-upload-form.test.tsx
  __tests__/batch-status.test.tsx
supabase/migrations/
  00016_create_batch_tables.sql
  00017_batch_rpc_functions.sql
public/templates/
  batch-template.csv
vercel.json
```

## Files to Modify

```
package.json (add @google/generative-ai)
.env.local (add CRON_SECRET)
.env.example (document CRON_SECRET)
src/types/database.ts (regenerate)
src/lib/db/index.ts (export batch)
src/components/layout/header.tsx (add nav link)
src/app/dashboard/page.tsx (add batch section)
```

## Dependencies

**New npm packages:**
- `@google/generative-ai` (Gemini SDK)

**Environment variables:**
- `GOOGLE_AI_API_KEY` (already exists)
- `CRON_SECRET` (random string for Vercel Cron auth)

**External services:**
- Google AI Gemini API (already in use)
- Vercel Cron (free on Pro plan)

## Testing Strategy

1. **Unit Tests:**
   - CSV parsing logic
   - Credit calculation
   - Batch database utilities
   - Gemini batch client functions

2. **Integration Tests:**
   - API routes with mock Gemini SDK
   - Credit consumption/refund flow
   - Polling worker with mock batches

3. **Manual E2E Tests:**
   - Upload CSV → Monitor status → View results
   - Cancel mid-processing
   - Handle partial failures
   - Test with 1, 10, 100 items

## Implementation Timeline

- **Phase 2A (Database)**: 1 day
- **Phase 2B (Gemini Integration)**: 1-2 days
- **Phase 2C (API Routes)**: 1-2 days
- **Phase 2D (UI Components)**: 1 day
- **Phase 2E (Pages)**: 1 day
- **Phase 2F (Integration)**: 0.5 day

**Total: 5.5-7.5 days**

## Notes

- Gemini Batch API has **24hr SLO** but often completes much faster
- No per-item progress until batch completes (limitation of Gemini Batch API)
- Source images fetched during batch creation (adds 30-60s for 100 items)
- Polling interval (5 min) can be adjusted based on needs
- **50% cost savings** on Gemini API compared to real-time generation
- Zero infrastructure costs (Vercel Cron is free)
- Simpler than Trigger.dev approach (no orchestration, no per-run fees)

## Future Enhancements

- Retry individual failed items
- Download all images as ZIP
- Email notification on completion
- Batch templates (save common configurations)
- Bulk edit prompts before submission
