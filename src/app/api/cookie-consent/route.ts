import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';
import type { CookieConsent, UserPreferences } from '@/lib/cookie-consent';

export async function GET(_request: Request): Promise<Response> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('users')
      .select('preferences')
      .eq('id', user.id)
      .single();

    if (error) {
      logger.error('Failed to load consent from database', { error, userId: user.id });
      return NextResponse.json({ error: 'Failed to load consent' }, { status: 500 });
    }

    if (!data?.preferences) {
      return NextResponse.json({ consent: null });
    }

    const prefs = data.preferences as unknown as UserPreferences;
    const consent: CookieConsent | null = prefs.cookies || null;

    return NextResponse.json({ consent });
  } catch (error) {
    logger.error('Unexpected error loading cookie consent', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}