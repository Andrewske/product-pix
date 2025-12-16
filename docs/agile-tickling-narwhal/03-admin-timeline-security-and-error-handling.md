# Admin Timeline Security and Error Handling

## Priority
**HIGH** - SQL injection prevention and proper error surfacing

## Files to Modify
- `src/lib/db/admin-timeline.ts` (modify)

## Implementation Details

### Task 3.1: Add Cursor Validation (SQL Injection Prevention)

**File:** `src/lib/db/admin-timeline.ts`

**Issue:** Line 61 uses template string interpolation with unsanitized cursor values:
```typescript
query = query.or(`timestamp.lt.${cursorTimestamp},and(timestamp.eq.${cursorTimestamp},id.lt.${cursorId})`);
```

While cursors are server-generated, defense-in-depth requires validation.

**Fix:** Add validation after cursor parsing (after line 48, before line 50):

```typescript
// Parse cursor
let cursorTimestamp: string | null = null;
let cursorId: string | null = null;
if (cursor) {
  const parts = cursor.split('_', 2);
  if (parts.length === 2) {
    cursorTimestamp = parts[0];
    cursorId = parts[1];
  }
}

// ADD THIS VALIDATION BLOCK
// Validate cursor parts to prevent SQL injection
if (cursorTimestamp && cursorId) {
  const timestampRegex = /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!timestampRegex.test(cursorTimestamp) || !uuidRegex.test(cursorId)) {
    logger.warn('Invalid cursor format', { cursor });
    cursorTimestamp = null;
    cursorId = null;
  }
}

// Build query against view
let query = supabase
```

**Rationale:**
- Timestamp must be valid ISO 8601 format
- ID must be valid UUID v4
- Invalid cursors gracefully reset to page 1 (empty cursor)
- Eliminates theoretical SQL injection attack surface

### Task 3.2: Change Error Handling to Throw

**File:** `src/lib/db/admin-timeline.ts`

**Issue:** Lines 79-81 silently return empty array on error. API endpoint cannot distinguish between "query failed" vs "user has no events".

**Fix:** Change from silent failure to throwing:

```typescript
// Before
if (error) {
  logger.error('Error fetching unified timeline', { error, userId });
  return { events: [], nextCursor: null };
}

// After
if (error) {
  logger.error('Error fetching unified timeline', { error, userId });
  throw new Error(`Failed to fetch timeline: ${error.message}`);
}
```

**Rationale:**
- Route handler at `src/app/api/admin/users/[userId]/timeline/route.ts` already has try/catch (lines 46-49)
- Throwing allows proper 500 error response to client
- Silent failures hide database issues from admins

## Acceptance Criteria
- [ ] Malformed cursor (e.g., `"injection';DROP TABLE users--"`) resets to page 1
- [ ] Valid cursor successfully paginates
- [ ] Timeline query errors return HTTP 500 to client (not empty array)
- [ ] Invalid timestamp format in cursor logs warning and resets
- [ ] Invalid UUID format in cursor logs warning and resets

## Testing Steps

### Cursor Validation Test:
```typescript
// Test in browser console or API test
const malformedCursor = "2024-13-45T99:99:99Z_not-a-uuid";
const response = await fetch('/api/admin/users/USER_ID/timeline?cursor=' + malformedCursor);
// Should return first page (no error), logs warning
```

### Error Handling Test:
```typescript
// Temporarily break database connection or query
// Verify API returns 500 status instead of empty array
```

## Dependencies
- Depends on Task 2.1 (TimelineViewRow interface) for type safety
- Logging must be working properly (already is)
