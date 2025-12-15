export interface RequestContext {
  requestId: string;
  userId?: string;
  route?: string;
}

// Lazy-loaded server-only context (null in browser)
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dynamic import of AsyncLocalStorage requires any for typing
let _requestContext: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dynamic import of AsyncLocalStorage requires any for typing
function getAsyncLocalStorage(): any {
  if (typeof window !== 'undefined') {
    return null; // Browser environment
  }
  if (!_requestContext) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AsyncLocalStorage } = require('node:async_hooks');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- AsyncLocalStorage constructor typing is complex with dynamic imports
    _requestContext = new AsyncLocalStorage() as any;
  }
  return _requestContext;
}

// Export the AsyncLocalStorage with proper typing for methods
export const requestContext = {
  run: <T>(context: RequestContext, fn: () => T): T => {
    const store = getAsyncLocalStorage();
    return store ? store.run(context, fn) : fn();
  },
  getStore: (): RequestContext | undefined => {
    const store = getAsyncLocalStorage();
    return store?.getStore();
  },
};

export function getRequestContext(): RequestContext | undefined {
  const store = getAsyncLocalStorage();
  return store?.getStore();
}

export function setUserId(userId: string): void {
  const asyncStore = getAsyncLocalStorage();
  const store = asyncStore?.getStore();
  if (store) {
    store.userId = userId;
  }
}