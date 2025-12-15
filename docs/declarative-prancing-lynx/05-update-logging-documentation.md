# Update Logging Documentation

## Priority
**MEDIUM** - Documentation clarity and developer onboarding

## Files to Modify
- `CLAUDE.md` (add new section after line 56)

## Implementation Details

**Action:** Add clear logging guidelines to Code Conventions section

**Location:** After line 56 (after "Quality" section), add:

```markdown
## Logging & Error Handling

**Server-side (API routes, lib code):**
- Always use `logger` from `@/lib/logging`
- Never use console methods in production code

**Client-side:**
- **Application errors (ProductPixError):** Use `captureError` from `@/lib/observability`
  - Logs to console with `[ProductPix Error]` prefix
  - Sends error_occurred event to PostHog
  - Use for user-facing errors, business logic failures
- **Infrastructure warnings (analytics, telemetry):** Use `logger.warn/error`
  - Centralized, structured logging
  - Use for non-user-facing warnings (tracking failures, config issues)
- **React component errors:** Use `console.error` only for uncaught errors in error boundaries
  - Prefer captureError for handled errors

**Never:**
- Bare `console.log` without context in production code
- Scattered console statements for debugging (remove before commit)
```

**Reasoning:**
- Clarifies three-tier logging strategy:
  1. `logger` - Server-side + client infrastructure
  2. `captureError` - Client application errors
  3. `console.error` - Error boundaries only
- Prevents future console.warn violations
- Helps new developers understand logging patterns
- Documents existing patterns in codebase

## Acceptance Criteria
- [ ] New "Logging & Error Handling" section added to CLAUDE.md
- [ ] Section clearly distinguishes server vs client logging
- [ ] All three logging methods documented with use cases
- [ ] "Never" section warns against anti-patterns

## Dependencies
- Should be applied after Fixes #1-2 are complete for accuracy
- References patterns established in those fixes
