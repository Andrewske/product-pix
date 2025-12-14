# Create Error Resolution API

## Files to Modify/Create
- `src/app/api/admin/errors/[errorId]/resolve/route.ts` (new)

## Implementation Details

Create API route with POST (resolve) and DELETE (unresolve) handlers:

```typescript
export async function POST(
  request: Request,
  { params }: { params: { errorId: string } }
): Promise<NextResponse> {
  const user = await getUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await resolveCriticalError(params.errorId, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to resolve error', { errorId: params.errorId, error });
    return NextResponse.json({ error: 'Failed to resolve' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { errorId: string } }
): Promise<NextResponse> {
  const user = await getUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await unresolveCriticalError(params.errorId);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to unresolve error', { errorId: params.errorId, error });
    return NextResponse.json({ error: 'Failed to unresolve' }, { status: 500 });
  }
}
```

## Acceptance Criteria
- [ ] POST /api/admin/errors/[errorId]/resolve implemented
- [ ] DELETE /api/admin/errors/[errorId]/resolve implemented
- [ ] Both handlers verify admin auth
- [ ] POST calls resolveCriticalError(errorId, userId)
- [ ] DELETE calls unresolveCriticalError(errorId)
- [ ] Errors logged on failure
- [ ] Returns {success: true} on success
- [ ] Returns 401 for unauthorized
- [ ] Returns 500 on database error

## Dependencies
- Task 06 (resolveCriticalError, unresolveCriticalError functions)
