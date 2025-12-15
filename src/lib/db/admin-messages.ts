// src/lib/db/admin-messages.ts
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logging';
import type { UserMessage, MessageAnalysis, SendAdminReplyParams } from '@/types';

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

// Analytics data types
export interface MessageStats {
  totalMessages: number;
  analyzedMessages: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
    positivePercentage: number;
    neutralPercentage: number;
    negativePercentage: number;
  };
  categoryBreakdown: {
    bug_report: number;
    feature_request: number;
    billing: number;
    praise: number;
    complaint: number;
    other: number;
  };
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
  // Joined data
  userEmail?: string;
}

export interface MessageAnalytics {
  stats: MessageStats;
  recentMessages: MessageSummary[];
}

/**
 * Calculate date range for analytics queries
 */
const calculateDateRange = (days: number): { startDate: Date; endDate: Date } => {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  return { startDate, endDate };
};

/**
 * Fetch raw message data for stats calculation
 */
const fetchMessageStatsData = async (
  supabase: any,
  startDate: Date
): Promise<{ analysis: MessageAnalysis | null }[]> => {
  const { data, error } = await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    .from('user_messages')
    .select('analysis')
    .gte('created_at', startDate.toISOString())
    .eq('is_from_admin', false); // Only analyze user messages

  if (error) {
    logger.error('Error fetching message stats', { error: error.message });
    throw error;
  }

  return data;
};

/**
 * Calculate message statistics from raw data
 */
const calculateMessageStats = (statsData: { analysis: MessageAnalysis | null }[]): MessageStats => {
  const totalMessages = statsData.length;
  const analyzedMessages = statsData.filter(m => m.analysis !== null).length;

  const sentimentCounts = {
    positive: 0,
    neutral: 0,
    negative: 0,
  };

  const categoryCounts = {
    bug_report: 0,
    feature_request: 0,
    billing: 0,
    praise: 0,
    complaint: 0,
    other: 0,
  };

  statsData.forEach(message => {
    if (message.analysis) {
      sentimentCounts[message.analysis.sentiment]++;
      categoryCounts[message.analysis.category]++;
    }
  });

  const analyzedCount = analyzedMessages;

  return {
    totalMessages,
    analyzedMessages,
    sentimentBreakdown: {
      positive: sentimentCounts.positive,
      neutral: sentimentCounts.neutral,
      negative: sentimentCounts.negative,
      positivePercentage: analyzedCount > 0 ? (sentimentCounts.positive / analyzedCount) * 100 : 0,
      neutralPercentage: analyzedCount > 0 ? (sentimentCounts.neutral / analyzedCount) * 100 : 0,
      negativePercentage: analyzedCount > 0 ? (sentimentCounts.negative / analyzedCount) * 100 : 0,
    },
    categoryBreakdown: categoryCounts,
  };
};

// Type for database row with user join
interface MessageWithUserRow {
  id: string;
  user_id: string;
  content: string;
  is_from_admin: boolean;
  read_at: string | null;
  analysis: MessageAnalysis | null;
  created_at: string;
  updated_at: string;
  users?: { email: string } | null;
}

/**
 * Map database message row to MessageSummary interface
 */
const mapMessageRowToSummary = (row: MessageWithUserRow): MessageSummary => ({
  id: row.id,
  userId: row.user_id,
  content: row.content,
  isFromAdmin: row.is_from_admin,
  readAt: row.read_at,
  analysis: row.analysis,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  userEmail: row.users?.email,
});

/**
 * Fetch recent messages with user data
 */
const fetchRecentMessages = async (
  supabase: any,
  startDate: Date,
  limit: number
): Promise<MessageSummary[]> => {
  const { data, error } = await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
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

  if (error) {
    logger.error('Error fetching recent messages', { error: error.message });
    throw error;
  }

  return data.map(mapMessageRowToSummary);
};

/**
 * Get comprehensive message analytics for admin dashboard
 */
export const getMessageAnalytics = async (
  options: {
    days?: number;
    limit?: number;
  } = {}
): Promise<MessageAnalytics> => {
  const { days = 30, limit = 50 } = options;
  const supabase = createAdminClient();

  try {
    const { startDate } = calculateDateRange(days);

    // Get basic stats
    const statsData = await fetchMessageStatsData(supabase, startDate);
    const stats = calculateMessageStats(statsData);

    // Get recent messages with joined data
    const recentMessages = await fetchRecentMessages(supabase, startDate, limit);

    return {
      stats,
      recentMessages,
    };
  } catch (error) {
    logger.error('Error getting message analytics', { error });
    throw error;
  }
};

/**
 * Get filtered messages list for admin browsing
 */
export const getFilteredMessages = async (
  options: {
    sentiment?: 'positive' | 'neutral' | 'negative';
    category?: 'bug_report' | 'feature_request' | 'billing' | 'praise' | 'complaint' | 'other';
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
    let query = (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
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
    if (sentiment) {
      query = query.eq('analysis->>sentiment', sentiment);
    }

    if (category) {
      query = query.eq('analysis->>category', category);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Error fetching filtered messages', { error: error.message });
      throw error;
    }

    const messages: MessageSummary[] = data.map(mapMessageRowToSummary);

    return {
      messages,
      total: count || 0,
    };
  } catch (error) {
    logger.error('Error getting filtered messages', { error });
    throw error;
  }
};

/**
 * Send admin reply to user
 */
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

  // Map to UserMessage interface
  return {
    id: data.id,
    userId: data.user_id,
    content: data.content,
    isFromAdmin: data.is_from_admin,
    readAt: data.read_at,
    analysis: data.analysis,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};