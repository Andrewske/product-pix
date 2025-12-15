# Admin: Backend Functions and API Routes

## Files to Create
- `src/lib/db/admin-messages.ts` (new)
- `src/app/api/admin/messages/route.ts` (new)

## Implementation Details

### Admin Database Functions

**File**: `src/lib/db/admin-messages.ts`

Mirror pattern from `src/lib/db/admin-feedback.ts`:

```typescript
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logging';
import type { MessageAnalysis } from '@/types';

export interface MessageStats {
  totalMessages: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  positivePercentage: number;
  neutralPercentage: number;
  negativePercentage: number;
  categoryBreakdown: Record<MessageAnalysis['category'], number>;
}

export interface MessageSummary {
  id: string;
  userId: string;
  content: string;
  isFromAdmin: boolean;
  readAt: string | null;
  analysis: MessageAnalysis | null;
  createdAt: string;
  updatedAt: string;
  userEmail?: string;
}

export interface MessageAnalytics {
  stats: MessageStats;
  recentMessages: MessageSummary[];
}

export const getMessageAnalytics = async (
  options: {
    days?: number;
    limit?: number;
  } = {}
): Promise<MessageAnalytics> => {
  const { days = 30, limit = 50 } = options;
  const supabase = createAdminClient();

  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Get all messages with analysis in date range
    const { data: messagesData, error: messagesError } = await supabase
      .from('user_messages')
      .select('analysis')
      .gte('created_at', startDate.toISOString())
      .not('analysis', 'is', null);

    if (messagesError) {
      logger.error('Error fetching message analytics', { error: messagesError.message });
      throw messagesError;
    }

    const totalMessages = messagesData.length;
    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;
    const categoryBreakdown: Record<string, number> = {};

    messagesData.forEach((msg) => {
      const analysis = msg.analysis as MessageAnalysis;
      if (!analysis) return;

      // Count sentiment
      if (analysis.sentiment === 'positive') positiveCount++;
      else if (analysis.sentiment === 'neutral') neutralCount++;
      else if (analysis.sentiment === 'negative') negativeCount++;

      // Count categories
      categoryBreakdown[analysis.category] =
        (categoryBreakdown[analysis.category] || 0) + 1;
    });

    const stats: MessageStats = {
      totalMessages,
      positiveCount,
      neutralCount,
      negativeCount,
      positivePercentage: totalMessages > 0 ? (positiveCount / totalMessages) * 100 : 0,
      neutralPercentage: totalMessages > 0 ? (neutralCount / totalMessages) * 100 : 0,
      negativePercentage: totalMessages > 0 ? (negativeCount / totalMessages) * 100 : 0,
      categoryBreakdown: categoryBreakdown as Record<MessageAnalysis['category'], number>,
    };

    // Get recent messages with user info
    const { data: recentData, error: recentError } = await supabase
      .from('user_messages')
      .select(`
        id,
        user_id,
        content,
        is_from_admin,
        read_at,
        analysis,
        created_at,
        updated_at,
        users!inner(email)
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (recentError) {
      logger.error('Error fetching recent messages', { error: recentError.message });
      throw recentError;
    }

    const recentMessages: MessageSummary[] = recentData.map((row) => ({
      id: row.id,
      userId: row.user_id,
      content: row.content,
      isFromAdmin: row.is_from_admin,
      readAt: row.read_at,
      analysis: row.analysis as MessageAnalysis | null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      userEmail: row.users?.email,
    }));

    return {
      stats,
      recentMessages,
    };
  } catch (error) {
    logger.error('Error getting message analytics', { error });
    throw error;
  }
};

export const getFilteredMessages = async (
  options: {
    sentiment?: MessageAnalysis['sentiment'];
    category?: MessageAnalysis['category'];
    userId?: string;
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  } = {}
): Promise<{ messages: MessageSummary[]; total: number }> => {
  const {
    sentiment,
    category,
    userId,
    limit = 50,
    offset = 0,
    startDate,
    endDate,
  } = options;

  const supabase = createAdminClient();

  try {
    let query = supabase
      .from('user_messages')
      .select(`
        id,
        user_id,
        content,
        is_from_admin,
        read_at,
        analysis,
        created_at,
        updated_at,
        users!inner(email)
      `, { count: 'exact' });

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // For sentiment/category filters, we need to filter on JSONB
    if (sentiment) {
      query = query.eq('analysis->>sentiment', sentiment);
    }

    if (category) {
      query = query.eq('analysis->>category', category);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Error fetching filtered messages', { error: error.message });
      throw error;
    }

    const messages: MessageSummary[] = data.map((row) => ({
      id: row.id,
      userId: row.user_id,
      content: row.content,
      isFromAdmin: row.is_from_admin,
      readAt: row.read_at,
      analysis: row.analysis as MessageAnalysis | null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      userEmail: row.users?.email,
    }));

    return {
      messages,
      total: count || 0,
    };
  } catch (error) {
    logger.error('Error getting filtered messages', { error });
    throw error;
  }
};
```

### Admin API Route

**File**: `src/app/api/admin/messages/route.ts`

Mirror pattern from `src/app/api/admin/feedback/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getFilteredMessages, sendAdminReply } from '@/lib/db/messages';
import { logger } from '@/lib/logging';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Verify admin
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

  try {
    const searchParams = request.nextUrl.searchParams;
    const sentiment = searchParams.get('sentiment');
    const category = searchParams.get('category');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const result = await getFilteredMessages({
      sentiment: sentiment as any,
      category: category as any,
      userId: userId || undefined,
      limit,
      offset,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error in GET /api/admin/messages', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Verify admin
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

  try {
    const body = await request.json();
    const { userId, content } = body;

    if (!userId || !content) {
      return NextResponse.json(
        { error: 'userId and content are required' },
        { status: 400 }
      );
    }

    const message = await sendAdminReply({ userId, content });

    if (!message) {
      return NextResponse.json(
        { error: 'Failed to send reply' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message });
  } catch (error) {
    logger.error('Error in POST /api/admin/messages', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Reference Patterns
- `src/lib/db/admin-feedback.ts` - Admin analytics pattern
- `src/app/api/admin/feedback/route.ts` - Admin API route pattern

## Acceptance Criteria
- ✅ `getMessageAnalytics()` returns sentiment stats and category breakdown
- ✅ `getFilteredMessages()` supports filtering by sentiment, category, user, date
- ✅ Admin API enforces is_admin check
- ✅ GET returns paginated filtered messages
- ✅ POST sends admin reply to user
- ✅ JSONB querying works for sentiment/category filters
- ✅ Errors logged with context
