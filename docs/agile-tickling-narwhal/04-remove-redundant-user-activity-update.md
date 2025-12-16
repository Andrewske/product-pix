# Remove Redundant User Activity Update

## Priority
**MEDIUM** - Performance optimization and code cleanup

## Files to Modify
- `src/lib/db/user-activity.ts` (modify)

## Implementation Details

### Task 4.1: Remove Manual last_active_at Update

**File:** `src/lib/db/user-activity.ts`

**Issue:** Lines 37-47 manually update `users.last_active_at` after inserting activity. This is redundant because migration `20251215000005_add_last_active_trigger.sql` adds a database trigger that automatically updates `last_active_at` on every `user_activity` INSERT.

**Current Code (lines 12-48):**
```typescript
export async function trackActivity(
  userId: string,
  eventType: ActivityEventType,
  properties?: Record<string, unknown>
): Promise<void> {
  const supabase = createAdminClient();

  const { error: insertError } = await supabase
    .from('user_activity')
    .insert({
      user_id: userId,
      event_type: eventType,
      properties: (properties as Json) ?? {},
    });

  if (insertError) {
    logger.error('Error inserting user activity', {
      error: insertError.message,
      userId,
      eventType,
      properties,
    });
    return;
  }

  // DELETE THESE LINES (37-47) - Redundant with database trigger
  const { error: updateError } = await supabase
    .from('users')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', userId);

  if (updateError) {
    logger.error('Error updating user last_active_at', {
      error: updateError.message,
      userId,
    });
  }
}
```

**Fixed Code:**
```typescript
export async function trackActivity(
  userId: string,
  eventType: ActivityEventType,
  properties?: Record<string, unknown>
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('user_activity')
    .insert({
      user_id: userId,
      event_type: eventType,
      properties: (properties as Json) ?? {},
    });

  if (error) {
    logger.error('Error inserting user activity', {
      error: error.message,
      userId,
      eventType,
      properties,
    });
  }
}
```

**Rationale:**
- Database trigger (migration 20251215000005) handles update automatically
- Eliminates extra database round-trip (better performance)
- Single source of truth (trigger can't be forgotten)
- Simpler, more maintainable code

## Acceptance Criteria
- [ ] `trackActivity` function only inserts into `user_activity` table
- [ ] No manual `users.last_active_at` update remains in code
- [ ] After inserting activity, `users.last_active_at` is still updated (via trigger)
- [ ] Function still logs errors properly

## Testing Steps
1. Call `trackActivity` for a user
2. Query `users` table for that user
3. Verify `last_active_at` was updated to recent timestamp
4. Verify only one database operation in logs (INSERT, no UPDATE)

## Dependencies
- Requires migration `20251215000005_add_last_active_trigger.sql` to be applied
- If migration hasn't been applied yet, apply it first or this change will break functionality
