// src/lib/db/admin-feedback.ts
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logging';
import type { FeedbackType, FeedbackReason } from '@/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

// Analytics data types
export interface FeedbackStats {
  totalFeedback: number;
  positiveCount: number;
  negativeCount: number;
  positivePercentage: number;
  negativePercentage: number;
}

export interface FeedbackTrendPoint {
  date: string;
  positive: number;
  negative: number;
  total: number;
}

export interface ReasonStats {
  reason: FeedbackReason;
  count: number;
  percentage: number;
}

export interface FeedbackSummary {
  id: string;
  imageId: string;
  userId: string;
  feedbackType: FeedbackType;
  reasons: FeedbackReason[];
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined data
  userEmail?: string;
}

export interface FeedbackAnalytics {
  stats: FeedbackStats;
  trends: FeedbackTrendPoint[];
  positiveReasons: ReasonStats[];
  negativeReasons: ReasonStats[];
  recentFeedback: FeedbackSummary[];
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
 * Fetch raw feedback data for stats calculation
 */
const fetchFeedbackStatsData = async (
  supabase: SupabaseClient<Database>,
  startDate: Date
): Promise<{ feedback_type: 'positive' | 'negative' }[]> => {
  const { data, error } = await supabase
    .from('image_feedback')
    .select('feedback_type')
    .gte('created_at', startDate.toISOString());

  if (error) {
    logger.error('Error fetching feedback stats', { error: error.message });
    throw error;
  }

  return data;
};

/**
 * Calculate feedback statistics from raw data
 */
const calculateFeedbackStats = (statsData: { feedback_type: 'positive' | 'negative' }[]): FeedbackStats => {
  const totalFeedback = statsData.length;
  const positiveCount = statsData.filter(f => f.feedback_type === 'positive').length;
  const negativeCount = statsData.filter(f => f.feedback_type === 'negative').length;

  return {
    totalFeedback,
    positiveCount,
    negativeCount,
    positivePercentage: totalFeedback > 0 ? (positiveCount / totalFeedback) * 100 : 0,
    negativePercentage: totalFeedback > 0 ? (negativeCount / totalFeedback) * 100 : 0,
  };
};

/**
 * Fetch raw feedback data for reason analysis
 */
const fetchFeedbackReasonsData = async (
  supabase: SupabaseClient<Database>,
  startDate: Date
): Promise<{ feedback_type: 'positive' | 'negative'; reasons: FeedbackReason[] }[]> => {
  const { data, error } = await supabase
    .from('image_feedback')
    .select('feedback_type, reasons')
    .gte('created_at', startDate.toISOString());

  if (error) {
    logger.error('Error fetching feedback reasons', { error: error.message });
    throw error;
  }

  return data.map(row => ({ ...row, reasons: row.reasons as FeedbackReason[] }));
};

/**
 * Aggregate reasons by feedback type
 */
const aggregateReasonsByType = (
  reasonsData: { feedback_type: 'positive' | 'negative'; reasons: FeedbackReason[] }[]
): { positiveReasonsMap: Map<FeedbackReason, number>; negativeReasonsMap: Map<FeedbackReason, number> } => {
  const positiveReasonsMap = new Map<FeedbackReason, number>();
  const negativeReasonsMap = new Map<FeedbackReason, number>();

  reasonsData.forEach(feedback => {
    const targetMap = feedback.feedback_type === 'positive' ? positiveReasonsMap : negativeReasonsMap;
    feedback.reasons.forEach(reason => {
      targetMap.set(reason, (targetMap.get(reason) || 0) + 1);
    });
  });

  return { positiveReasonsMap, negativeReasonsMap };
};

/**
 * Create reason statistics from aggregated data
 */
const createReasonStats = (map: Map<FeedbackReason, number>, total: number): ReasonStats[] => {
  return Array.from(map.entries())
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
};

// Type for database row with user join
interface FeedbackWithUserRow {
  id: string;
  image_id: string;
  user_id: string;
  feedback_type: 'positive' | 'negative';
  reasons: string[];
  comment: string | null;
  created_at: string;
  updated_at: string;
  users?: { email: string } | null;
}

/**
 * Map database feedback row to FeedbackSummary interface
 */
const mapFeedbackRowToSummary = (row: FeedbackWithUserRow): FeedbackSummary => ({
  id: row.id,
  imageId: row.image_id,
  userId: row.user_id,
  feedbackType: row.feedback_type,
  reasons: row.reasons as FeedbackReason[],
  comment: row.comment,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  userEmail: row.users?.email,
});

/**
 * Fetch recent feedback with user data
 */
const fetchRecentFeedback = async (
  supabase: SupabaseClient<Database>,
  startDate: Date,
  limit: number
): Promise<FeedbackSummary[]> => {
  const { data, error } = await supabase
    .from('image_feedback')
    .select(`
      id,
      image_id,
      user_id,
      feedback_type,
      reasons,
      comment,
      created_at,
      updated_at,
      users!inner(email)
    `)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Error fetching recent feedback', { error: error.message });
    throw error;
  }

