import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { requestContext } from './context';

export const withRequestContext = <T = Record<string, string>>(
  handler: (request: NextRequest, context: { params: T }) => Promise<NextResponse>
) => {
  return async (
    request: NextRequest,
    context: { params: Promise<T> }
  ): Promise<NextResponse> => {
    const requestId = randomUUID();

    return requestContext.run(
      { requestId, route: request.nextUrl.pathname },
      async () => {
        const resolvedParams = await context.params;
        const response = await handler(request, { params: resolvedParams });
        response.headers.set('x-request-id', requestId);
        return response;
      }
    );
  };
};