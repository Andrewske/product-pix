// src/lib/db/admin-stats.ts
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logging';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

export interface AdminDashboardStats {
  usersToday: number;
  usersThisWeek: number;
  activeUsersToday: number;    // Users with activity today
  generationsToday: number;
  errorsToday: number;
  pendingMessages: number;     // Unread user messages
  pendingRefunds: number;
}

export interface UserListFilters {
  search?: string;           // Email or display_name
  hasErrors?: boolean;       // Has errors in last 7 days
  hasMessages?: boolean;     // Has unread messages
  minCredits?: number;
  maxCredits?: number;
  createdAfter?: string;
  createdBefore?: string;
  sortBy?: 'created_at' | 'last_active' | 'credit_balance';
  sortOrder?: 'asc' | 'desc';
}

export interface UserListItem {
  id: string;
  email: string;
  displayName: string | null;
  creditBalance: number;
  createdAt: string;
  lastActiveAt: string | null;  // From users.last_active_at column (will be null until migration runs)
  jobCount: number;
  errorCount: number;           // Errors in last 7 days
  messageCount: number;
}

/**
 * Get today's date range for queries
 */
const getTodayRange = (): { startOfDay: string; endOfDay: string } => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
  return { startOfDay, endOfDay };
};

/**
 * Get this week's date range for queries (Monday to Sunday)
 */
const getThisWeekRange = (): { startOfWeek: string; endOfWeek: string } => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to get Monday
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return { startOfWeek: startOfWeek.toISOString(), endOfWeek: endOfWeek.toISOString() };
};

/**
 * Fetch users created today count
 */
const fetchUsersToday = async (supabase: SupabaseClient<Database>): Promise<number> => {
  const { startOfDay, endOfDay } = getTodayRange();
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfDay)
    .lt('created_at', endOfDay);

  if (error) {
    logger.error('Error fetching users today', { error: error.message });
    throw error;
  }

  return count || 0;
};

/**
 * Fetch users created this week count
 */
const fetchUsersThisWeek = async (supabase: SupabaseClient<Database>): Promise<number> => {
  const { startOfWeek, endOfWeek } = getThisWeekRange();
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfWeek)
    .lt('created_at', endOfWeek);

  if (error) {
    logger.error('Error fetching users this week', { error: error.message });
    throw error;
  }

  return count || 0;
};

/**
 * Fetch active users today (users with activity today)
 */
const fetchActiveUsersToday = async (supabase: SupabaseClient<Database>): Promise<number> => {
  const { startOfDay, endOfDay } = getTodayRange();
  const { count, error } = await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    .from('user_activity')
    .select('user_id', { count: 'exact', head: true })
    .gte('created_at', startOfDay)
    .lt('created_at', endOfDay);

  if (error) {
    logger.error('Error fetching active users today', { error: error.message });
    throw error;
  }

  return count || 0;
};

/**
 * Fetch generations today count
 */
const fetchGenerationsToday = async (supabase: SupabaseClient<Database>): Promise<number> => {
  const { startOfDay, endOfDay } = getTodayRange();
  const { count, error } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfDay)
    .lt('created_at', endOfDay);

  if (error) {
    logger.error('Error fetching generations today', { error: error.message });
    throw error;
  }

  return count || 0;
};

/**
 * Fetch errors today count
 */
const fetchErrorsToday = async (supabase: SupabaseClient<Database>): Promise<number> => {
  const { startOfDay, endOfDay } = getTodayRange();
  const { count, error } = await supabase
    .from('critical_errors')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfDay)
    .lt('created_at', endOfDay);

  if (error) {
    logger.error('Error fetching errors today', { error: error.message });
    throw error;
  }

  return count || 0;
};

/**
 * Fetch pending messages count (unread user messages)
 */
const fetchPendingMessages = async (supabase: SupabaseClient<Database>): Promise<number> => {
  const { count, error } = await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    .from('user_messages')
    .select('*', { count: 'exact', head: true })
    .eq('is_from_admin', false)
    .is('read_at', null);

  if (error) {
    logger.error('Error fetching pending messages', { error: error.message });
    throw error;
  }

  return count || 0;
};

/**
 * Fetch pending refunds count
 */
const fetchPendingRefunds = async (supabase: SupabaseClient<Database>): Promise<number> => {
  // Count both image refund requests and cash refund requests that are pending
  const [imageRefunds, cashRefunds] = await Promise.all([
    supabase
      .from('image_refund_requests')
      .select('*', { count: 'exact', head: true })
      .is('approved_at', null)
      .is('rejected_at', null),
    supabase
      .from('cash_refund_requests')
      .select('*', { count: 'exact', head: true })
      .is('approved_at', null)
      .is('rejected_at', null)
  ]);

  if (imageRefunds.error) {
    logger.error('Error fetching pending image refunds', { error: imageRefunds.error.message });
    throw imageRefunds.error;
  }

  if (cashRefunds.error) {
    logger.error('Error fetching pending cash refunds', { error: cashRefunds.error.message });
    throw cashRefunds.error;
  }

  return (imageRefunds.count || 0) + (cashRefunds.count || 0);
};

/**
 * Get comprehensive admin dashboard statistics
 */