  return data.map(mapFeedbackRowToSummary);
};

/**
 * Get comprehensive feedback analytics for admin dashboard
 */
export const getFeedbackAnalytics = async (
  options: {
    days?: number;
    limit?: number;
  } = {}
): Promise<FeedbackAnalytics> => {
  const { days = 30, limit = 50 } = options;
  const supabase = createAdminClient();

  try {
    const { startDate } = calculateDateRange(days);

    // Get basic stats
    const statsData = await fetchFeedbackStatsData(supabase, startDate);
    const stats = calculateFeedbackStats(statsData);

    // For now, return empty trends (can be implemented with SQL later)
    const trends: FeedbackTrendPoint[] = [];

    // Get reason statistics
    const reasonsData = await fetchFeedbackReasonsData(supabase, startDate);
    const { positiveReasonsMap, negativeReasonsMap } = aggregateReasonsByType(reasonsData);

    const positiveReasons = createReasonStats(positiveReasonsMap, stats.positiveCount);
    const negativeReasons = createReasonStats(negativeReasonsMap, stats.negativeCount);

    // Get recent feedback with joined data
    const recentFeedback = await fetchRecentFeedback(supabase, startDate, limit);

    return {
      stats,
      trends,
      positiveReasons,
      negativeReasons,
      recentFeedback,
    };
  } catch (error) {
    logger.error('Error getting feedback analytics', { error });
    throw error;
  }
};

/**
 * Get filtered feedback list for admin browsing
 */
export const getFilteredFeedback = async (
  options: {
    feedbackType?: FeedbackType;
    reason?: FeedbackReason;
    userId?: string;
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  } = {}
): Promise<{ feedback: FeedbackSummary[]; total: number }> => {
  const {
    feedbackType,
    reason,
    userId,
    limit = 50,
    offset = 0,
    startDate,
    endDate,
  } = options;

  const supabase = createAdminClient();

  try {
    let query = supabase
      .from('image_feedback')
      .select(`
        id,
        image_id,
        user_id,
        feedback_type,
        reasons,
        comment,
        created_at,
        updated_at,
        users!inner(email)
      `, { count: 'exact' });

    // Apply filters
    if (feedbackType) {
      query = query.eq('feedback_type', feedbackType);
    }

    if (reason) {
      query = query.contains('reasons', [reason]);
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
      logger.error('Error fetching filtered feedback', { error: error.message });
      throw error;
    }

    const feedback: FeedbackSummary[] = data.map(row => ({
      id: row.id,
      imageId: row.image_id,
      userId: row.user_id,
      feedbackType: row.feedback_type,
      reasons: row.reasons as FeedbackReason[],
      comment: row.comment,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      userEmail: row.users?.email,
    }));

    return {
      feedback,
      total: count || 0,
    };
  } catch (error) {
    logger.error('Error getting filtered feedback', { error });
    throw error;
  }
};