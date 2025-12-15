# Fix Browser Error Logging

## Priority
**CRITICAL** - Affects developer experience and error visibility

## Files to Modify
- `src/lib/logging/index.ts` (modify line 72)

## Implementation Details

**Issue:** Error-level logs use `console.warn` instead of `console.error` in browser environments, causing errors to appear in yellow/gray instead of red in DevTools.

**Current Code (line 70-73):**
```typescript
case 'error':
  console.warn(message, data); // Fallback logging - structured logger failed
  break;
```

**Fixed Code:**
```typescript
case 'error':
  console.error(message, data);
  break;
```

**Reasoning:**
- Browser errors should use `console.error` for proper DevTools visibility
- Comment about "fallback logging" is misleading - this IS the intended browser logging, not a fallback
- Red errors in console are critical for debugging

## Acceptance Criteria
- [ ] `console.error` used for error-level browser logs (line 72)
- [ ] Test: Trigger error log in browser → verify it appears in red in DevTools
- [ ] No other logging behavior changed (warn/info/debug still work)

## Dependencies
None - standalone fix