export const getAdminDashboardStats = async (): Promise<AdminDashboardStats> => {
  const supabase = createAdminClient();

  try {
    const [
      usersToday,
      usersThisWeek,
      activeUsersToday,
      generationsToday,
      errorsToday,
      pendingMessages,
      pendingRefunds
    ] = await Promise.all([
      fetchUsersToday(supabase),
      fetchUsersThisWeek(supabase),
      fetchActiveUsersToday(supabase),
      fetchGenerationsToday(supabase),
      fetchErrorsToday(supabase),
      fetchPendingMessages(supabase),
      fetchPendingRefunds(supabase)
    ]);

    return {
      usersToday,
      usersThisWeek,
      activeUsersToday,
      generationsToday,
      errorsToday,
      pendingMessages,
      pendingRefunds
    };
  } catch (error) {
    logger.error('Error getting admin dashboard stats', { error });
    throw error;
  }
};

/**
 * Build user list query with filters
 */
const buildUserListQuery = (supabase: SupabaseClient<Database>, filters: UserListFilters, limit: number, cursor?: string): any => { // eslint-disable-line @typescript-eslint/no-explicit-any
  let query = supabase
    .from('users')
    .select('id, email, display_name, credit_balance, created_at');

  // Apply search filter (email or display_name)
  if (filters.search) {
    query = query.or(`email.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%`);
  }

  // Apply credit balance filters
  if (filters.minCredits !== undefined) {
    query = query.gte('credit_balance', filters.minCredits);
  }
  if (filters.maxCredits !== undefined) {
    query = query.lte('credit_balance', filters.maxCredits);
  }

  // Apply date filters
  if (filters.createdAfter) {
    query = query.gte('created_at', filters.createdAfter);
  }
  if (filters.createdBefore) {
    query = query.lte('created_at', filters.createdBefore);
  }

  // Apply sorting
  const sortBy = filters.sortBy || 'created_at';
  const sortOrder = filters.sortOrder === 'asc';
  query = query.order(sortBy, { ascending: sortOrder });

  // Apply cursor-based pagination
  if (cursor) {
    // For simplicity, using created_at as cursor. In production, might need more sophisticated cursor logic
    query = query.lt('created_at', cursor);
  }

  query = query.limit(limit);

  return query;
};

/**
 * Calculate job count for a user
 */
const getJobCount = async (supabase: SupabaseClient<Database>, userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    logger.error('Error fetching job count for user', { error: error.message, userId });
    return 0;
  }

  return count || 0;
};

/**
 * Calculate error count for last 7 days for a user
 */
const getErrorCountLast7Days = async (supabase: SupabaseClient<Database>, userId: string): Promise<number> => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from('critical_errors')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo);

  if (error) {
    logger.error('Error fetching error count for user', { error: error.message, userId });
    return 0;
  }

  return count || 0;
};

/**
 * Calculate message count for a user
 */
const getMessageCount = async (supabase: SupabaseClient<Database>, userId: string): Promise<number> => {
  const { count, error } = await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    .from('user_messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_from_admin', false);

  if (error) {
    logger.error('Error fetching message count for user', { error: error.message, userId });
    return 0;
  }

  return count || 0;
};

/**
 * Get filtered user list for admin browsing
 */
export const getFilteredUserList = async (
  filters: UserListFilters,
  options: { limit: number; cursor?: string }
): Promise<{ users: UserListItem[]; nextCursor: string | null }> => {
  const supabase = createAdminClient();

  try {
    // First, get basic user data with joins for counts
    const query = buildUserListQuery(supabase, filters, options.limit, options.cursor);
    const { data: usersData, error } = await query;

    if (error) {
      logger.error('Error fetching filtered users', { error: error.message });
      throw error;
    }

    if (!usersData || usersData.length === 0) {
      return { users: [], nextCursor: null };
    }

    // For each user, get additional computed data
    const userPromises = usersData.map(async (user: { id: string; email: string; display_name: string | null; credit_balance: number; created_at: string }) => {
      const [jobCount, errorCount, messageCount] = await Promise.all([
        getJobCount(supabase, user.id),
        getErrorCountLast7Days(supabase, user.id),
        getMessageCount(supabase, user.id)
      ]);

      // Apply hasErrors and hasMessages filters (post-query since they require computed data)
      if (filters.hasErrors !== undefined && filters.hasErrors !== (errorCount > 0)) {
        return null;
      }
      if (filters.hasMessages !== undefined && filters.hasMessages !== (messageCount > 0)) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        creditBalance: user.credit_balance,
        createdAt: user.created_at,
        lastActiveAt: null, // Will be populated after migration runs
        jobCount,
        errorCount,
        messageCount
      };
    });

    const users = await Promise.all(userPromises);

    // Filter out null results from post-query filters
    const validUsers = users.filter((user): user is NonNullable<typeof user> => user !== null);

    // Determine next cursor
    const lastUser = validUsers[validUsers.length - 1];
    const nextCursor = lastUser ? lastUser.createdAt : null;

    return {
      users: validUsers,
      nextCursor
    };
  } catch (error) {
    logger.error('Error getting filtered user list', { error });
    throw error;
  }
};