// src/app/api/batch/[batchId]/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getBatchJob, getBatchItems, refundBatchFailures } from '@/lib/db/batch';
import { cancelBatch } from '@/lib/ai/gemini-batch';
import { getBatchItemParameters } from '@/lib/db/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const batch = await getBatchJob(batchId);

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (batch.user_id !== user.id) {
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
        console.error('Error cancelling Gemini batch:', error);
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
      const creditsPerItem = { '1k': 1, '2k': 2, '4k': 3 } as const;
      // Get resolution from first item
      const firstItem = items[0];
      const params = firstItem ? getBatchItemParameters(firstItem.parameters) : null;
      const resolution = params?.resolution || '1k';

      // Calculate refund for pending items
      const creditsPerPendingItem = creditsPerItem[resolution];
      refundAmount = pendingItems.length * creditsPerPendingItem;

      // Refund credits using the add_credits RPC function
      const { error: refundError } = await adminSupabase.rpc('add_credits', {
        p_user_id: user.id,
        p_amount: refundAmount,
        p_type: 'refund',
        p_description: `Batch cancellation refund: ${batch.name}`,
      });

      if (refundError) {
        console.error('Error refunding credits:', refundError);
      }
    }

    return NextResponse.json({
      success: true,
      refundedCredits: refundAmount,
    });
  } catch (error) {
    console.error('Error cancelling batch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

