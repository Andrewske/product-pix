# Refactor Timeline API to Use Database View

## Files to Modify/Create
- `src/lib/db/admin-timeline.ts` (modify - replace 416-line function)
- `src/lib/db/admin-timeline-schemas.ts` (new - Zod validation schemas)

## Implementation Details

### Step 1: Create Zod Validation Schemas

Create new file `src/lib/db/admin-timeline-schemas.ts`:

```typescript
import { z } from 'zod';

export const jobMetadataSchema = z.object({
  template_slug: z.string(),
  status: z.string(),
  credits_charged: z.number(),
  error_message: z.string().nullable().optional(),
  prompt: z.string(),
});

export const transactionMetadataSchema = z.object({
  transaction_type: z.string(),
  amount: z.number(),
  description: z.string().nullable().optional(),
  balance_after: z.number(),
});

export const messageMetadataSchema = z.object({
  content: z.string(),
  is_from_admin: z.boolean(),
  read_at: z.string().nullable().optional(),
});

export const imageMetadataSchema = z.object({
  file_key: z.string(),
  public_url: z.string(),
  is_favorite: z.boolean().optional(),
});

export const feedbackMetadataSchema = z.object({
  feedback_type: z.string(),
  comment: z.string().nullable().optional(),
  reasons: z.array(z.string()).optional(),
  image_id: z.string(),
});

export const errorMetadataSchema = z.object({
  error_name: z.string(),
  error_message: z.string(),
  domain: z.string(),
  severity: z.string(),
  resolved_at: z.string().nullable().optional(),
});

export const uploadMetadataSchema = z.object({
  filename: z.string(),
  file_size: z.number(),
  mime_type: z.string(),
});

export const activityMetadataSchema = z.record(z.unknown());

export const metadataSchemas = {
  job: jobMetadataSchema,
  transaction: transactionMetadataSchema,
  message: messageMetadataSchema,
  image: imageMetadataSchema,
  feedback: feedbackMetadataSchema,
  error: errorMetadataSchema,
  upload: uploadMetadataSchema,
  activity: activityMetadataSchema,
} as const;
```

**Pattern Source:** `src/lib/analytics/events.ts` - event validation pattern

---

### Step 2: Refactor getUnifiedTimeline Function

**File:** `src/lib/db/admin-timeline.ts`

Replace the entire `getUnifiedTimeline` function (lines 49-465) with:

```typescript
import { metadataSchemas } from './admin-timeline-schemas';

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
  let query = supabase
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
  if (filters?.startDate) {
    query = query.gte('timestamp', filters.startDate);
  }
  if (filters?.endDate) {
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
  const validatedEvents = events.map(row => ({
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
function generateTitle(row: { type: string; subtype: string; metadata: any }): string {
  switch (row.type) {
    case 'job':
      return `Generated image with ${row.metadata.template_slug} (${row.metadata.credits_charged} credits)`;
    case 'transaction':
      return `${row.metadata.transaction_type}: ${row.metadata.amount > 0 ? '+' : ''}${row.metadata.amount} credits`;
    case 'message':
      return row.metadata.is_from_admin ? 'Message from admin' : 'Message sent';
    case 'image':
      return row.metadata.title || 'Image generated';
    case 'feedback':
      return `Feedback: ${row.metadata.feedback_type}`;
    case 'error':
      return `${row.metadata.domain}: ${row.metadata.error_name}`;
    case 'upload':
      return `Uploaded ${row.metadata.filename}`;
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
```

## Acceptance Criteria

- [ ] New schemas file created with all 8 event type schemas
- [ ] `getUnifiedTimeline` function refactored from 416 lines to ~100 lines
- [ ] Function queries `user_timeline_view` instead of 8 separate tables
- [ ] Metadata validated with Zod before returning to client
- [ ] All existing timeline functionality preserved
- [ ] No TypeScript errors

## Testing Commands

```bash
# Type check
bun run typecheck

# Start dev server
bun run dev

# Test timeline endpoint (replace {userId} with actual admin user ID)
curl -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  "http://localhost:3000/api/admin/users/{userId}/timeline?limit=20"

# Test with type filter
curl "http://localhost:3000/api/admin/users/{userId}/timeline?types=job,transaction&limit=10"

# Test with date filter
curl "http://localhost:3000/api/admin/users/{userId}/timeline?startDate=2025-01-01T00:00:00Z&limit=10"
```

Expected: Timeline returns events from all 8 table types with correct metadata structure

## Dependencies

- Task 01 (database migrations - timeline view must exist)
- Task 02 (types regenerated - view types available)
