// src/lib/db/admin-timeline.ts
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logging';
import type { Tables } from '@/types/database';

// Temporary table types until types are regenerated
interface UserMessagesTable {
  Row: {
    id: string;
    user_id: string;
    content: string;
    is_from_admin: boolean;
    read_at: string | null;
    created_at: string;
    updated_at: string;
    analysis: unknown | null;
  };
}

interface UserActivityTable {
  Row: {
    id: string;
    user_id: string;
    event_type: string;
    properties: unknown | null;
    created_at: string | null;
  };
}

export type TimelineEventType =
  | 'job' | 'transaction' | 'message' | 'image'
  | 'feedback' | 'error' | 'upload' | 'activity';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  subtype: string;        // e.g., 'generation', 'purchase', 'login'
  timestamp: string;
  title: string;          // Human-readable summary
  metadata: Record<string, unknown>;
}

export interface TimelineFilters {
  types?: TimelineEventType[];
  startDate?: string | null;
  endDate?: string | null;
}

export async function getUnifiedTimeline(
  userId: string,
  options: {
    limit: number;
    cursor?: string;       // Format: "{timestamp}_{id}"
    filters?: TimelineFilters;
  }
): Promise<{ events: TimelineEvent[]; nextCursor: string | null }> {
  const supabase = createAdminClient();
  const { limit, cursor, filters } = options;

  // Parse cursor: "{timestamp}_{id}"
  let cursorTimestamp: string | null = null;
  let cursorId: string | null = null;
  if (cursor) {
    const parts = cursor.split('_', 2);
    if (parts.length === 2) {
      cursorTimestamp = parts[0];
      cursorId = parts[1];
    }
  }

  // Determine which tables to query based on filters
  const tablesToQuery: TimelineEventType[] = filters?.types || [
    'job', 'transaction', 'message', 'image', 'feedback', 'error', 'upload', 'activity'
  ];

  // Build queries for each table
  const queryPromises: Promise<TimelineEvent[]>[] = [];

  // Jobs table
  if (tablesToQuery.includes('job')) {
    queryPromises.push(
      (async () => {
        let query = supabase
          .from('jobs')
          .select('id, created_at, status, template_slug, credits_charged, error_message, prompt')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(limit);

        if (cursorTimestamp && cursorId) {
          query = query.lt('created_at', cursorTimestamp).or(`created_at.eq.${cursorTimestamp},id.lt.${cursorId}`);
        }

        if (filters?.startDate) {
          query = query.gte('created_at', filters.startDate);
        }
        if (filters?.endDate) {
          query = query.lte('created_at', filters.endDate);
        }

        const { data, error } = await query;
        if (error) {
          logger.error('Error fetching jobs for timeline', { error, userId });
          return [];
        }

        return (data as Tables<'jobs'>[]).map(job => ({
          id: job.id,
          type: 'job' as TimelineEventType,
          subtype: job.status,
          timestamp: job.created_at,
          title: `Generated image with ${job.template_slug} (${job.credits_charged} credits)`,
          metadata: {
            template_slug: job.template_slug,
            status: job.status,
            credits_charged: job.credits_charged,
            error_message: job.error_message,
            prompt: job.prompt.substring(0, 100) + (job.prompt.length > 100 ? '...' : ''),
          },
        }));
      })()
    );
  }

  // Credit transactions table
  if (tablesToQuery.includes('transaction')) {
    queryPromises.push(
      (async () => {
        let query = supabase
          .from('credit_transactions')
          .select('id, created_at, transaction_type, amount, description, balance_after')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(limit);

        if (cursorTimestamp && cursorId) {
          query = query.lt('created_at', cursorTimestamp).or(`created_at.eq.${cursorTimestamp},id.lt.${cursorId}`);
        }

        if (filters?.startDate) {
          query = query.gte('created_at', filters.startDate);
        }
        if (filters?.endDate) {
          query = query.lte('created_at', filters.endDate);
        }

        const { data, error } = await query;
        if (error) {
          logger.error('Error fetching credit transactions for timeline', { error, userId });
          return [];
        }

        return (data as Tables<'credit_transactions'>[]).map(tx => ({
          id: tx.id,
          type: 'transaction' as TimelineEventType,
          subtype: tx.transaction_type,
          timestamp: tx.created_at,
          title: `${tx.transaction_type}: ${tx.amount > 0 ? '+' : ''}${tx.amount} credits`,
          metadata: {
            transaction_type: tx.transaction_type,
            amount: tx.amount,
            description: tx.description,
            balance_after: tx.balance_after,
          },
        }));
      })()
    );
  }

  // User messages table
  if (tablesToQuery.includes('message')) {
    queryPromises.push(
      (async () => {
        let query = (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
          .from('user_messages')
          .select('id, created_at, content, is_from_admin, read_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(limit);

        if (cursorTimestamp && cursorId) {
          query = query.lt('created_at', cursorTimestamp).or(`created_at.eq.${cursorTimestamp},id.lt.${cursorId}`);
        }

        if (filters?.startDate) {
          query = query.gte('created_at', filters.startDate);
        }
        if (filters?.endDate) {
          query = query.lte('created_at', filters.endDate);
        }

        const { data, error } = await query;
        if (error) {
          logger.error('Error fetching user messages for timeline', { error, userId });
          return [];
        }

        return (data as UserMessagesTable['Row'][]).map(msg => ({
          id: msg.id,
          type: 'message' as TimelineEventType,
          subtype: msg.is_from_admin ? 'admin' : 'user',
          timestamp: msg.created_at,
          title: msg.is_from_admin ? 'Message from admin' : 'Message sent',
          metadata: {
            content: msg.content.substring(0, 200) + (msg.content.length > 200 ? '...' : ''),
            is_from_admin: msg.is_from_admin,
            read_at: msg.read_at,
          },
        }));
      })()
    );
  }

  // Generated images table
  if (tablesToQuery.includes('image')) {
    queryPromises.push(
      (async () => {
        let query = supabase
          .from('generated_images')
          .select('id, created_at, title, file_key, public_url, is_favorite')
          .eq('user_id', userId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(limit);

        if (cursorTimestamp && cursorId) {
          query = query.lt('created_at', cursorTimestamp).or(`created_at.eq.${cursorTimestamp},id.lt.${cursorId}`);
        }

        if (filters?.startDate) {
          query = query.gte('created_at', filters.startDate);
        }
        if (filters?.endDate) {
          query = query.lte('created_at', filters.endDate);
        }

        const { data, error } = await query;
        if (error) {
          logger.error('Error fetching generated images for timeline', { error, userId });
          return [];
        }

        return (data as Tables<'generated_images'>[]).map(img => ({
          id: img.id,
          type: 'image' as TimelineEventType,
          subtype: 'generated',
          timestamp: img.created_at,
          title: img.title || 'Image generated',
          metadata: {
            file_key: img.file_key,
            public_url: img.public_url,
            is_favorite: img.is_favorite,
          },
        }));
      })()
    );
  }

  // Image feedback table
  if (tablesToQuery.includes('feedback')) {
    queryPromises.push(
      (async () => {
        let query = supabase
          .from('image_feedback')
          .select('id, created_at, feedback_type, comment, reasons, image_id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(limit);

        if (cursorTimestamp && cursorId) {
          query = query.lt('created_at', cursorTimestamp).or(`created_at.eq.${cursorTimestamp},id.lt.${cursorId}`);
        }

        if (filters?.startDate) {
          query = query.gte('created_at', filters.startDate);
        }
        if (filters?.endDate) {
          query = query.lte('created_at', filters.endDate);
        }

        const { data, error } = await query;
        if (error) {
          logger.error('Error fetching image feedback for timeline', { error, userId });
          return [];
        }

        return (data as Tables<'image_feedback'>[]).map(fb => ({
          id: fb.id,
          type: 'feedback' as TimelineEventType,
          subtype: fb.feedback_type,
          timestamp: fb.created_at,
          title: `Feedback: ${fb.feedback_type}`,
          metadata: {
            feedback_type: fb.feedback_type,
            comment: fb.comment,
            reasons: fb.reasons,
            image_id: fb.image_id,
          },
        }));
      })()
    );
  }

  // Critical errors table
  if (tablesToQuery.includes('error')) {
    queryPromises.push(
      (async () => {
        let query = supabase
          .from('critical_errors')
          .select('id, created_at, error_name, error_message, domain, severity, resolved_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(limit);

        if (cursorTimestamp && cursorId) {
          query = query.lt('created_at', cursorTimestamp).or(`created_at.eq.${cursorTimestamp},id.lt.${cursorId}`);
        }

        if (filters?.startDate) {
          query = query.gte('created_at', filters.startDate);
        }
        if (filters?.endDate) {
          query = query.lte('created_at', filters.endDate);
        }

        const { data, error } = await query;
        if (error) {
          logger.error('Error fetching critical errors for timeline', { error, userId });
          return [];
        }

        return (data as Tables<'critical_errors'>[]).map(err => ({
          id: err.id,
          type: 'error' as TimelineEventType,
          subtype: err.severity,
          timestamp: err.created_at || '',
          title: `${err.domain}: ${err.error_name}`,
          metadata: {
            error_name: err.error_name,
            error_message: err.error_message,
            domain: err.domain,
            severity: err.severity,
            resolved_at: err.resolved_at,
          },
        }));
      })()
    );
  }

  // Uploads table
  if (tablesToQuery.includes('upload')) {
    queryPromises.push(
      (async () => {
        let query = supabase
          .from('uploads')
          .select('id, created_at, filename, file_size, mime_type')
          .eq('user_id', userId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(limit);

        if (cursorTimestamp && cursorId) {
          query = query.lt('created_at', cursorTimestamp).or(`created_at.eq.${cursorTimestamp},id.lt.${cursorId}`);
        }

        if (filters?.startDate) {
          query = query.gte('created_at', filters.startDate);
        }
        if (filters?.endDate) {
          query = query.lte('created_at', filters.endDate);
        }

        const { data, error } = await query;
        if (error) {
          logger.error('Error fetching uploads for timeline', { error, userId });
          return [];
        }

        return (data as Tables<'uploads'>[]).map(upload => ({
          id: upload.id,
          type: 'upload' as TimelineEventType,
          subtype: 'file',
          timestamp: upload.created_at,
          title: `Uploaded ${upload.filename}`,
          metadata: {
            filename: upload.filename,
            file_size: upload.file_size,
            mime_type: upload.mime_type,
          },
        }));
      })()
    );
  }

  // User activity table
  if (tablesToQuery.includes('activity')) {
    queryPromises.push(
      (async () => {
        let query = (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
          .from('user_activity')
          .select('id, created_at, event_type, properties')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(limit);

        if (cursorTimestamp && cursorId) {
          query = query.lt('created_at', cursorTimestamp).or(`created_at.eq.${cursorTimestamp},id.lt.${cursorId}`);
        }

        if (filters?.startDate) {
          query = query.gte('created_at', filters.startDate);
        }
        if (filters?.endDate) {
          query = query.lte('created_at', filters.endDate);
        }

        const { data, error } = await query;
        if (error) {
          logger.error('Error fetching user activity for timeline', { error, userId });
          return [];
        }

        return (data as UserActivityTable['Row'][]).map(activity => ({
          id: activity.id,
          type: 'activity' as TimelineEventType,
          subtype: activity.event_type,
          timestamp: activity.created_at || '',
          title: activity.event_type.replace(/_/g, ' '),
          metadata: activity.properties as Record<string, unknown> || {},
        }));
      })()
    );
  }

  // Execute all queries in parallel
  const results = await Promise.all(queryPromises);

  // Merge all results
  const allEvents = results.flat();

  // Sort by timestamp DESC, then by id DESC
  allEvents.sort((a, b) => {
    const timeDiff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    if (timeDiff !== 0) return timeDiff;
    return b.id.localeCompare(a.id);
  });

  // Apply limit and compute next cursor
  const limitedEvents = allEvents.slice(0, limit);
  let nextCursor: string | null = null;
  if (limitedEvents.length === limit && allEvents.length > limit) {
    const lastEvent = limitedEvents[limitedEvents.length - 1];
    nextCursor = `${lastEvent.timestamp}_${lastEvent.id}`;
  }

  return { events: limitedEvents, nextCursor };
}