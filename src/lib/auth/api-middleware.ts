import { NextRequest, NextResponse } from 'next/server';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { withRequestContext, setUserId } from '@/lib/request';
import { logger } from '@/lib/logging';

export interface AuthenticatedRequest extends NextRequest {
  user: User;
}

export type AuthenticatedHandler<T = Record<string, string>> = (
  request: AuthenticatedRequest,
  context: { params: T }
) => Promise<NextResponse> | NextResponse;

export const withAuth = <T = Record<string, string>>(
  handler: AuthenticatedHandler<T>
): ((request: NextRequest, context: { params: Promise<T> }) => Promise<NextResponse>) => {
  return withRequestContext<T>(async (request, context) => {
    try {
      const supabase = await createClient();
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Use the setUserId helper for consistency
      setUserId(user.id);

      const authenticatedRequest = Object.assign(request, { user });
      return handler(authenticatedRequest, context);
    } catch (error) {
      logger.error('Authentication error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  });
};