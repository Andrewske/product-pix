// src/app/api/batch/poll-gemini/route.ts
// This route is called by Vercel Cron to poll Gemini Batch API for completed jobs
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getBatchStatus, downloadResults } from '@/lib/ai/gemini-batch';
import {
  updateBatchProgress,
  refundBatchFailures,
  getBatchItems,
  updateBatchItem,
} from '@/lib/db/batch';
import { uploadBuffer } from '@/lib/r2/upload';
import { createGeneratedImage } from '@/lib/db/generated-images';
import { getBatchItemParameters } from '@/lib/db/types';
import { createGenerationError, ErrorCodes } from '@/lib/errors';
import { captureError } from '@/lib/observability/capture-error';

// =============================================================================
// Gemini Batch Response Types
// =============================================================================

interface GeminiInlineData {
  data: string;
  mimeType?: string;
}

interface GeminiContentPart {
  inlineData?: GeminiInlineData;
}

interface GeminiCandidate {
  content?: {
    parts?: GeminiContentPart[];
  };
}

interface GeminiBatchResponseLine {
  key?: string;
  response?: {
    candidates?: GeminiCandidate[];
  };
  error?: string | { message?: string };
}

// =============================================================================
// Type Guards
// =============================================================================

const isGeminiInlineData = (data: unknown): data is GeminiInlineData => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return typeof obj.data === 'string';
};

