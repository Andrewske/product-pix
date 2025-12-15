# Add Zod Validation for Admin API Query Parameters

## Files to Create/Modify
- `src/lib/validation/admin.ts` (new - Zod schemas)
- `src/app/api/admin/users/route.ts` (modify - add validation + return type)

## Implementation Details

### Step 1: Create Admin Validation Schemas

Create new file `src/lib/validation/admin.ts`:

```typescript
import { z } from 'zod';

export const userListQuerySchema = z.object({
  search: z.string().max(255).optional(),
  hasErrors: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
  hasMessages: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
  minCredits: z.coerce.number().int().min(0).optional(),
  maxCredits: z.coerce.number().int().min(0).optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  sortBy: z.enum(['created_at', 'last_active', 'credit_balance']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export type UserListQuery = z.infer<typeof userListQuerySchema>;
```

**Pattern Source:** `src/app/api/contact/route.ts` - existing validation pattern

---

### Step 2: Update Admin Users API Route

**File:** `src/app/api/admin/users/route.ts`

Add explicit return type and Zod validation:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin';
import { logger } from '@/lib/logging';
import type { UserListFilters } from '@/lib/db/admin-stats';
import { getAdminDashboardStats, getFilteredUserList } from '@/lib/db/admin-stats';
import { userListQuerySchema } from '@/lib/validation/admin';

// Add explicit return type (line 8)
export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = await requireAdmin(currentUser.id);

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const pathname = url.pathname;

  // Handle stats endpoint
  if (pathname.endsWith('/stats')) {
    try {
      const stats = await getAdminDashboardStats();
      return NextResponse.json(stats);
    } catch (error) {
      logger.error('Error fetching admin stats', { error });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  // Handle user list endpoint with validation
  try {
    // Validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validation = userListQuerySchema.safeParse(searchParams);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const filters = validation.data;

    const result = await getFilteredUserList(
      {
        search: filters.search,
        hasErrors: filters.hasErrors,
        hasMessages: filters.hasMessages,
        minCredits: filters.minCredits,
        maxCredits: filters.maxCredits,
        createdAfter: filters.createdAfter,
        createdBefore: filters.createdBefore,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      },
      { limit: filters.limit, cursor: filters.cursor }
    );

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error fetching user list', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Acceptance Criteria

- [ ] Validation schema created with all query parameters
- [ ] Schema includes proper transformations (string 'true'/'false' → boolean)
- [ ] Schema includes proper coercions (string numbers → integers)
- [ ] API route validates all incoming query parameters
- [ ] Invalid parameters return 400 with detailed error messages
- [ ] Explicit return type added to GET function
- [ ] No TypeScript errors

## Testing Commands

```bash
# Type check
bun run typecheck

# Test valid params
curl "http://localhost:3000/api/admin/users?search=test&limit=10&sortBy=credit_balance&sortOrder=desc"

# Test invalid limit (should return 400)
curl "http://localhost:3000/api/admin/users?limit=500"
# Expected: {"error":"Invalid query parameters","details":[...]}

# Test invalid sortBy (should return 400)
curl "http://localhost:3000/api/admin/users?sortBy=invalid_field"
# Expected: {"error":"Invalid query parameters","details":[...]}

# Test boolean coercion
curl "http://localhost:3000/api/admin/users?hasErrors=true&limit=5"
# Expected: Returns users with errors

# Test number coercion
curl "http://localhost:3000/api/admin/users?minCredits=100&maxCredits=1000"
# Expected: Returns users with credits in range
```

## Dependencies

None - independent validation layer
