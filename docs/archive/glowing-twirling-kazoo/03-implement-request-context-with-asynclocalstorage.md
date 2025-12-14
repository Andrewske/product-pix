# Implement Request Context with AsyncLocalStorage via Route Wrappers

## Files to Modify/Create
- `src/lib/request/context.ts` (new)
- `src/lib/request/with-context.ts` (new)
- `src/lib/request/index.ts` (new - barrel export)
- `src/lib/auth/api-middleware.ts` (modify)

## Implementation Details

**Note**: Next.js middleware runs in Edge Runtime which does NOT support AsyncLocalStorage. Instead, we wrap API route handlers where Node.js runtime is available.

### Request Context Module

Create `src/lib/request/context.ts`:

```typescript
import { AsyncLocalStorage } from 'async_hooks';

interface RequestContext {
  requestId: string;
  userId?: string;
  route?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext | undefined {
  return requestContext.getStore();
}

export function setUserId(userId: string): void {
  const store = requestContext.getStore();
  if (store) {
    store.userId = userId;
  }
}
```

### Route Wrapper for Non-Authenticated Routes

Create `src/lib/request/with-context.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
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
```

### Enhance withAuth to Include Request Context

Modify `src/lib/auth/api-middleware.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { User } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
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
```

### Barrel Export

Create `src/lib/request/index.ts`:

```typescript
export { requestContext, getRequestContext, setUserId } from './context';
export { withRequestContext } from './with-context';
```

## Why Route Wrappers Instead of Middleware

- **Edge Runtime Limitation**: Next.js middleware runs in Edge Runtime which doesn't support `async_hooks`
- **Node.js Runtime in Routes**: API routes run in Node.js runtime where AsyncLocalStorage works
- **Existing Pattern**: Builds on existing `withAuth` wrapper pattern already in the codebase
- **Automatic Propagation**: AsyncLocalStorage propagates through entire async call chain
- **Clean API**: Logger can read `requestId` from anywhere via `getRequestContext()`

## Acceptance Criteria
- [ ] RequestContext interface defined with requestId, userId, route
- [ ] AsyncLocalStorage instance created and exported
- [ ] getRequestContext() helper works
- [ ] setUserId() helper works
- [ ] withRequestContext wrapper created for non-auth routes
- [ ] withAuth enhanced to wrap handlers in AsyncLocalStorage
- [ ] requestId auto-generated per request
- [ ] x-request-id header set in response
- [ ] userId added to context after successful authentication
- [ ] Barrel export includes all exports

## Dependencies
None (uses Node.js built-in AsyncLocalStorage)
