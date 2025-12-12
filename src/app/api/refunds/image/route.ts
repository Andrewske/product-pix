// src/app/api/refunds/image/route.ts
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  createImageRefundRequest,
  getUserRefundCount,
  getPendingAdminRefunds
} from '@/lib/db/refunds';
import { softDeleteImage } from '@/lib/db/generated-images';
import { z } from 'zod';
import type { RefundReason } from '@/types';

const createRefundSchema = z.object({
  imageId: z.string().uuid(),
  jobId: z.string().uuid(),
  reason: z.enum(['poor_quality', 'wrong_style', 'technical_issue', 'other']),
  feedback: z.string().optional(),
  creditsRefunded: z.number().int().positive(),
});

export const POST = withAuth(async (request) => {
  try {
    // Validate request body
    const body = await request.json();
    const parsed = createRefundSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { imageId, jobId, reason, feedback, creditsRefunded } = parsed.data;

    // Verify image ownership and not already refunded
    const supabase = await createClient();
    const { data: image, error: imageError } = await supabase
      .from('generated_images')
      .select('id, user_id, deleted_at')
      .eq('id', imageId)
      .eq('user_id', request.user.id)
      .is('deleted_at', null)
      .single();

    if (imageError || !image) {
      return NextResponse.json(
        { error: 'Image not found or not owned by user' },
        { status: 404 }
      );
    }

    // Check for existing refund request
    const { data: existingRequest } = await supabase
      .from('image_refund_requests')
      .select('id')
      .eq('image_id', imageId)
      .single();

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Refund request already exists for this image' },
        { status: 400 }
      );
    }

    // Count user's approved refunds
    const approvedCount = await getUserRefundCount(request.user.id);

    // Determine if auto-approve or pending admin
    const shouldAutoApprove = approvedCount < 49;

    if (shouldAutoApprove) {
      // Create refund request record first
      const refundRequest = await createImageRefundRequest({
        userId: request.user.id,
        imageId,
        jobId,
        reason: reason as RefundReason,
        feedback,
        creditsRefunded,
      });

      // Auto-approve: call refund RPC and soft delete image
      const adminSupabase = createAdminClient();
      const { data: refundResult, error: refundError } = await adminSupabase.rpc(
        'refund_credits_for_image',
        {
          p_user_id: request.user.id,
          p_amount: creditsRefunded,
          p_image_id: imageId,
          p_refund_request_id: refundRequest.id,
          p_description: 'Auto-approved image refund',
        }
      );

      if (refundError || !refundResult?.[0]?.success) {
        return NextResponse.json(
          { error: 'Failed to process refund' },
          { status: 500 }
        );
      }

      // Create refund request record
      await createImageRefundRequest({
        userId: request.user.id,
        imageId,
        jobId,
        reason: reason as RefundReason,
        feedback,
        creditsRefunded,
      });

      // Update with approved status and processed timestamp
      await adminSupabase
        .from('image_refund_requests')
        .update({
          status: 'approved',
          processed_at: new Date().toISOString(),
        })
        .eq('id', refundRequest.id);

      if (updateError) {
        console.error('Error updating refund request status:', updateError);
        // Don't fail the request since refund was successful
      }

      // Soft delete the image
      await softDeleteImage(imageId, request.user.id);

      return NextResponse.json({
        success: true,
        status: 'approved',
        message: `${creditsRefunded} credits have been refunded to your account.`,
      });
    } else {
      // Create pending admin request
      await createImageRefundRequest({
        userId: request.user.id,
        imageId,
        jobId,
        reason: reason as RefundReason,
        feedback,
        creditsRefunded,
      });

      return NextResponse.json({
        success: true,
        status: 'pending_admin',
        message: 'Your refund request is under review. You will be notified once processed.',
      });
    }
  } catch (error) {
    console.error('Refund request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const GET = withAuth(async (request) => {
  try {
    // Check if user is admin (this would need to be implemented based on your admin system)
    // For now, we'll assume admin check is done elsewhere or use a simple role check
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tier')
      .eq('id', request.user.id)
      .single();

    if (userError || userData?.tier !== 'business') { // Assuming business tier = admin
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const pendingRefunds = await getPendingAdminRefunds();

    return NextResponse.json({ refunds: pendingRefunds });
  } catch (error) {
    console.error('Get pending refunds error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});