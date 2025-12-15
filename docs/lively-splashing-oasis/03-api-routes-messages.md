# API Routes: User Messages

## Files to Create
- `src/app/api/messages/route.ts` (new)
- `src/app/api/messages/[id]/route.ts` (new)

## Implementation Details

### Main Messages Route

**File**: `src/app/api/messages/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { submitMessage, getMessagesForUser } from '@/lib/db/messages';
import { logger } from '@/lib/logging';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { content } = body;

    // Validate content
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Content must be 2000 characters or less' },
        { status: 400 }
      );
    }

    const message = await submitMessage(user.id, { content });

    if (!message) {
      return NextResponse.json(
        { error: 'Failed to submit message' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message });
  } catch (error) {
    logger.error('Error in POST /api/messages', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const messages = await getMessagesForUser(user.id);
    return NextResponse.json({ messages });
  } catch (error) {
    logger.error('Error in GET /api/messages', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Individual Message Route

**File**: `src/app/api/messages/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { markAsRead } from '@/lib/db/messages';
import { logger } from '@/lib/logging';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const supabase = await createServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Check if user is admin
    const adminSupabase = createAdminClient();
    const { data: userData, error: userError } = await adminSupabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'mark_read') {
      const success = await markAsRead(params.id);

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to mark message as read' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Error in PATCH /api/messages/[id]', { error, messageId: params.id });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Reference Patterns
- `src/app/api/images/[id]/feedback/route.ts` - API route structure
- Authentication pattern from existing API routes

## Acceptance Criteria
- ✅ POST /api/messages creates message and returns it
- ✅ GET /api/messages returns user's message thread
- ✅ PATCH /api/messages/[id] marks message as read (admin only)
- ✅ All routes enforce authentication
- ✅ Admin-only actions verify is_admin flag
- ✅ Validation prevents empty/oversized messages
- ✅ Errors are logged with context
