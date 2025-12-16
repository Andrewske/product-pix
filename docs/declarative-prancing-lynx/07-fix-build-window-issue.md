# Fix Build Window Issue

## Priority
**CRITICAL** - Build fails with "window is not defined" during prerendering

## Files to Modify
- `src/lib/logging/index.ts` (modify getCurrentLogLevel function)

## Implementation Details

**Issue:** Build fails with "window is not defined" during prerendering. The issue is the window check in logging getCurrentLogLevel causing static analysis issues.

**Current getCurrentLogLevel:**
```typescript
const getCurrentLogLevel = (): LogLevel => {
  // Check if we're in a browser environment safely
  try {
    if (typeof globalThis !== 'undefined' && typeof globalThis.window !== 'undefined') {
      return 'info';
    }
  } catch {
    // Ignore errors during static analysis
  }
  // Server: read from env
  try {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase();
    const parsed = LOG_LEVEL_SCHEMA.safeParse(envLevel);
    return parsed.success ? parsed.data : 'info';
  } catch {
    return 'info';
  }
};
```

**Fixed getCurrentLogLevel:**
```typescript
const getCurrentLogLevel = (): LogLevel => {
  // Read from env (works in both server and browser)
  try {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase();
    const parsed = LOG_LEVEL_SCHEMA.safeParse(envLevel);
    return parsed.success ? parsed.data : 'info';
  } catch {
    return 'info';
  }
};
```

**Reasoning:**
- Remove the window check since in browser env has no LOG_LEVEL, so defaults to 'info' anyway
- Simplifies the logic and avoids static analysis issues during prerendering
- Environment-based configuration works in both server and browser contexts

## Acceptance Criteria
- [ ] Build succeeds without "window is not defined" error
- [ ] getCurrentLogLevel function simplified to remove window check
- [ ] Logging behavior unchanged (still defaults to 'info' in browser, respects LOG_LEVEL env var on server)
- [ ] TypeScript compilation passes
- [ ] No runtime errors in browser or server environments

## Dependencies
None - standalone fix