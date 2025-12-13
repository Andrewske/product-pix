import { NextRequest, NextResponse } from 'next/server';
import { User } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { requestContext } from '@/lib/request/context';

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
    const requestId = randomUUID();

    return requestContext.run(
      { requestId, route: request.nextUrl.pathname },
      async () => {
        try {
          const supabase = await createClient();
          const { data: { user }, error } = await supabase.auth.getUser();

          if (error || !user) {
            return NextResponse.json(
              { error: 'Unauthorized' },
              { status: 401 }
            );
          }

          // Add userId to context after successful auth
          const store = requestContext.getStore();
          if (store) {
            store.userId = user.id;
          }

          const authenticatedRequest = Object.assign(request, { user });
          const resolvedParams = await context.params;

          const response = await handler(authenticatedRequest, { params: resolvedParams });
          response.headers.set('x-request-id', requestId);
          return response;
        } catch {
          return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 401 }
          );
        }
      }
    );
  };
};