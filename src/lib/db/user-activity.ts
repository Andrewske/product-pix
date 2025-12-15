// src/lib/db/user-activity.ts
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logging';
import type { Tables, Json } from '@/types/database';

export type ActivityEventType =
  | 'login' | 'logout'
  | 'image_download' | 'pricing_viewed' | 'insufficient_credits';

export type UserActivity = Tables<'user_activity'>;

export async function trackActivity(
  userId: string,
  eventType: ActivityEventType,
  properties?: Record<string, unknown>
): Promise<void> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (supabase as any)
    .from('user_activity')
    .insert({
      user_id: userId,
      event_type: eventType,
      properties: (properties as Json) ?? {},
    });

  if (insertError) {
    logger.error('Error inserting user activity', {
      error: insertError.message,
      userId,
      eventType,
      properties,
    });
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from('users')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', userId);

  if (updateError) {
    logger.error('Error updating user last_active_at', {
      error: updateError.message,
      userId,
    });
  }
}

export async function getUserActivity(
  userId: string,
  options: { limit: number; cursor?: string; eventTypes?: ActivityEventType[] }
): Promise<{ activities: UserActivity[]; nextCursor: string | null }> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('user_activity')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(options.limit + 1); // +1 to check if there are more results

  if (options.eventTypes && options.eventTypes.length > 0) {
    query = query.in('event_type', options.eventTypes);
  }

  if (options.cursor) {
    const [timestamp] = options.cursor.split('_');
    query = query.lt('created_at', timestamp);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching user activity', {
      error: error.message,
      userId,
      options,
    });
    return { activities: [], nextCursor: null };
  }

  const hasMore = data.length > options.limit;
  const activities = hasMore ? data.slice(0, options.limit) : data;

  let nextCursor: string | null = null;
  if (hasMore && activities.length > 0) {
    const lastActivity = activities[activities.length - 1];
    nextCursor = `${lastActivity.created_at}_${lastActivity.id}`;
  }

  return { activities: activities as UserActivity[], nextCursor };
}