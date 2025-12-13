// src/app/api/batch/[batchId]/cancel/route.ts
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getBatchJob, getBatchItems } from '@/lib/db/batch';
import { cancelBatch } from '@/lib/ai/gemini-batch';
import { getBatchItemParameters } from '@/lib/db/types';
import { getCreditsForResolution } from '@/lib/pricing/credits';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/api-middleware';
import { createGenerationError, createCreditError, ErrorCodes } from '@/lib/errors';
import { captureError } from '@/lib/observability/capture-error';

const cancelBatchHandler = async (
  request: AuthenticatedRequest,
  { params }: { params: { batchId: string } }
): Promise<NextResponse> => {
  try {
    const { batchId } = params;

    const batch = await getBatchJob(batchId);

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (batch.user_id !== request.user.id) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    if (!['pending', 'processing'].includes(batch.status)) {
      return NextResponse.json(
        { error: 'Cannot cancel completed batch' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // Cancel Gemini batch
    if (batch.gemini_batch_id) {
      try {
        await cancelBatch(batch.gemini_batch_id);
      } catch (error) {
        const generationError = createGenerationError(
          ErrorCodes.GENERATION_FAILED,
          'Error cancelling Gemini batch',
          {
            severity: 'medium',
            templateSlug: 'batch-cancel',
            creditsConsumed: 0,
            retryable: true,
          }
        );

        await captureError(generationError, { route: '/api/batch/[batchId]/cancel' });
        // Continue with cancellation even if Gemini API fails
      }
    }

    // Update status
    await adminSupabase
      .from('batch_jobs')
      .update({ status: 'cancelled' })
      .eq('id', batchId);

    // Refund pending items (not started yet)
    const items = await getBatchItems(batchId);
    const pendingItems = items.filter((item) => item.status === 'pending');

    let refundAmount = 0;
    if (pendingItems.length > 0) {
      // Get resolution from first item
      const firstItem = items[0];
      const params = firstItem ? getBatchItemParameters(firstItem.parameters) : null;
      const resolution = params?.resolution || '1k';

      // Calculate refund for pending items
      const creditsPerPendingItem = getCreditsForResolution(resolution);
      refundAmount = pendingItems.length * creditsPerPendingItem;

      // Refund credits using the add_credits RPC function
      const { error: refundError } = await adminSupabase.rpc('add_credits', {
        p_user_id: request.user.id,
        p_amount: refundAmount,
        p_type: 'refund',
        p_description: `Batch cancellation refund: ${batch.name}`,
      });

      if (refundError) {
        const creditError = createCreditError(
          ErrorCodes.CREDIT_REFUND_FAILED,
          'Error refunding credits for batch cancellation',
          {
            severity: 'critical',
            amount: refundAmount,
            operation: 'refund',
            userId: request.user.id,
          }
        );

        await captureError(creditError, { route: '/api/batch/[batchId]/cancel' });
      }
    }

    return NextResponse.json({
      success: true,
      refundedCredits: refundAmount,
    });
  } catch (error) {
    const generationError = createGenerationError(
      ErrorCodes.GENERATION_FAILED,
      'Error cancelling batch',
      {
        severity: 'high',
        templateSlug: 'batch-cancel',
        creditsConsumed: 0,
        retryable: true,
      }
    );

    await captureError(generationError, { route: '/api/batch/[batchId]/cancel' });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

export const POST = withAuth(cancelBatchHandler);

