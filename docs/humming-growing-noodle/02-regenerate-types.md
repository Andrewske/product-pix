# Regenerate Supabase Types and Remove Type Casts

## Files to Modify
- `src/lib/supabase/database.types.ts` (regenerated)
- `src/lib/db/user-activity.ts` (remove `any` casts)
- `src/lib/db/admin-timeline.ts` (remove temporary interfaces and `any` casts)
- `src/lib/db/admin-stats.ts` (remove `any` casts)

## Implementation Details

### Step 1: Regenerate Database Types

Run the following command to regenerate TypeScript types from the database schema:

```bash
npx supabase gen types typescript --schema public > src/lib/supabase/database.types.ts
```

This will include the new `user_activity` table and `last_active_at` column added in the migrations.

---

### Step 2: Update user-activity.ts

**File:** `src/lib/db/user-activity.ts`

Remove `any` casts on lines 19-20, 38-39, 59:

```typescript
// Before (line 19-20):
const { error: insertError } = await (supabase as any)
  .from('user_activity')

// After:
const { error: insertError } = await supabase
  .from('user_activity')

// Before (line 38-39):
const { error: updateError } = await (supabase as any)
  .from('users')

// After:
const { error: updateError } = await supabase
  .from('users')

// Before (line 59):
let query = (supabase as any)
  .from('user_activity')

// After:
let query = supabase
  .from('user_activity')
```

---

### Step 3: Update admin-timeline.ts

**File:** `src/lib/db/admin-timeline.ts`

**Remove temporary interfaces (lines 6-28):**

```typescript
// DELETE these temporary type definitions:
interface UserMessagesTable {
  Row: {
    id: string;
    user_id: string;
    content: string;
    is_from_admin: boolean;
    read_at: string | null;
    created_at: string;
    updated_at: string;
    analysis: unknown | null;
  };
}

interface UserActivityTable {
  Row: {
    id: string;
    user_id: string;
    event_type: string;
    properties: unknown | null;
    created_at: string | null;
  };
}
```

**Remove `any` casts (lines 176, 406):**

```typescript
// Before (line 176):
let query = (supabase as any)
  .from('user_messages')

// After:
let query = supabase
  .from('user_messages')

// Before (line 406):
let query = (supabase as any)
  .from('user_activity')

// After:
let query = supabase
  .from('user_activity')
```

---

### Step 4: Update admin-stats.ts

**File:** `src/lib/db/admin-stats.ts`

**Remove `any` casts (lines 108, 164, 334):**

```typescript
// Before (line 108):
const { count, error } = await (supabase as any)
  .from('user_activity')

// After:
const { count, error } = await supabase
  .from('user_activity')

// Before (line 164):
const { count, error } = await (supabase as any)
  .from('user_messages')

// After:
const { count, error } = await supabase
  .from('user_messages')

// Before (line 334):
const { count, error } = await (supabase as any)
  .from('user_messages')

// After:
const { count, error } = await supabase
  .from('user_messages')
```

## Acceptance Criteria

- [ ] `database.types.ts` regenerated successfully
- [ ] All `any` casts removed from 3 files
- [ ] Temporary type interfaces removed from admin-timeline.ts
- [ ] Run `bun run typecheck` with no errors
- [ ] Confirm `UserActivity` type exists in generated types
- [ ] Confirm `last_active_at` field exists on `Users` type

## Testing Commands

```bash
# Regenerate types
npx supabase gen types typescript --schema public > src/lib/supabase/database.types.ts

# Verify no TypeScript errors
bun run typecheck

# Check for remaining 'any' casts
grep -n "as any" src/lib/db/user-activity.ts src/lib/db/admin-timeline.ts src/lib/db/admin-stats.ts
```

Expected: No matches found (all `any` casts removed)

## Dependencies

- Task 01 (database migrations) must be complete and pushed
