# Fix Analytics Architecture (Client/Server Split)

## Files to Modify/Create
- src/lib/analytics/client.ts (new - client-safe exports only)
- src/lib/analytics/index.ts (modify - split client/server)
- src/app/client-providers.tsx (modify - remove PostHogProvider if redundant)
- All files in analytics-imports.txt from Task 02

## Implementation Details

Separate client/server analytics exports to resolve bundling conflicts. Create dedicated client export file, update barrel export to exclude server functions, remove redundant PostHogProvider component.

**Actions:**
1. Create `client.ts` with browser-safe exports (`trackEvent`, `identifyUser`)
2. Keep server-only code (`trackServerEvent`) in `server.ts`
3. Update `index.ts` to export from both with clear comments
4. Grep for `PostHogProvider` usage - if zero usages, remove component
5. Update all import sites to use correct client/server imports
6. **CRITICAL CHECKPOINT:** Run `bun run typecheck` - must show ZERO errors from analytics before proceeding

**Example client.ts structure:**
```typescript
// src/lib/analytics/client.ts
'use client';

export { trackEvent, identifyUser } from './posthog-client';
// Only browser-safe functions
```

**Example index.ts update:**
```typescript
// src/lib/analytics/index.ts
// Client-side exports (browser safe)
export * from './client';

// Server-side exports (Node.js only)
export * from './server';
```

## Acceptance Criteria

- [ ] client.ts created with browser-safe exports only
- [ ] index.ts properly splits client/server exports with comments
- [ ] PostHogProvider removed if unused (verify with grep)
- [ ] All import sites updated (reference analytics-imports.txt)
- [ ] `bun run typecheck` shows zero errors
- [ ] `bun run build` succeeds
- [ ] Client bundle excludes server-only PostHog code (verify bundle analysis)

## Dependencies

- Task 02 (audit-analytics-imports) must complete first

## Risk

Medium - Requires updating import statements across codebase

## Testing

```bash
bun run typecheck
# Expected: Zero errors from analytics imports

bun run build
# Verify: Client bundle excludes server-only PostHog code
# Verify: No "can't use server-only module in client" errors
```

## CRITICAL CHECKPOINT

This task MUST complete and pass verification before proceeding to Task 05 (database migrations). Analytics errors will cascade into false positives during TypeScript error fixing.
