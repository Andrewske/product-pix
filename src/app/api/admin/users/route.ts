import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin';
import { logger } from '@/lib/logging';
import { getAdminDashboardStats, getFilteredUserList } from '@/lib/db/admin-stats';
import { userListQuerySchema } from '@/lib/validation/admin';

export async function GET(request: NextRequest): Promise<NextResponse> {
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

  // Handle user list endpoint with validation
  try {
    // Validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validation = userListQuerySchema.safeParse(searchParams);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const filters = validation.data;

    const result = await getFilteredUserList(
      {
        search: filters.search,
        hasErrors: filters.hasErrors,
        hasMessages: filters.hasMessages,
        minCredits: filters.minCredits,
        maxCredits: filters.maxCredits,
        createdAfter: filters.createdAfter,
        createdBefore: filters.createdBefore,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      },
      { limit: filters.limit, cursor: filters.cursor }
    );

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error fetching user list', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}