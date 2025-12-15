# Backend: Message Types and Database Functions

## Files to Create
- `src/types/messages.ts` (new)
- `src/lib/db/messages.ts` (new)

## Implementation Details

### Type Definitions

**File**: `src/types/messages.ts`

Mirror pattern from `src/types/feedback.ts`:

```typescript
export interface MessageAnalysis {
  category: 'bug_report' | 'feature_request' | 'billing' | 'praise' | 'complaint' | 'other';
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number; // 0-1
  analyzedAt: string; // ISO timestamp
  model: string; // e.g., "claude-haiku-3.5"
}

export interface UserMessage {
  id: string;
  userId: string;
  content: string;
  isFromAdmin: boolean;
  readAt: string | null;
  analysis: MessageAnalysis | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitMessageParams {
  content: string;
}

export interface SendAdminReplyParams {
  userId: string;
  content: string;
}
```

### Database Functions

**File**: `src/lib/db/messages.ts`

Mirror pattern from `src/lib/db/feedback.ts`:

```typescript
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logging';
import type { UserMessage, SubmitMessageParams, SendAdminReplyParams } from '@/types';

// Type for database row shape
interface DbMessageRow {
  id: string;
  user_id: string;
  content: string;
  is_from_admin: boolean;
  read_at: string | null;
  analysis: MessageAnalysis | null;
  created_at: string;
  updated_at: string;
}

// Helper function to map database row to interface
const mapDbMessageToInterface = (data: DbMessageRow): UserMessage => ({
  id: data.id,
  userId: data.user_id,
  content: data.content,
  isFromAdmin: data.is_from_admin,
  readAt: data.read_at,
  analysis: data.analysis,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

export const submitMessage = async (
  userId: string,
  params: SubmitMessageParams
): Promise<UserMessage | null> => {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('user_messages')
    .insert({
      user_id: userId,
      content: params.content,
      is_from_admin: false,
    })
    .select()
    .single();

  if (error) {
    logger.error('Error submitting message', {
      error: error.message,
      userId,
    });
    return null;
  }

  // Queue for sentiment analysis (if content is long enough)
  if (params.content.length >= 10) {
    await queueForSentimentAnalysis(data.id);
  }

  return mapDbMessageToInterface(data);
};

export const sendAdminReply = async (
  params: SendAdminReplyParams
): Promise<UserMessage | null> => {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('user_messages')
    .insert({
      user_id: params.userId,
      content: params.content,
      is_from_admin: true,
    })
    .select()
    .single();

  if (error) {
    logger.error('Error sending admin reply', {
      error: error.message,
      userId: params.userId,
    });
    return null;
  }

  return mapDbMessageToInterface(data);
};

export const getMessagesForUser = async (
  userId: string
): Promise<UserMessage[]> => {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('user_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    logger.error('Error getting messages for user', {
      error: error.message,
      userId,
    });
    return [];
  }

  return data.map(mapDbMessageToInterface);
};

export const markAsRead = async (messageId: string): Promise<boolean> => {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('user_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('id', messageId);

  if (error) {
    logger.error('Error marking message as read', {
      error: error.message,
      messageId,
    });
    return false;
  }

  return true;
};

const queueForSentimentAnalysis = async (messageId: string): Promise<void> => {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('sentiment_analysis_queue')
    .insert({ message_id: messageId });

  if (error) {
    logger.error('Error queueing message for sentiment analysis', {
      error: error.message,
      messageId,
    });
  }
};
```

## Reference Patterns
- `src/lib/db/feedback.ts` - CRUD functions pattern
- `src/types/feedback.ts` - Type definitions pattern

## Acceptance Criteria
- ✅ `submitMessage()` creates user message and queues for analysis
- ✅ `sendAdminReply()` creates admin message
- ✅ `getMessagesForUser()` returns messages in chronological order
- ✅ `markAsRead()` updates read timestamp
- ✅ All functions use admin client for RLS bypass
- ✅ All errors are logged with context
- ✅ Type mappings handle camelCase ↔ snake_case
