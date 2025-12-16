// src/lib/db/admin-stats.ts
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logging';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

// Type for the return value of get_filtered_user_list RPC
interface FilteredUserRow {
  id: string;
  email: string;
  display_name: string | null;
  credit_balance: number;
  created_at: string;
  last_active_at: string | null;
  job_count: number;
  error_count: number;
  message_count: number;
}
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
  const { data, error } = await supabase
    .from('user_activity')
    .select('user_id', { count: 'exact', head: false })
    .gte('created_at', startOfDay)
    .lt('created_at', endOfDay);

  if (error) {
    logger.error('Error fetching active users today', { error: error.message });
    throw error;
  }

  // Count unique user_ids
  const uniqueUsers = new Set(data?.map(row => row.user_id) || []);
  return uniqueUsers.size;
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
  const { count, error } = await supabase
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
 * Get filtered user list for admin browsing
 */
export const getFilteredUserList = async (
  filters: UserListFilters,
  options: { limit: number; cursor?: string }
): Promise<{ users: UserListItem[]; nextCursor: string | null }> => {
  const supabase = createAdminClient();

  try {
     const { data, error } = await supabase.rpc('get_filtered_user_list', {
      p_search: filters.search ?? undefined,
      p_has_errors: filters.hasErrors ?? undefined,
      p_has_messages: filters.hasMessages ?? undefined,
      p_min_credits: filters.minCredits ?? undefined,
      p_max_credits: filters.maxCredits ?? undefined,
      p_created_after: filters.createdAfter ?? undefined,
      p_created_before: filters.createdBefore ?? undefined,
      p_sort_by: filters.sortBy ?? 'created_at',
      p_sort_order: filters.sortOrder ?? 'desc',
      p_limit: options.limit,
      p_cursor: options.cursor ?? undefined
    });

    if (error) {
      logger.error('Error fetching filtered users', { error: error.message });
      throw error;
    }

    if (!data || data.length === 0) {
      return { users: [], nextCursor: null };
    }

    // Convert the RPC results to UserListItem format
    const users: UserListItem[] = (data as FilteredUserRow[]).map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      creditBalance: user.credit_balance,
      createdAt: user.created_at,
      lastActiveAt: user.last_active_at,
      jobCount: Number(user.job_count),
      errorCount: Number(user.error_count),
      messageCount: Number(user.message_count)
    }));

    // Compute next cursor from last returned row
    const nextCursor = users.length === options.limit && users.length > 0
      ? users[users.length - 1].createdAt
      : null;

    return {
      users,
      nextCursor
    };
  } catch (error) {
    logger.error('Error getting filtered user list', { error });
    throw error;
  }
};