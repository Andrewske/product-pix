import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin';
import { logger } from '@/lib/logging';
import type { UserListFilters } from '@/lib/db/admin-stats';
import { getAdminDashboardStats, getFilteredUserList } from '@/lib/db/admin-stats';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = await requireAdmin(currentUser.id);

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const pathname = url.pathname;

  // Handle stats endpoint
  if (pathname.endsWith('/stats')) {
    try {
      const stats = await getAdminDashboardStats();
      return NextResponse.json(stats);
    } catch (error) {
      logger.error('Error fetching admin stats', { error });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  // Handle user list endpoint
  try {
    const searchParams = request.nextUrl.searchParams;

    const minCreditsParam = searchParams.get('minCredits');
    const maxCreditsParam = searchParams.get('maxCredits');
    const limitParam = searchParams.get('limit');

    const filters: UserListFilters = {
      search: searchParams.get('search') || undefined,
      hasErrors: searchParams.get('hasErrors') === 'true' ? true : searchParams.get('hasErrors') === 'false' ? false : undefined,
      hasMessages: searchParams.get('hasMessages') === 'true' ? true : searchParams.get('hasMessages') === 'false' ? false : undefined,
      minCredits: minCreditsParam ? parseInt(minCreditsParam, 10) : undefined,
      maxCredits: maxCreditsParam ? parseInt(maxCreditsParam, 10) : undefined,
      createdAfter: searchParams.get('createdAfter') || undefined,
      createdBefore: searchParams.get('createdBefore') || undefined,
      sortBy: (searchParams.get('sortBy') as UserListFilters['sortBy']) || 'created_at',
      sortOrder: (searchParams.get('sortOrder') as UserListFilters['sortOrder']) || 'desc',
    };

    const limit = Math.min(limitParam ? parseInt(limitParam, 10) : 20, 100); // Max 100 per page
    const cursor = searchParams.get('cursor') || undefined;

    const result = await getFilteredUserList(filters, { limit, cursor });

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error fetching user list', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}