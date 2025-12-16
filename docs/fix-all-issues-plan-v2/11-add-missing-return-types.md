# Add Missing Return Types

## Files to Modify
- src/app/api/cookie-consent/route.ts (line 6)

## Implementation Details

Add explicit return type to 1 exported function violating explicit-function-return-type rule.

**Change:**
```typescript
// Before
export async function GET(request) {
  // implementation
}

// After
export async function GET(request: Request): Promise<Response> {
  // implementation
}
```

**Rationale:** Enforces explicit return types on all exported functions for better API contracts and type safety.

## Acceptance Criteria

- [ ] GET function has explicit return type `Promise<Response>`
- [ ] Parameter type added if missing (`request: Request`)
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` shows no explicit-function-return-type violations for this file

## Dependencies

None - Independent single-line fix

## Risk

Low - Single line change, purely type annotation

## Testing

```bash
bun run typecheck
# Verify: No new errors

bun run lint | grep "explicit-function-return-type"
# Verify: No violations in cookie-consent/route.ts
```