// =============================================================================
// Route Handler
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const supabase = createAdminClient();
  let processed = 0;

  try {
    // Get all processing batches
    const { data: batches, error: fetchError } = await supabase
      .from('batch_jobs')
      .select('*')
      .eq('status', 'processing')
      .not('gemini_batch_id', 'is', null);

    if (fetchError) {
      const generationError = createGenerationError(
        ErrorCodes.GENERATION_FAILED,
        'Failed to fetch processing batches',
        {
          severity: 'high',
          templateSlug: 'batch-poll',
          creditsConsumed: 0,
          retryable: true,
        }
      );

      await captureError(generationError, { route: '/api/batch/poll-gemini' });

      return NextResponse.json(
        { error: 'Failed to fetch batches' },
        { status: 500 }
      );
    }

    if (!batches || batches.length === 0) {
      return NextResponse.json({ processed: 0 });
    }

    for (const batch of batches) {
      try {
        if (!batch.gemini_batch_id) continue;

        const status = await getBatchStatus(batch.gemini_batch_id);

        if (status.state === 'JOB_STATE_SUCCEEDED') {
          if (!status.destFileName) {
            const generationError = createGenerationError(
              ErrorCodes.GENERATION_INVALID_INPUT,
              `No destination file for batch ${batch.id}`,
              {
                severity: 'high',
                templateSlug: 'batch-poll',
                creditsConsumed: 0,
                retryable: true,
              }
            );

            await captureError(generationError, { route: '/api/batch/poll-gemini' });
            continue;
          }

          // Download results JSONL
          const resultsContent = await downloadResults(status.destFileName);

          let completedCount = 0;
          let failedCount = 0;

          // Process each line
          for (const line of resultsContent.split('\n')) {
            if (!line.trim()) continue;

            try {
              const parsed: GeminiBatchResponseLine = JSON.parse(line);
              const key = parsed.key;
              if (!key || !key.startsWith('item-')) continue;

              const itemId = key.replace('item-', '');

              if (parsed.response) {
                // Extract image from response
                const imagePart = parsed.response.candidates?.[0]?.content?.parts?.find(
                  (p) => p.inlineData !== undefined
                );

                if (imagePart?.inlineData && isGeminiInlineData(imagePart.inlineData)) {
                  // Upload to R2
                  const imageBuffer = Buffer.from(
                    imagePart.inlineData.data,
                    'base64'
                  );
                  const mimeType = imagePart.inlineData.mimeType || 'image/png';
                  const format = mimeType.split('/')[1] as 'png' | 'jpeg' | 'webp';

                  const fileKey = `generated/${batch.user_id}/batch-${batch.id}-${itemId}.${format}`;
                  const uploadResult = await uploadBuffer(
                    imageBuffer,
                    fileKey,
                    mimeType
                  );

                  // Get batch item to get prompt
                  const batchItems = await getBatchItems(batch.id);
                  const batchItem = batchItems.find((item) => item.id === itemId);

                  if (!batchItem) {
                    const generationError = createGenerationError(
                      ErrorCodes.GENERATION_FAILED,
                      `Batch item ${itemId} not found`,
                      {
                        severity: 'high',
                        templateSlug: 'batch-poll',
                        creditsConsumed: 0,
                        retryable: true,
                      }
                    );

                    await captureError(generationError, { route: '/api/batch/poll-gemini' });
                    continue;
                  }

                  // Create generated_image record
                  const generatedImage = await createGeneratedImage({
                    jobId: '', // Batch items don't have individual jobs
                    userId: batch.user_id,
                    fileKey: uploadResult.fileKey,
                    publicUrl: uploadResult.publicUrl,
                    width: 1024, // Default, will be updated if available
                    height: 1024,
                    fileSize: imageBuffer.length,
                  });

                  if (generatedImage) {
                    // Update batch_item
                    await updateBatchItem(itemId, {
                      status: 'completed',
                      generated_image_id: generatedImage.id,
                    });

                    completedCount++;
                  } else {
                    const generationError = createGenerationError(
                      ErrorCodes.GENERATION_FAILED,
                      `Failed to create generated image for item ${itemId}`,
                      {
                        severity: 'high',
                        templateSlug: 'batch-poll',
                        creditsConsumed: 0,
                        retryable: true,
                      }
                    );

                    await captureError(generationError, { route: '/api/batch/poll-gemini' });

                    await updateBatchItem(itemId, {
                      status: 'failed',
                      error_message: 'Failed to create image record',
                    });
                    failedCount++;
                  }
                } else {
                  // No image in response
                  await updateBatchItem(itemId, {
                    status: 'failed',
                    error_message: 'No image in response',
                  });
                  failedCount++;
                }
              } else if (parsed.error) {
                // Mark as failed
                await updateBatchItem(itemId, {
                  status: 'failed',
                  error_message:
                    typeof parsed.error === 'string'
                      ? parsed.error
                      : parsed.error.message || 'Unknown error',
                });
                failedCount++;
              }
            } catch (parseError) {
              const generationError = createGenerationError(
                ErrorCodes.GENERATION_FAILED,
                `Error parsing result line: ${line}`,
                {
                  severity: 'medium',
                  templateSlug: 'batch-poll',
                  creditsConsumed: 0,
                  retryable: true,
                }
              );

              await captureError(generationError, { route: '/api/batch/poll-gemini' });
              // Continue processing other lines
            }
          }

          // Update batch progress
          await updateBatchProgress(batch.id, completedCount, failedCount);

          // Refund failures
          if (failedCount > 0) {
            const creditsPerItem = { '1k': 1, '2k': 2, '4k': 3 } as const;
            // Get resolution from first item
            const batchItems = await getBatchItems(batch.id);
            const firstItem = batchItems[0];
            const params = firstItem ? getBatchItemParameters(firstItem.parameters) : null;
            const resolution = params?.resolution || '1k';

            await refundBatchFailures(
              batch.id,
              creditsPerItem[resolution]
            );
          }

          processed++;
        } else if (status.state === 'JOB_STATE_FAILED') {
          // Mark batch as failed
          await supabase
            .from('batch_jobs')
            .update({
              status: 'failed',
              error_message:
                status.error?.message || 'Gemini batch failed',
              completed_at: new Date().toISOString(),
            })
            .eq('id', batch.id);

          processed++;
        } else if (
          ['JOB_STATE_CANCELLED', 'JOB_STATE_EXPIRED'].includes(status.state)
        ) {
          // Mark batch as cancelled
          await supabase
            .from('batch_jobs')
            .update({
              status: 'cancelled',
              error_message: `Batch ${status.state.toLowerCase()}`,
              completed_at: new Date().toISOString(),
            })
            .eq('id', batch.id);

          processed++;
        }
        // Other states (PENDING, RUNNING): do nothing, check next time
      } catch (error) {
        const generationError = createGenerationError(
          ErrorCodes.GENERATION_FAILED,
          `Error processing batch ${batch.id}`,
          {
            severity: 'high',
            templateSlug: 'batch-poll',
            creditsConsumed: 0,
            retryable: true,
          }
        );

        await captureError(generationError, { route: '/api/batch/poll-gemini' });
        // Continue with next batch
      }
    }

    return NextResponse.json({ processed });
  } catch (error) {
    const generationError = createGenerationError(
      ErrorCodes.GENERATION_FAILED,
      'Batch polling failed',
      {
        severity: 'high',
        templateSlug: 'batch-poll',
        creditsConsumed: 0,
        retryable: true,
      }
    );

    await captureError(generationError, { route: '/api/batch/poll-gemini' });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

