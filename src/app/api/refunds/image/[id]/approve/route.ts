// src/app/api/refunds/image/[id]/approve/route.ts
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/server';
import { requireAdmin } from '@/lib/auth/admin';
import { approveImageRefund } from '@/lib/db/refunds';
import { createCreditError } from '@/lib/errors/error-classes';
import { captureError } from '@/lib/observability/capture-error';
import { ErrorCodes } from '@/lib/errors/codes';

export const POST = withAuth(async (request, { params }) => {
  let refundAmount = 0;

  try {
    const { id: refundId } = await params;

    if (!refundId) {
      return NextResponse.json(
        { error: 'Refund ID required' },
        { status: 400 }
      );
    }

    const isAdmin = await requireAdmin(request.user.id);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get refund amount before processing
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const supabase = createAdminClient();
    const { data: refundRequest } = await supabase
      .from('image_refund_requests')
      .select('credits_refunded')
      .eq('id', refundId)
      .single();

    refundAmount = refundRequest?.credits_refunded || 0;

    const success = await approveImageRefund(refundId, request.user.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to approve refund' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Approve refund error:', error);

    const creditError = createCreditError(
      ErrorCodes.CREDIT_REFUND_FAILED,
      'Image refund approval failed',
      {
        severity: 'critical',
        amount: refundAmount,
        operation: 'refund',
        userId: request.user.id,
      }
    );

    await captureError(creditError, { route: '/api/refunds/image/[id]/approve' });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});