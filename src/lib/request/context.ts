import { AsyncLocalStorage } from 'node:async_hooks';

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