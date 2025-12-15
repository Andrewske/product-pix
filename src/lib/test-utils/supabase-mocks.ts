import { mock } from 'bun:test';
import type { Mock } from 'bun:test';

/**
 * Standard Supabase response type for all operations
 */
export interface SupabaseMockResponse<T = unknown> {
  data: T | null;
  error: { message: string } | null;
}

/**
 * Mock for query chains that end with .single()
 */
export interface QueryChainMock<T = unknown> {
  single: Mock<() => Promise<SupabaseMockResponse<T>>>;
}

/**
 * Mock for .select() chains that support filtering and ordering
 */
export interface SelectMock<T = unknown> {
  eq: Mock<(column: string, value: unknown) => SelectMock<T>>;
  is: Mock<(column: string, value: unknown) => SelectMock<T>>;
  order: Mock<(column: string, options?: { ascending?: boolean }) => Promise<SupabaseMockResponse<T[]>>>;
  single: Mock<() => Promise<SupabaseMockResponse<T>>>;
}

/**
 * Mock for .from() chains that support all CRUD operations
 */
export interface FromMock<T = unknown> {
  select: Mock<(columns?: string) => SelectMock<T>>;
  insert: Mock<(values: unknown) => QueryChainMock<T>>;
  update: Mock<(values: unknown) => UpdateMock<T>>;
}

/**
 * Mock for .update() chains that support filtering
 */
export interface UpdateMock<T = unknown> {
  eq: Mock<(column: string, value: unknown) => Promise<SupabaseMockResponse<T>>>;
  is: Mock<(column: string, value: unknown) => Promise<SupabaseMockResponse<T>>>;
}

/**
 * Mock for .auth methods
 */
export interface AuthMock {
  signUp: Mock<(credentials: { email: string; password: string }) => Promise<SupabaseMockResponse<{ user: unknown; session: unknown | null }>>>;
  signInWithPassword: Mock<(credentials: { email: string; password: string }) => Promise<SupabaseMockResponse<{ user: unknown; session: unknown }>>>;
}

/**
 * Full Supabase client mock interface
 */
export interface MockSupabaseClient {
  from: Mock<(table: string) => FromMock>;
  rpc: Mock<(fn: string, args?: unknown) => Promise<SupabaseMockResponse>>;
  auth: AuthMock;
}

/**
 * Creates a full Supabase client mock with default behaviors
 */
export function createSupabaseMock(): MockSupabaseClient {
  return {
    from: mock(() => createFromMock()),
    rpc: mock(() => Promise.resolve({ data: null, error: null })),
    auth: {
      signUp: mock(() => Promise.resolve({
        data: { session: null, user: {} },
        error: null
      })),
      signInWithPassword: mock(() => Promise.resolve({
        data: { session: {}, user: {} },
        error: null
      })),
    },
  };
}

/**
 * Creates a mock for .from() chains with customizable default response
 */
export function createFromMock<T = unknown>(defaultResponse?: SupabaseMockResponse<T>): FromMock<T> {
  const response = defaultResponse || { data: null, error: null };

  return {
    select: mock((columns?: string) => createSelectMock<T>(response)),
    insert: mock((values: unknown) => createInsertMock<T>(response)),
    update: mock((values: unknown) => createUpdateMock<T>(response)),
  };
}

/**
 * Creates a mock for .select() chains with customizable default response
 */
export function createSelectMock<T = unknown>(defaultResponse?: SupabaseMockResponse<T>): SelectMock<T> {
  const response = defaultResponse || { data: null, error: null };

  const selectMock: SelectMock<T> = {
    eq: mock(() => selectMock),
    is: mock(() => selectMock),
    order: mock(() => Promise.resolve(response as SupabaseMockResponse<T[]>)),
    single: mock(() => Promise.resolve(response)),
  };

  return selectMock;
}

/**
 * Creates a mock for .insert() chains with customizable default response
 */
export function createInsertMock<T = unknown>(defaultResponse?: SupabaseMockResponse<T>): QueryChainMock<T> {
  const response = defaultResponse || { data: null, error: null };

  return {
    single: mock(() => Promise.resolve(response)),
  };
}

/**
 * Creates a mock for .update() chains with customizable default response
 */
export function createUpdateMock<T = unknown>(defaultResponse?: SupabaseMockResponse<T>): UpdateMock<T> {
  const response = defaultResponse || { data: null, error: null };

  return {
    eq: mock(() => Promise.resolve(response)),
    is: mock(() => Promise.resolve(response)),
  };
}

/**
 * Specialized mock for sentiment analysis operations that routes to different tables
 * based on the operation type (select vs update)
 */
export function createSentimentAnalysisFromMock(
  selectResponse: SupabaseMockResponse,
  updateResponse: SupabaseMockResponse
): FromMock {
  return {
    select: mock((columns?: string) => createSelectMock(selectResponse)),
    insert: mock((values: unknown) => createInsertMock(updateResponse)),
    update: mock((values: unknown) => createUpdateMock(updateResponse)),
  };
}