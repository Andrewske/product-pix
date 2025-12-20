# Remove Dead Approval Function

## Files to Modify/Create
- prompt-bench/commands/improve.ts (modify)

## Implementation Details

The `requestApproval` function (lines 928-941) contains a TODO comment and always returns `true`, making the approval logic non-functional. The function is called but never actually prompts the user for input.

**Current problematic code:**
```typescript
const requestApproval = async (
  changes: import('@bench/core/improvement-types').TemplateChange[]
): Promise<boolean> => {
  console.log('\n📝 Proposed Changes:');
  // ... display changes ...
  console.log('\nApprove changes? [y/N]: ');

  // TODO: Implement actual user input
  // For now, return true (auto-approve)
  return true;  // Always approves!
};
```

**Required changes:**

1. Delete the `requestApproval` function entirely (lines 928-941)

2. Update the calling code in `runIterationLoop` (around lines 375-381) from:
```typescript
if (!session.config.autoApprove && !options['auto-approve']) {
  const approved = await requestApproval(implementationResult.data.changes);
  if (!approved) {
    console.log('❌ Changes rejected by user');
    return;
  }
}
```

To:
```typescript
if (!session.config.autoApprove && !options['auto-approve']) {
  console.log('\n📝 Proposed Changes:');
  console.log('─'.repeat(80));
  for (const change of implementationResult.data.changes) {
    console.log(`[${change.type.toUpperCase()}] ${change.path}`);
    console.log(`  ${change.description}`);
  }
  console.log('─'.repeat(80));
  console.log('\nℹ️  Use --auto-approve to skip manual approval\n');
  console.error('❌ Manual approval required. Exiting.');
  return;
}
```

## Acceptance Criteria
- [ ] `requestApproval` function is removed from improve.ts
- [ ] Running `bun bench improve` without `--auto-approve` shows changes and exits gracefully
- [ ] Running `bun bench improve --auto-approve` continues without manual approval
- [ ] No TypeScript errors: `bunx tsc --noEmit`
- [ ] Tests pass: `bun test prompt-bench`

## Dependencies
None - this is an independent quick win.

## Risk Level
Very Low - removes misleading dead code and clarifies behavior.

## Savings
~30 lines removed, eliminates confusing TODO/dead code pattern.
