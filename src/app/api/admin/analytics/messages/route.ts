// src/app/api/admin/analytics/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { requireAdmin } from '@/lib/auth/admin';
import { getMessageAnalytics } from '@/lib/db/admin-messages';
import { logger } from '@/lib/logging';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Verify admin auth
    const user = await requireAuth();
    const isAdmin = await requireAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const days = Math.min(parseInt(searchParams.get('days') || '30', 10), 365);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

    // 3. Get analytics data
    const analytics = await getMessageAnalytics({ days, limit });

    return NextResponse.json(analytics);
  } catch (error) {
    logger.error('Error in admin analytics messages API', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}