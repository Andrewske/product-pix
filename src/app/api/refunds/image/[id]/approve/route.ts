// src/app/api/refunds/image/[id]/approve/route.ts
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';
import { approveImageRefund } from '@/lib/db/refunds';

export const POST = withAuth(async (request, { params }) => {
  try {
    const { id: refundId } = await params;

    if (!refundId) {
      return NextResponse.json(
        { error: 'Refund ID required' },
        { status: 400 }
      );
    }

    // Check if user is admin
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', request.user.id)
      .single();

    if (userError || !userData?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});