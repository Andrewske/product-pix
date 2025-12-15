import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { requireAdmin } from '@/lib/auth/admin';
import { getUnifiedTimeline, type TimelineEvent } from '@/lib/db/admin-timeline';
import { logger } from '@/lib/logging';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  try {
    // 1. Verify admin auth
    const user = await requireAuth();
    const isAdmin = await requireAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;

    // 2. Parse query params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
    const cursor = searchParams.get('cursor');
    const typesParam = searchParams.get('types');
    const types = typesParam ? typesParam.split(',').filter(Boolean) as TimelineEvent['type'][] : undefined;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 3. Fetch unified timeline
    const result = await getUnifiedTimeline(userId, {
      limit,
      cursor,
      filters: {
        types,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      },
    });

    // 4. Return paginated response
    return NextResponse.json({
      events: result.events,
      nextCursor: result.nextCursor,
    });
   } catch (error) {
     logger.error('Error fetching timeline', { error });
     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
   }
}