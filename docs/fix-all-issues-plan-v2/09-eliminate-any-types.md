# Remove 'any' Types and Use Proper Types

## Files to Modify
- src/lib/db/admin-messages.ts (modify - lines 93, 188)
- src/lib/db/admin-timeline.ts (modify - lines 51, 89, 109)
- src/lib/request/context.ts (modify - lines 8, 10, 22)

## Implementation Details

Eliminate 8 instances of `any` types in database queries, test mocks, and async local storage.

**Approach by file:**

### src/lib/db/admin-messages.ts (lines 93, 188)
- Use generated Supabase types for query results
- Create specific interfaces for complex query shapes
- Example:
  ```typescript
  // Before
  const result: any = await query;

  // After
  type MessageQueryResult = Database['public']['Tables']['user_messages']['Row'] & {
    user: { email: string; display_name: string };
  };
  const result: MessageQueryResult[] = await query;
  ```

### src/lib/db/admin-timeline.ts (lines 51, 89, 109)
- Use Supabase generated types
- Create union types for timeline event variations
- Example:
  ```typescript
  // Before
  const events: any[] = await query;

  // After
  type TimelineEvent = Database['public']['Tables']['user_activity']['Row'];
  const events: TimelineEvent[] = await query;
  ```

### src/lib/request/context.ts (lines 8, 10, 22)
- Define explicit context types for AsyncLocalStorage
- Example:
  ```typescript
  // Before
  export const requestContext = new AsyncLocalStorage<any>();

  // After
  type RequestContext = {
    userId?: string;
    requestId: string;
    timestamp: number;
  };
  export const requestContext = new AsyncLocalStorage<RequestContext>();
  ```

**Fallback Strategy:**
If unavoidable due to library constraints (e.g., Supabase internal types), disable rule for specific lines with justification:
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase internal type, no exported interface
const result: any = complexQuery;
```

## Acceptance Criteria

- [ ] All 8 `any` instances replaced with proper types
- [ ] Database query types use Supabase generated types
- [ ] AsyncLocalStorage context has explicit type definition
- [ ] No new type errors introduced
- [ ] `bun run lint | grep "no-explicit-any"` shows zero violations

## Dependencies

- Task 05 (create-database-schema-migrations) should complete first for up-to-date types

## Risk

Medium - May require new type definitions or rule adjustments

## Testing

```bash
bun run lint | grep "no-explicit-any"
# Expected: Zero violations

bun run typecheck
# Verify: No new type errors from changes
```
