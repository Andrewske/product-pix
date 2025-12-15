// src/lib/db/messages.ts
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logging';
import type { UserMessage, SubmitMessageParams, SendAdminReplyParams, MessageAnalysis } from '@/types';

// Temporary table types until migration runs and types are regenerated
interface UserMessagesTable {
  Row: {
    id: string;
    user_id: string;
    content: string;
    is_from_admin: boolean;
    read_at: string | null;
    analysis: MessageAnalysis | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    content: string;
    is_from_admin?: boolean;
    read_at?: string | null;
    analysis?: MessageAnalysis | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    content?: string;
    is_from_admin?: boolean;
    read_at?: string | null;
    analysis?: MessageAnalysis | null;
    created_at?: string;
    updated_at?: string;
  };
}

// Type for database row shape
type DbMessageRow = UserMessagesTable['Row'];

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

  const { data, error } = await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
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

  return mapDbMessageToInterface(data as DbMessageRow);
};

export const sendAdminReply = async (
  params: SendAdminReplyParams
): Promise<UserMessage | null> => {
  const supabase = createAdminClient();

  const { data, error } = await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
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

  return mapDbMessageToInterface(data as DbMessageRow);
};

export const getMessagesForUser = async (
  userId: string
): Promise<UserMessage[]> => {
  const supabase = createAdminClient();

  const { data, error } = await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
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

  return (data as DbMessageRow[]).map(mapDbMessageToInterface);
};

export const markAsRead = async (messageId: string): Promise<boolean> => {
  const supabase = createAdminClient();

  const { error } = await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
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

  const { error } = await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    .from('sentiment_analysis_queue')
    .insert({ message_id: messageId });

  if (error) {
    logger.error('Error queueing message for sentiment analysis', {
      error: error.message,
      messageId,
    });
  }
};