// src/lib/db/admin-timeline.ts
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logging';
import { metadataSchemas } from './admin-timeline-schemas';
import type { SupabaseClient } from '@supabase/supabase-js';



export type TimelineEventType =
  | 'job' | 'transaction' | 'message' | 'image'
  | 'feedback' | 'error' | 'upload' | 'activity';

// Type for user_timeline_view row
type TimelineViewRow = {
  id: string;
  type: string;
  subtype: string;
  timestamp: string;
  metadata: Record<string, unknown>;
};

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
    cursor?: string;
    filters?: TimelineFilters;
  }
): Promise<{ events: TimelineEvent[]; nextCursor: string | null }> {
  const supabase = createAdminClient();
  const { limit, cursor, filters } = options;

  // Parse cursor
  let cursorTimestamp: string | null = null;
  let cursorId: string | null = null;
  if (cursor) {
    const parts = cursor.split('_', 2);
    if (parts.length === 2) {
      cursorTimestamp = parts[0];
      cursorId = parts[1];
    }
  }

  // Build query against view
  let query = (supabase as SupabaseClient)
    .from('user_timeline_view')
    .select('id, type, subtype, timestamp, metadata')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1); // +1 to check for next page

  // Apply cursor pagination
  if (cursorTimestamp && cursorId) {
    query = query.or(`timestamp.lt.${cursorTimestamp},and(timestamp.eq.${cursorTimestamp},id.lt.${cursorId})`);
  }

  // Apply type filter
  if (filters?.types && filters.types.length > 0) {
    query = query.in('type', filters.types);
  }

  // Apply date filters
  if (filters?.startDate && filters.startDate !== null) {
    query = query.gte('timestamp', filters.startDate);
  }
  if (filters?.endDate && filters.endDate !== null) {
    query = query.lte('timestamp', filters.endDate);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching unified timeline', { error, userId });
    return { events: [], nextCursor: null };
  }

  // Check for next page
  const hasMore = data.length > limit;
  const events = hasMore ? data.slice(0, limit) : data;

  // Map to TimelineEvent format with validation
  const validatedEvents = (events as TimelineViewRow[]).map((row) => ({
    id: row.id,
    type: row.type as TimelineEventType,
    subtype: row.subtype,
    timestamp: row.timestamp,
    title: generateTitle(row),
    metadata: validateMetadata(row.type, row.metadata),
  }));

  // Compute next cursor
  let nextCursor: string | null = null;
  if (hasMore && validatedEvents.length > 0) {
    const lastEvent = validatedEvents[validatedEvents.length - 1];
    nextCursor = `${lastEvent.timestamp}_${lastEvent.id}`;
  }

  return { events: validatedEvents, nextCursor };
}

// Helper: Generate human-readable title
function generateTitle(row: { type: string; subtype: string; metadata: Record<string, unknown> }): string {
  switch (row.type) {
    case 'job': {
      const metadata = row.metadata;
      return `Generated image with ${metadata.template_slug as string} (${metadata.credits_charged as number} credits)`;
    }
    case 'transaction': {
      const metadata = row.metadata;
      const amount = metadata.amount as number;
      return `${metadata.transaction_type as string}: ${amount > 0 ? '+' : ''}${amount} credits`;
    }
    case 'message': {
      const metadata = row.metadata;
      return (metadata.is_from_admin as boolean) ? 'Message from admin' : 'Message sent';
    }
    case 'image':
      return 'Image generated';
    case 'feedback': {
      const metadata = row.metadata;
      return `Feedback: ${metadata.feedback_type as string}`;
    }
    case 'error': {
      const metadata = row.metadata;
      return `${metadata.domain as string}: ${metadata.error_name as string}`;
    }
    case 'upload': {
      const metadata = row.metadata;
      return `Uploaded ${metadata.filename as string}`;
    }
    case 'activity':
      return row.subtype.replace(/_/g, ' ');
    default:
      return row.subtype.replace(/_/g, ' ');
  }
}

// Helper: Validate metadata with Zod schemas
function validateMetadata(type: string, metadata: unknown): Record<string, unknown> {
  const schema = metadataSchemas[type as TimelineEventType];
  if (!schema) return metadata as Record<string, unknown>;

  const result = schema.safeParse(metadata);
  if (!result.success) {
    logger.warn('Invalid timeline metadata', { type, error: result.error });
    return {};
  }
  return result.data;
}