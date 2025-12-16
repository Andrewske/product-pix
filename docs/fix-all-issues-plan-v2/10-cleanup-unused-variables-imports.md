# Handle Unused Variables and Imports

## Files to Modify
- middleware.ts (line 1)
- src/app/api/contact/__tests__/route.test.ts (line 19)
- src/app/api/cookie-consent/route.ts (line 6)
- src/app/api/generate/route.ts (line 3)
- src/lib/auth/__tests__/hooks.test.ts (line 1)
- src/lib/cookie-consent/__tests__/storage.test.ts (line 5)
- src/lib/test-utils/supabase-mocks.ts (lines 90-92, 144-146)
- src/lib/analytics/posthog-provider.tsx (line 42)
- Plus 15+ more warnings in test files (see docs/current-lint-errors.md)

## Implementation Details

Clean up 29 linting warnings for unused imports/variables using consistent criteria.

### Criteria for Action

**Remove:** Truly unused imports with no side effects
- Verify with eslint + manual review
- Ensure no module registration or CSS imports

**Prefix with `_`:** Intentionally unused function parameters
- Mock functions (test utilities)
- API route handlers with unused params

**Keep:** Imports with side effects
- CSS imports
- Module registration
- Polyfills

### Changes by Category

#### Mock Function Parameters (Prefix with `_`)
```typescript
// src/lib/test-utils/supabase-mocks.ts (lines 90-92, 144-146)
// Before
.insert((columns, values) => { ... })

// After
.insert((_columns, _values) => { ... })
```

Files:
- src/lib/test-utils/supabase-mocks.ts - 6 unused params
- src/app/api/contact/__tests__/route.test.ts:19 - unused `params`
- src/app/api/cookie-consent/route.ts:6 - unused `request`

#### Truly Unused Imports (Remove)
```typescript
// Before
import { CookieOptions } from 'something';

// After
// (import removed if truly unused)
```

Files to review and remove:
- middleware.ts:1 - `CookieOptions`
- src/app/api/generate/route.ts:3 - `crypto`
- src/lib/auth/__tests__/hooks.test.ts:1 - `beforeEach`
- src/lib/cookie-consent/__tests__/storage.test.ts:5 - `clearLocalStorageConsent`
- And 15+ more in test files

#### Special Cases
- **src/lib/analytics/posthog-provider.tsx:42** - Unused eslint-disable directive
  ```typescript
  // Remove this line if react-hooks/exhaustive-deps isn't actually violated
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ```

### Verification Process for Each File

1. Check if import/variable has side effects
2. For imports: Search for actual usage (may be type-only)
3. For function params: Determine if intentionally unused
4. Apply appropriate action (remove, prefix with `_`, or keep)

## Acceptance Criteria

- [ ] All mock function parameters prefixed with `_`
- [ ] Truly unused imports removed (verified no side effects)
- [ ] Unused eslint-disable directive removed (posthog-provider.tsx:42)
- [ ] `bun run lint` shows reduced warnings count
- [ ] `bun run test` still passes (no removed imports were needed)

## Dependencies

None - Independent code cleanup

## Risk

Low - Code cleanup with minimal functional impact

## Testing

```bash
bun run lint
# Expected: Reduced warnings from 29, no new errors

bun run test
# Expected: All tests still pass
# Confirms removed imports weren't needed for side effects

# Count remaining warnings
bun run lint 2>&1 | grep "warning" | wc -l
# Document final count
```
