export interface RequestContext {
  requestId: string;
  userId?: string;
  route?: string;
}

// Lazy-loaded server-only context (null in browser)
let _requestContext: any | null = null;

function getAsyncLocalStorage(): any | null {
  if (typeof window !== 'undefined') {
    return null; // Browser environment
  }
  if (!_requestContext) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AsyncLocalStorage } = require('node:async_hooks');
    _requestContext = new AsyncLocalStorage();
  }
  return _requestContext;
}

export const requestContext = new Proxy({} as any, {
  get(_target, prop) {
    const store = getAsyncLocalStorage();
    return store ? store[prop] : undefined;
  },
});

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