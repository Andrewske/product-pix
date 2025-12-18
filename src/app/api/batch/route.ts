// src/app/api/batch/route.ts
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  createBatchJob,
  updateBatchGeminiIds,
  updateBatchStatus,
} from '@/lib/db/batch';
import { createBatchJob as createGeminiBatch } from '@/lib/ai/gemini-batch';
import { getBatchItemParameters } from '@/lib/db/types';
import { calculateGenerationCost } from '@/lib/pricing';
import { getTemplateBySlug } from '@/lib/db/templates';
import { buildPromptFromTemplate } from '@/lib/ai/prompt-builder';
import { logger } from '@/lib/logging';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/api-middleware';
import { z } from 'zod';

const createBatchSchema = z.object({
  name: z.string().min(1).max(255),
  items: z
    .array(
      z.object({
        product_name: z.string().optional(),
        template_slug: z.string().min(1),
        source_image_url: z.string().url().optional(),
        aspect_ratio: z.enum(['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9']).default('1:1'),
        resolution: z.enum(['1k', '2k', '4k']).default('1k'),
        addons: z.array(z.string()).optional(),
      })
    )
    .min(1)
    .max(100),
  parameters: z
    .object({
      defaultTemplateSlug: z.string().optional(),
    })
    .optional()
    .default({}),
});

// POST: Create a new batch
const createBatchHandler = async (request: AuthenticatedRequest): Promise<NextResponse> => {
  try {
    // Validate request
    const body = await request.json();
    const parsed = createBatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { name, items, parameters } = parsed.data;

    // Calculate credits using new cost function (batch uploads = snail pricing)
    const totalCredits = items.reduce((sum, item) => {
      const cost = calculateGenerationCost({
        resolution: item.resolution,
        mode: 'snail', // Batch uploads always use snail pricing
        addons: item.addons as ('titleGeneration' | 'fancyBackground')[]
      });
      return sum + cost.total;
    }, 0);

    const adminSupabase = createAdminClient();

    try {
      // Resolve default template if provided
      if (parameters.defaultTemplateSlug) {
        const defaultTemplate = await getTemplateBySlug(parameters.defaultTemplateSlug);
        if (!defaultTemplate) {
          return NextResponse.json(
            { error: `Default template '${parameters.defaultTemplateSlug}' not found` },
            { status: 400 }
          );
        }
      }

      // Create batch in DB (atomic credit consumption)
      const batchId = await createBatchJob({
        userId: request.user.id,
        name,
        totalItems: items.length,
        creditsToCharge: totalCredits,
        defaultPrompt: null, // No longer using default prompts
        parameters,
      });

      // Insert batch_items
      const itemRecords = await Promise.all(
        items.map(async (item, idx) => {
          // Resolve template slug to ID
          const template = await getTemplateBySlug(item.template_slug);
          if (!template) {
            throw new Error(`Template '${item.template_slug}' not found for item ${idx + 1}`);
          }

          const insertData = {
            batch_id: batchId,
            user_id: request.user.id,
            sequence_number: idx,
            product_name: item.product_name || null,
            template_id: template.id,
            source_image_url: item.source_image_url || null,
            parameters: {
              aspect_ratio: item.aspect_ratio,
              resolution: item.resolution,
            } as const,
          };

          const { data, error } = await adminSupabase
            .from('batch_items')
            .insert(insertData)
            .select()
            .single();

          if (error) {
            throw new Error(`Failed to create batch item: ${error.message}`);
          }

          return data;
        })
      );

      // Resolve templates to prompts for Gemini Batch API
      const itemsWithPrompts = await Promise.all(
        itemRecords.map(async (r) => {
          const params = getBatchItemParameters(r.parameters);

          // Build prompt from template (without analysis for batch processing)
          let prompt = '';
          if (r.template_id) {
            const promptResult = await buildPromptFromTemplate(r.template_id, undefined);
            if (promptResult.ok) {
              prompt = promptResult.data;
            } else {
              logger.error('Failed to build prompt from template', {
                itemId: r.id,
                templateId: r.template_id,
                error: promptResult.error
              });
              throw new Error(`Failed to build prompt for item ${r.id}: ${promptResult.error.message}`);
            }
          } else {
            throw new Error(`No template_id found for item ${r.id}`);
          }

          return {
            id: r.id,
            prompt,
            sourceImageUrl: r.source_image_url || undefined,
            aspectRatio: params.aspect_ratio,
            resolution: params.resolution,
          };
        })
      );

      // Submit to Gemini Batch API
      const { geminiBatchId, geminiFileId } = await createGeminiBatch({
        items: itemsWithPrompts,
        batchName: name,
      });

      // Update batch with Gemini IDs
      await updateBatchGeminiIds(batchId, geminiBatchId, geminiFileId);
      await updateBatchStatus(batchId, 'processing');

      return NextResponse.json({
        batchId,
        geminiBatchId,
        creditsCharged: totalCredits,
      });
     } catch (error) {
       logger.error('Batch creation failed', { error });
       const message =
         error instanceof Error ? error.message : 'Failed to create batch';
       return NextResponse.json({ error: message }, { status: 500 });
     }
   } catch (error) {
     logger.error('Batch creation error', { error });
     return NextResponse.json(
       { error: 'Internal server error' },
       { status: 500 }
     );
   }
};

export const POST = withAuth(createBatchHandler);

// GET: List user's batches
const getBatchesHandler = async (request: AuthenticatedRequest): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as
      | 'pending'
      | 'processing'
      | 'completed'
      | 'cancelled'
      | 'failed'
      | null;

    const { getUserBatches } = await import('@/lib/db/batch');
    const batches = await getUserBatches(request.user.id, {
      status: status || undefined,
      limit: 50,
    });

    return NextResponse.json({ batches });
  } catch (error) {
    logger.error('Error fetching batches:', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

export const GET = withAuth(getBatchesHandler);

