import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin';
import { logger } from '@/lib/logging';

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Only protect admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      // Redirect to login if not authenticated
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const isAdmin = await requireAdmin(user.id);

    if (!isAdmin) {
      // Redirect to home if not admin
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Allow admin access
    return NextResponse.next();
  } catch (error) {
    logger.error('Admin middleware error', {
      error,
      pathname: request.nextUrl.pathname,
    });
    // On error, redirect to home for safety
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};