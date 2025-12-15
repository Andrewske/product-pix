import { createClient } from '@/lib/supabase/server';
import { trackActivity } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Track login event
      await trackActivity(data.user.id, 'login');
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error('Auth callback error:', error?.message);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
