# Fix API Route Handler Return Types

## Files to Modify
- `src/app/api/images/[id]/favorite/route.ts` (line 6)
- `src/app/api/images/[id]/route.ts` (line 6)
- `src/app/api/stripe/portal/route.ts` (line 6)
- `src/app/api/templates/route.ts` (line 7)
- `src/app/api/webhooks/stripe/route.ts` (line 20)

## Implementation Details

Add explicit return types to all Next.js API route handler functions.

### Pattern
All route handlers follow this pattern:
```typescript
export async function [GET|POST|PUT|DELETE](request: Request)
```

### Fix
Add `: Promise<Response>` or `: Promise<NextResponse>` after the parameter list:

```typescript
// Before
export async function POST(request: Request) {
  // implementation
}

// After
export async function POST(request: Request): Promise<Response> {
  // implementation
}
```

### Determination of Response Type
- If the function returns `Response.json()` or `new Response()` → use `Promise<Response>`
- If the function returns `NextResponse.json()` or `NextResponse.redirect()` → use `Promise<NextResponse>`
- Read each file to determine which type is used

## Implementation Steps
1. Read each route file
2. Identify the return type used (Response vs NextResponse)
3. Add the appropriate return type annotation
4. Verify with `bun lint`

## Acceptance Criteria
- [ ] All 5 route handler functions have explicit return types
- [ ] Return types match the actual return values (Response vs NextResponse)
- [ ] `bun lint` shows violations reduced by ~5
- [ ] `bun typecheck` passes with no errors
- [ ] No runtime behavior changes

## Expected Progression
Violations: ~60 → ~55

## Dependencies
- Task 01 (ESLint configuration must be updated first)
