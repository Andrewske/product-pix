# Create Type-Safe Test Mock Helpers

## Files to Create
- `src/lib/test-utils/supabase-mocks.ts` (new)
- `src/lib/test-utils/index.ts` (new)

## Implementation Details

**Problem:** Bun's `mock()` creates `Mock<fn>` types that don't match Supabase's `QueryBuilder` interface. Current workaround uses `as any` everywhere (~40 instances).

**Solution:** Create reusable type-safe mock factory for Supabase query chains.

### Step 1: Create Directory

```bash
mkdir -p src/lib/test-utils
```

### Step 2: Create supabase-mocks.ts

Create `src/lib/test-utils/supabase-mocks.ts` with the following exports:

**Required Type Definitions:**
- `SupabaseMockResponse<T>` - Standard { data, error } response type
- `QueryChainMock` - For .single() terminal methods
- `SelectMock` - For .select() chains (supports .eq(), .is())
- `FromMock` - For .from() chains (supports .select(), .insert(), .update())
- `MockSupabaseClient` - Full client interface

**Required Factory Functions:**
1. `createSupabaseMock()` - Full client mock with from/rpc/auth
2. `createFromMock(response)` - Mock for .from() chains with default response
3. `createSelectMock(response)` - Mock for .select() chains
4. `createInsertMock(response)` - Mock for .insert() chains
5. `createUpdateMock(response)` - Mock for .update() chains
6. `createSentimentAnalysisFromMock(selectResponse, updateResponse)` - Specialized mock for conditional table routing

**Design Requirements:**
- All return types must be explicit (no `any`)
- Support fluent chaining: `.from().select().eq().single()`
- Handle conditional table routing (e.g., different behavior for different table names)
- Compatible with Bun's `mock()` API from 'bun:test'

**Example Structure:**

```typescript
import { mock } from 'bun:test';
import type { Mock } from 'bun:test';

interface SupabaseMockResponse<T = unknown> {
  data: T | null;
  error: { message: string } | null;
}

// ... (type definitions)

export function createSupabaseMock(): MockSupabaseClient {
  return {
    from: mock((table: string) => createFromMock()),
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

// ... (other factory functions)
```

### Step 3: Create index.ts

Create `src/lib/test-utils/index.ts`:

```typescript
export * from './supabase-mocks';
```

## Acceptance Criteria

1. **File Structure:**
   ```bash
   ls -la src/lib/test-utils/
   # Expected: supabase-mocks.ts and index.ts both exist
   ```

2. **TypeScript Compilation:**
   ```bash
   bunx tsc --noEmit src/lib/test-utils/supabase-mocks.ts
   # Expected: 0 errors
   ```

3. **Import Test:**
   ```typescript
   import { createSupabaseMock } from '@/lib/test-utils';
   // Should resolve without errors
   ```

4. **Mock Functionality:**
   - `createSupabaseMock()` returns object with from/rpc/auth methods
   - All chains are properly typed (no `as any` needed)
   - Mock return values can be customized via parameters

## Dependencies

- Task 01 (Supabase dependency resolution) should be complete
- Task 02 can run in parallel

## Impact

**Enables:** Fixing ~40 test mock type errors in subsequent task.

## Next Steps

After this task completes, Task 04 will update all test files to use these helpers.
