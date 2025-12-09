import { NextRequest, NextResponse } from 'next/server';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export interface AuthenticatedRequest extends NextRequest {
  user: User;
}

export type AuthenticatedHandler<T = Record<string, string>> = (
  request: AuthenticatedRequest,
  context: { params: T }
) => Promise<NextResponse> | NextResponse;

export const withAuth = <T = Record<string, string>>(
  handler: AuthenticatedHandler<T>
) => {
  return async (
    request: NextRequest,
    context: { params: Promise<T> }
  ): Promise<NextResponse> => {
    try {
      const supabase = await createClient();
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const authenticatedRequest = Object.assign(request, { user });
      const resolvedParams = await context.params;
      return handler(authenticatedRequest, { params: resolvedParams });
    } catch {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
};