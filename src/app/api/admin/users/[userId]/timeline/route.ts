import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { requireAdmin } from '@/lib/auth/admin';
import { getCriticalErrors, type CriticalError } from '@/lib/db/critical-errors';
import { getPostHogEvents, type PostHogEvent } from '@/lib/posthog/api';

type TimelineEvent = CriticalError | PostHogEvent;

function getEventTimestamp(event: TimelineEvent): string {
  return 'timestamp' in event ? event.timestamp : (event.createdAt || '');
}

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
    const days = Math.min(parseInt(searchParams.get('days') || '30', 10), 365);
    const severity = searchParams.get('severity') as 'critical' | 'high' | 'medium' | 'low' | undefined;
    const domain = searchParams.get('domain') as 'payment' | 'credit' | 'generation' | 'auth' | 'validation' | 'rate-limit' | 'system' | undefined;
    const resolved = searchParams.get('resolved') || 'all';

    // 3. Calculate date range
    const endDate = cursor || new Date().toISOString();
    const startDate = new Date(
      Date.parse(endDate) - days * 24 * 60 * 60 * 1000
    ).toISOString();

    // 4. Fetch from both sources in parallel
    const [dbErrors, posthogEvents] = await Promise.all([
      getCriticalErrors(userId, {
        limit,
        beforeDate: endDate,
        afterDate: startDate,
        severity,
        domain,
        resolved: resolved as 'true' | 'false' | 'all'
      }),
      getPostHogEvents(userId, {
        limit,
        beforeDate: endDate,
        afterDate: startDate,
        severity,
        domain
      }),
    ]);

    // 5. Merge and sort
    const merged = [...dbErrors, ...posthogEvents]
      .sort((a, b) => new Date(getEventTimestamp(b)).getTime() - new Date(getEventTimestamp(a)).getTime())
      .slice(0, limit);

    // 6. Return paginated response
    return NextResponse.json({
      events: merged,
      nextCursor: merged.length === limit ? getEventTimestamp(merged[merged.length - 1]) : null,
      hasMore: merged.length === limit,
    });
  } catch (error) {
    console.warn('Error fetching timeline:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}