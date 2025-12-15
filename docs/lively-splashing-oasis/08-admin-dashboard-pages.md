# Admin: Dashboard Pages

## Files to Create
- `src/app/admin/messages/page.tsx` (new)
- `src/app/admin/analytics/page.tsx` (modify if exists, or create)

## Implementation Details

### Messages Admin Page

**File**: `src/app/admin/messages/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import type { MessageSummary, MessageAnalysis } from '@/types';

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<MessageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [sentiment, setSentiment] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [sentiment, category]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sentiment !== 'all') params.set('sentiment', sentiment);
      if (category !== 'all') params.set('category', category);

      const response = await fetch(`/api/admin/messages?${params}`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedUserId || !replyContent.trim()) return;

    setSending(true);
    try {
      const response = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          content: replyContent.trim(),
        }),
      });

      if (response.ok) {
        setReplyContent('');
        setSelectedUserId(null);
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setSending(false);
    }
  };

  const getSentimentColor = (sentiment?: MessageAnalysis['sentiment']) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-500';
      case 'neutral': return 'bg-gray-500';
      case 'negative': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">User Messages</h1>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={sentiment} onValueChange={setSentiment}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by sentiment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sentiments</SelectItem>
            <SelectItem value="positive">Positive</SelectItem>
            <SelectItem value="neutral">Neutral</SelectItem>
            <SelectItem value="negative">Negative</SelectItem>
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="bug_report">Bug Report</SelectItem>
            <SelectItem value="feature_request">Feature Request</SelectItem>
            <SelectItem value="billing">Billing</SelectItem>
            <SelectItem value="praise">Praise</SelectItem>
            <SelectItem value="complaint">Complaint</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Messages List */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <Card key={message.id} className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-medium">{message.userEmail}</span>
                  {message.analysis && (
                    <div className="flex gap-2 mt-1">
                      <Badge className={getSentimentColor(message.analysis.sentiment)}>
                        {message.analysis.sentiment}
                      </Badge>
                      <Badge variant="outline">
                        {message.analysis.category.replace('_', ' ')}
                      </Badge>
                    </div>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                </span>
              </div>
              <p className="whitespace-pre-wrap mb-2">{message.content}</p>
              <Button
                size="sm"
                onClick={() => setSelectedUserId(message.userId)}
                variant={selectedUserId === message.userId ? 'default' : 'outline'}
              >
                Reply
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Reply Box */}
      {selectedUserId && (
        <Card className="p-4 fixed bottom-4 right-4 w-96">
          <h3 className="font-medium mb-2">Send Reply</h3>
          <Textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Type your reply..."
            rows={4}
            className="mb-2"
          />
          <div className="flex gap-2">
            <Button onClick={handleSendReply} disabled={sending || !replyContent.trim()}>
              Send
            </Button>
            <Button variant="outline" onClick={() => setSelectedUserId(null)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
```

### Analytics Page Enhancement

**File**: `src/app/admin/analytics/page.tsx`

If this page exists, add a new section for message analytics. If it doesn't exist, create it:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { MessageAnalytics } from '@/lib/db/admin-messages';

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<MessageAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // This endpoint would need to be created to call getMessageAnalytics()
      const response = await fetch('/api/admin/analytics/messages');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!analytics) return <div>No data</div>;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Message Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.stats.totalMessages}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Positive</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {analytics.stats.positivePercentage.toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">
              {analytics.stats.positiveCount} messages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Negative</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              {analytics.stats.negativePercentage.toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">
              {analytics.stats.negativeCount} messages
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(analytics.stats.categoryBreakdown).map(([category, count]) => (
              <div key={category} className="flex justify-between">
                <span className="capitalize">{category.replace('_', ' ')}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.recentMessages.slice(0, 10).map((msg) => (
              <div key={msg.id} className="border-b pb-2">
                <p className="text-sm text-muted-foreground">{msg.userEmail}</p>
                <p className="line-clamp-2">{msg.content}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Additional API Route Needed

**File**: `src/app/api/admin/analytics/messages/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getMessageAnalytics } from '@/lib/db/admin-messages';
import { logger } from '@/lib/logging';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify admin
  const adminSupabase = createAdminClient();
  const { data: userData, error: userError } = await adminSupabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (userError || !userData?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');

    const analytics = await getMessageAnalytics({ days });
    return NextResponse.json(analytics);
  } catch (error) {
    logger.error('Error in GET /api/admin/analytics/messages', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Reference Patterns
- Existing admin pages in the codebase
- shadcn/ui components for consistent UI

## Acceptance Criteria
- ✅ Messages page shows filterable list of user messages
- ✅ Sentiment and category filters work
- ✅ Admin can reply inline to any user
- ✅ Analytics page shows sentiment breakdown
- ✅ Category breakdown displayed
- ✅ Recent messages shown
- ✅ Admin-only access enforced
- ✅ UI follows ProductPix design principles
