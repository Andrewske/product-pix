// src/app/api/admin/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { requireAdmin } from '@/lib/auth/admin';
import { getAdminFeedbackHandler } from '@/lib/admin-feedback-handlers';
import { logger } from '@/lib/logging';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Verify admin auth
    const user = await requireAuth();
    const isAdmin = await requireAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse query parameters and dispatch to handler
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'analytics';

    const handler = getAdminFeedbackHandler(action);
    if (!handler) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return await handler(searchParams);

  } catch (error) {
    logger.error('Error in admin feedback API', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}