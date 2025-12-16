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

    // Create Supabase client with proper cookie handling for route handlers
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    });

    console.log("Exchanging code for session, code:", code?.substring(0, 10) + "...");
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    console.log("Exchange result:", { user: data.user?.id, session: !!data.session, error: error?.message });

    if (!error && data.user) {
      // Track login event
      await trackActivity(data.user.id, 'login');

      // Redirect after cookies are set
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error('Auth callback error:', error?.message);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
