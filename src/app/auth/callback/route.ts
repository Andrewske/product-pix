import { createServerClient } from '@supabase/ssr';
import { trackActivity } from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // Create redirect response that we'll attach cookies to
    const redirectResponse = NextResponse.redirect(`${origin}${next}`);

    // Create Supabase client with cookie handling that sets on both cookieStore and response
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Set on cookie store for subsequent requests in this handler
            cookieStore.set(name, value, options);
            // Set on redirect response so browser receives the cookies
            redirectResponse.cookies.set(name, value, options);
          });
        },
      },
    });

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Track login event
      await trackActivity(data.user.id, 'login');

      // Return response with cookies attached
      return redirectResponse;
    }

    console.error('Auth callback error:', error?.message);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
