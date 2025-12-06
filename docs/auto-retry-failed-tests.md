# Implementation Plan: Auto-Retry Failed Prompt Tests

## Objective
Make failed prompt tests automatically retry when running `pnpm bench run`. No flag needed - this should be the default behavior.

## Rationale
- Failed tests are not "completed" work - they should be retryable
- The idempotency system exists to prevent duplicate *successful* work, not block retries
- Simpler than adding a `--retry-failed` flag

## File to Modify
`scripts/commands/run.ts`

## Single Change Required

### Location: Lines 222-234 (existing test check logic)

**Current code:**
```typescript
// Check for existing test with same idempotency key
const { data: existing } = await supabase
  .from('prompt_tests')
  .select('id, status')
  .eq('idempotency_key', idempotencyKey)
  .single();

if (existing) {
  console.log(`  ⏭️  Skipping (already exists: ${existing.status})`);
  if (existing.status === 'completed') completed++;
  else if (existing.status === 'failed') failed++;
  continue;
}
```

**Replace with:**
```typescript
// Check for existing test with same idempotency key
const { data: existing } = await supabase
  .from('prompt_tests')
  .select('id, status')
  .eq('idempotency_key', idempotencyKey)
  .single();

if (existing) {
  if (existing.status === 'failed') {
    // Failed tests should be retried - delete old record and proceed
    console.log(`  🔄 Retrying failed test`);
    const { error: deleteError } = await supabase
      .from('prompt_tests')
      .delete()
      .eq('id', existing.id);

    if (deleteError) {
      console.log(`  ❌ Failed to delete old test: ${deleteError.message}`);
      failed++;
      continue;
    }
    // Fall through to create new test record below
  } else {
    // Completed, evaluating, generating - skip these
    console.log(`  ⏭️  Skipping (already exists: ${existing.status})`);
    if (existing.status === 'completed') completed++;
    continue;
  }
}
```

## Behavior Matrix

| Existing Status | Action | Reason |
|-----------------|--------|--------|
| `completed` | Skip | Already succeeded |
| `evaluating` | Skip | Generation succeeded, awaiting eval |
| `generating` | Skip | In progress (possibly elsewhere) |
| `failed` | Delete & Retry | Failed work should be retryable |

## Testing
1. Create a test that will fail (e.g., invalid prompt)
2. Run `pnpm bench run --template <slug> --batch <file>`
3. Verify test fails and is recorded as `failed`
4. Run the same command again
5. Verify output shows `🔄 Retrying failed test` and proceeds with generation

## No Additional Changes Needed
- No new CLI flags
- No interface changes
- No new dependencies
